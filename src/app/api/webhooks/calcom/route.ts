import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-cal-signature-256");
    const secret = process.env.CALCOM_WEBHOOK_SECRET;

    // HMAC Signature Verification (if secret is configured in environment)
    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(rawBody).digest("hex");
      if (signature !== digest) {
        return NextResponse.json(
          { error: "Invalid HMAC signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.triggerEvent || payload.event;

    // We specifically handle BOOKING_CREATED events
    if (eventType !== "BOOKING_CREATED") {
      return NextResponse.json(
        { message: `Event ${eventType} acknowledged without action` },
        { status: 200 }
      );
    }

    const bookingData = payload.payload || payload;
    const attendees = bookingData.attendees || [];
    const primaryAttendee = attendees[0] || {
      name: bookingData.name,
      email: bookingData.email,
    };

    if (!primaryAttendee?.email) {
      return NextResponse.json(
        { error: "Missing attendee email in webhook payload" },
        { status: 400 }
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

      spruceStatus = spruceResponse.ok ? "provisioned" : "failed";
      spruceResponseData = await spruceResponse.json().catch(() => ({
        statusText: spruceResponse.statusText,
      }));
    }

    return NextResponse.json({
      status: "success",
      event: "BOOKING_CREATED",
      spruceRelayStatus: spruceStatus,
      candidate: {
        name: primaryAttendee.name,
        email: primaryAttendee.email,
        startTime: bookingData.startTime,
      },
      spruceResponse: spruceResponseData,
    });
  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return NextResponse.json(
      {
        error: "Internal webhook processing error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
