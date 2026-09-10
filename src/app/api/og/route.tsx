import { NextRequest } from "next/server";
import { canvasRenderer, verifyOgSignature } from "@/lib/og/canvasRenderer";

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
  try {
    const { searchParams } = new URL(req.url);

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

    return canvasRenderer({
      title,
      category,
      subtitle,
    });
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
        },
      }
    );
  }
}
