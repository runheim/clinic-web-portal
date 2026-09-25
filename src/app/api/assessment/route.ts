import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { AssessmentSchema, parseAndValidateJson } from "@/lib/security/validation/schemas";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

/**
 * Public Clinical Pre-Screening Assessment Endpoint
 *
 * Requirements:
 * - Accepts POST requests containing assessment answers/scores
 * - Enforces strict schema validation via AssessmentSchema
 * - Enforces per-IP rate limiting: maximum 5 requests/minute
 * - Rejects prototype pollution attempts and oversized payloads (>64KB)
 * - Returns a sanitized summary adhering strictly to Zero-ePHI principles
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Resolve client IP for rate limiting
    const ip = getClientIp(request);

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

    const { answers, metadata } = validation.data;

    // 4. Compute sanitized non-identifying summary metrics
    const answerEntries = Object.entries(answers);
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

    const assessmentId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const sanitizedSummary = {
      assessmentId,
      status: "completed",
      quarantine: "ZERO_ePHI_ENFORCED",
      timestamp,
      metrics: {
        totalAnswers: answerEntries.length,
        numericAnswersCount: numericScores.length,
        categoricalAnswersCount: Object.keys(categoricalResponses).length,
        averageNumericScore: averageScore,
      },
      answerKeys: Object.keys(answers),
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    };

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
