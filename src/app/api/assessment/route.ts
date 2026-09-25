import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AssessmentSchema, parseAndValidateJson } from "@/lib/security/validation/schemas";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { savePathwayInquiry, PathwayInquiryRecord } from "@/lib/assessment/pathwayStore";
import { sendPathwayInquiryEmail } from "@/lib/email/resend";

export const DEFAULT_CLINICAL_RECIPIENT = "andreas.runheim@gmail.com";

/**
 * Public Clinical Pre-Screening & Longevity Pathway Assessment Endpoint
 *
 * Requirements:
 * - Accepts POST requests containing assessment answers or pathway objectives with email
 * - Enforces strict schema validation via AssessmentSchema
 * - Enforces per-IP rate limiting: maximum 5 requests/minute
 * - Rejects prototype pollution attempts and oversized payloads (>64KB)
 * - Persists pathway inquiries into Netlify Blobs store pathway_inquiries with local disk fallback
 * - Logs structured dispatch to clinical team
 * - Returns a sanitized summary adhering strictly to Zero-ePHI principles
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Resolve client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip"))?.trim() || "127.0.0.1";

    // 2. Strict rate limiting: 5 requests / minute per IP
    const rateLimit = checkRateLimit(ip, "/api/assessment", {
      capacity: 5,
      refillRatePerMinute: 5,
      windowMs: 60_000,
    });
    const rlHeaders = getRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many assessment submissions. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            ...rlHeaders,
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // 3. Strict payload validation with prototype pollution and 64KB size enforcement
    const validation = await parseAndValidateJson(request, AssessmentSchema);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { answers, metadata, email, selectedObjectives, targetRecipient } = validation.data;

    const assessmentId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 4. Compute sanitized non-identifying summary metrics
    const answerEntries = answers ? Object.entries(answers) : [];
    const numericScores: number[] = [];
    const categoricalResponses: Record<string, string> = {};

    for (const [key, value] of answerEntries) {
      if (typeof value === "number") {
        numericScores.push(value);
      } else {
        categoricalResponses[key] = value;
      }
    }

    const averageScore =
      numericScores.length > 0
        ? Math.round(
            (numericScores.reduce((sum, current) => sum + current, 0) / numericScores.length) * 100
          ) / 100
        : null;

    const sanitizedSummary = {
      assessmentId,
      status: "completed",
      quarantine: "ZERO_ePHI_ENFORCED",
      timestamp,
      selectedObjectives: selectedObjectives && selectedObjectives.length > 0 ? selectedObjectives : undefined,
      metrics: {
        totalAnswers: answerEntries.length,
        numericAnswersCount: numericScores.length,
        categoricalAnswersCount: Object.keys(categoricalResponses).length,
        averageNumericScore: averageScore,
      },
      answerKeys: answers ? Object.keys(answers) : [],
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    // 5. Handle pathway submission if email and selectedObjectives are provided
    if (email && selectedObjectives && selectedObjectives.length > 0) {
      const recipient = targetRecipient || DEFAULT_CLINICAL_RECIPIENT;

      // Format clinical intake record
      const formattedIntake = [
        "=== CLINICAL INTAKE RECORD: PERSONALIZED LONGEVITY PATHWAY ===",
        `Intended Recipient: ${recipient}`,
        `Assigned Clinician: ${recipient}`,
        `Submitter Email: ${email}`,
        `Intake ID: ${assessmentId}`,
        `Submission Timestamp: ${timestamp}`,
        "Selected Priority Objectives:",
        ...selectedObjectives.map((obj, idx) => `  ${idx + 1}. ${obj}`),
      ].join("\n");

      const pathwayRecord: PathwayInquiryRecord = {
        id: assessmentId,
        submitterEmail: email,
        targetRecipient: recipient,
        objectives: selectedObjectives,
        submittedAt: timestamp,
        formattedIntake,
        status: "dispatched",
        metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      // Persist into Netlify Blobs store pathway_inquiries (with local disk fallback)
      await savePathwayInquiry(pathwayRecord);

      // Transmit transactional clinical email via Resend
      const emailResult = await sendPathwayInquiryEmail({
        submitterEmail: email,
        recipient,
        selectedObjectives,
        assessmentId,
        timestamp,
      });

      // Structured clinical dispatch log
      console.log(
        `[CLINICAL DISPATCH] Intended recipient: ${recipient} | Submitter: ${email} | Objectives: ${selectedObjectives.join(", ")}`
      );
      if (emailResult.id) {
        console.log(`[RESEND DISPATCH] ID: ${emailResult.id}`);
      }

      return NextResponse.json(
        {
          success: true,
          recipient,
          message: "Objectives successfully transmitted to clinical team.",
          summary: sanitizedSummary,
        },
        {
          status: 200,
          headers: {
            ...rlHeaders,
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-Zero-ePHI-Quarantine": "enforced",
          },
        }
      );
    }

    // 6. Default response for standard answers submissions
    return NextResponse.json(
      {
        success: true,
        summary: sanitizedSummary,
      },
      {
        status: 200,
        headers: {
          ...rlHeaders,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Zero-ePHI-Quarantine": "enforced",
        },
      }
    );
  } catch {
    // Sanitized fail-closed response preventing any internal exception or stack leakage
    return NextResponse.json(
      {
        error: "Assessment processing service unavailable.",
        code: "INTERNAL_ERROR",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Zero-ePHI-Quarantine": "enforced",
        },
      }
    );
  }
}
