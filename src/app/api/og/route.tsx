import { NextRequest } from "next/server";
import { canvasRenderer, verifyOgSignature } from "@/lib/og/canvasRenderer";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { hasPrototypePollution, OgQuerySchema } from "@/lib/security/validation/schemas";

export const runtime = "edge";

/**
 * Edge endpoint serving dynamically generated and cryptographically signed
 * OpenGraph preview cards for the Cognitive Edge Clinic portal.
 *
 * Query Parameters:
 * - title (string, optional): Modality or topic name. Defaults to clinic core modality.
 * - category (string, optional): Clinical category badge.
 * - subtitle (string, optional): Clinical context subtitle.
 * - sig (string, optional): HMAC-SHA256 signature to verify parameter integrity.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip, "default");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        code: "RATE_LIMITED",
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          ...rlHeaders,
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });

    if (hasPrototypePollution(rawParams)) {
      return new Response(
        JSON.stringify({
          error: "Prototype pollution attempt rejected.",
          code: "PROTOTYPE_POLLUTION_DETECTED",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            ...rlHeaders,
          },
        }
      );
    }

    const validation = OgQuerySchema.safeParse(rawParams);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters.",
          code: "VALIDATION_ERROR",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            ...rlHeaders,
          },
        }
      );
    }

    const rawTitle = searchParams.get("title");
    const rawCategory = searchParams.get("category");
    const rawSubtitle = searchParams.get("subtitle");
    const sig = searchParams.get("sig");

    // Default title when none is provided
    const defaultTitle =
      "Autonomic Vitality & Neuro-Metabolic Resuscitation";

    // Sanitize and normalize title
    const title =
      rawTitle && rawTitle.trim().length > 0
        ? rawTitle.slice(0, 140).trim()
        : defaultTitle;

    // Optional cryptographic signature validation
    if (sig) {
      const isValid = verifyOgSignature(title, sig);
      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: "Forbidden: Cryptographic signature verification failed",
            code: "INVALID_OG_SIGNATURE",
            zero_ephi_status: "quarantined",
          }),
          {
            status: 403,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store, max-age=0",
              "x-zero-ephi-quarantine": "enforced",
              ...rlHeaders,
            },
          }
        );
      }
    }

    // Sanitize and normalize category & subtitle
    const category =
      rawCategory && rawCategory.trim().length > 0
        ? rawCategory.slice(0, 80).trim()
        : "QUANTITATIVE NEUROSCIENCE & REGENERATIVE METABOLISM";

    const subtitle =
      rawSubtitle && rawSubtitle.trim().length > 0
        ? rawSubtitle.slice(0, 160).trim()
        : "Discreet Concierge Neurology & Stoichiometric Neuro-Metabolic Resuscitation";

    const response = canvasRenderer({
      title,
      category,
      subtitle,
    });

    for (const [key, value] of Object.entries(rlHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  } catch {
    // Quarantine error details from leaking potential ePHI or internal stack traces
    return new Response(
      JSON.stringify({
        error: "Internal Server Error rendering OpenGraph image",
        quarantine: "enforced",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "x-zero-ephi-quarantine": "enforced",
          ...rlHeaders,
        },
      }
    );
  }
}
