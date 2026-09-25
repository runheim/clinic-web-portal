import { NextRequest, NextResponse } from "next/server";
import { executeWithCircuitBreaker, getSpruceFallbackResponse } from "@/lib/circuitBreaker";
import { verifyHmacSignature } from "@/lib/crypto/signatures";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { CalcomWebhookSchema, hasPrototypePollution, MAX_PAYLOAD_BYTES } from "@/lib/security/validation/schemas";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip"))?.trim() || "127.0.0.1";
  const rateLimit = checkRateLimit(ip, "webhook");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many webhook requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const signature = request.headers.get("x-cal-signature-256");
    const secret = process.env.CALCOM_WEBHOOK_SECRET;

    // Fail closed: Webhook cannot accept events without an established verification secret
    if (!secret) {
      return NextResponse.json(
        { error: "Cal.com webhook integration is unconfigured or disabled." },
        { status: 503, headers: rlHeaders }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: "Missing HMAC signature header" },
        { status: 401, headers: rlHeaders }
      );
    }

    const rawBody = await request.text();

    const actualByteLength =
      typeof Buffer !== "undefined"
        ? Buffer.byteLength(rawBody, "utf8")
        : new TextEncoder().encode(rawBody).byteLength;

    if (actualByteLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed limit of 64KB.", code: "PAYLOAD_TOO_LARGE" },
        { status: 413, headers: rlHeaders }
      );
    }

    if (!verifyHmacSignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: "Invalid HMAC signature" },
        { status: 401, headers: rlHeaders }
      );
    }

    if (hasPrototypePollution(rawBody)) {
      return NextResponse.json(
        { error: "Prototype pollution attempt rejected.", code: "PROTOTYPE_POLLUTION_DETECTED" },
        { status: 400, headers: rlHeaders }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload.", code: "INVALID_JSON" },
        { status: 400, headers: rlHeaders }
      );
    }

    const validation = CalcomWebhookSchema.safeParse(parsed);
    if (!validation.success) {
      const formattedIssues = validation.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          code: "INVALID_PAYLOAD",
          details: formattedIssues,
        },
        { status: 400, headers: rlHeaders }
      );
    }

    const payload = validation.data;
    const eventType = payload.triggerEvent;

    // We specifically handle BOOKING_CREATED events
    if (eventType !== "BOOKING_CREATED") {
      return NextResponse.json(
        { message: `Event ${eventType} acknowledged without action` },
        { status: 200, headers: rlHeaders }
      );
    }

    const bookingData = (payload.payload as Record<string, unknown>) || payload;
    const attendees = (bookingData.attendees as Array<Record<string, unknown>>) || [];
    const primaryAttendee = (attendees[0] as { name?: string; email?: string; phoneNumber?: string } | undefined) || {
      name: typeof bookingData.name === "string" ? bookingData.name : undefined,
      email: typeof bookingData.email === "string" ? bookingData.email : undefined,
    };

    if (!primaryAttendee?.email) {
      return NextResponse.json(
        { error: "Missing attendee email in webhook payload" },
        { status: 400, headers: rlHeaders }
      );
    }

    // Prepare Spruce Contact Card Payload
    // Zero-ePHI Enforcement: strictly administrative contact data (name, email, phone, appointment time)
    const spruceContactPayload = {
      displayName: primaryAttendee.name || "Patient Intake Candidate",
      emails: [{ value: primaryAttendee.email, type: "primary" }],
      phones: primaryAttendee.phoneNumber
        ? [{ value: primaryAttendee.phoneNumber, type: "mobile" }]
        : [],
      notes: `Cal.com Consultation Booking Ref: ${bookingData.uid || bookingData.id || "N/A"} - Event: ${
        bookingData.title || "Neuro-Diagnostic Consultation"
      } at ${bookingData.startTime}`,
      tags: ["Cal.com Bridge", "Zero-ePHI Candidate", "Diagnostic Consultation"],
    };

    const spruceApiKey = process.env.SPRUCE_API_KEY;

    let spruceStatus = "simulated_local_relay";
    let spruceResponseData: Record<string, unknown> = {
      mockProvisioned: true,
      message: "Spruce API Key not configured; payload validated and simulated successfully.",
    };

    if (spruceApiKey) {
      const breakerResult = await executeWithCircuitBreaker(
        "spruce",
        async () => {
          const spruceResponse = await fetch(
            "https://api.sprucehealth.com/v1/contacts",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${spruceApiKey}`,
              },
              body: JSON.stringify(spruceContactPayload),
            }
          );

          if (!spruceResponse.ok) {
            const err = new Error(`Spruce API responded with HTTP ${spruceResponse.status}`);
            (err as unknown as { statusText?: string }).statusText = spruceResponse.statusText || "Bad Gateway";
            throw err;
          }

          return await spruceResponse.json().catch(() => ({
            statusText: spruceResponse.statusText,
          }));
        },
        async (err) => {
          const fallback = getSpruceFallbackResponse({
            name: primaryAttendee.name,
            email: primaryAttendee.email,
          });
          const statusText = (err as unknown as { statusText?: string })?.statusText || "Bad Gateway";
          return {
            ...fallback,
            statusText,
          };
        }
      );

      spruceStatus = breakerResult.fromFallback ? "failed" : "provisioned";
      spruceResponseData = breakerResult.data as Record<string, unknown>;
    }

    return NextResponse.json(
      {
        status: "success",
        event: "BOOKING_CREATED",
        spruceRelayStatus: spruceStatus,
        candidate: {
          name: primaryAttendee.name,
          email: primaryAttendee.email,
          startTime: bookingData.startTime,
        },
        spruceResponse: spruceResponseData,
      },
      { status: 200, headers: rlHeaders }
    );
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return NextResponse.json(
      {
        error: "Internal webhook processing error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: rlHeaders }
    );
  }
}
