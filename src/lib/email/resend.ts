/**
 * Resend Transactional Email Dispatcher
 *
 * Handles clinical intake notifications and priority pathway delivery
 * directly to the clinical concierge (andreas.runheim@gmail.com) with patient reply-to.
 */

export interface PathwayEmailPayload {
  submitterEmail: string;
  recipient?: string;
  selectedObjectives: string[];
  assessmentId: string;
  timestamp?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

const OBJECTIVE_METADATA: Record<string, { title: string; domain: string; desc: string }> = {
  "cognitive-endurance": {
    title: "Executive Cognitive Endurance",
    domain: "DLPFC & ATP Synthesis",
    desc: "Sustained prefrontal clarity, resolving afternoon brain fog, and mitochondrial energy optimization.",
  },
  "autonomic-hrv": {
    title: "Autonomic Regulation & Deep Sleep",
    domain: "Vagal Tone (rMSSD > 55ms)",
    desc: "Vagal tone fortification, sympathetic recalibration, and deep restorative slow-wave sleep expansion.",
  },
  "neurovascular": {
    title: "Neurovascular & Endothelial Health",
    domain: "Cerebral Perfusion & eNOS",
    desc: "Blood-brain barrier tight junction repair, nitric oxide bioavailability, and homocysteine clearance.",
  },
  "pelvic-core": {
    title: "Postural & Pelvic Core Stability",
    domain: "BTL Emsella 2.5 Tesla",
    desc: "Non-invasive HIFEM pelvic floor reinforcement intimately coupled with visceral autonomic tone.",
  },
};

export function buildPathwayEmailHtml(payload: PathwayEmailPayload): string {
  const { submitterEmail, selectedObjectives, assessmentId, timestamp } = payload;
  const formattedDate = timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString();

  const objectivesHtml = selectedObjectives
    .map((objId, idx) => {
      const meta = OBJECTIVE_METADATA[objId] || {
        title: objId,
        domain: "Personalized Protocol",
        desc: "Individual longevity optimization pathway target.",
      };
      return `
        <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.15);">
          <td style="padding: 16px 12px; vertical-align: top; color: #d4af37; font-weight: bold; font-family: monospace; font-size: 13px;">
            #0${idx + 1}
          </td>
          <td style="padding: 16px 12px; vertical-align: top;">
            <div style="font-family: monospace; font-size: 10px; color: #d4af37; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px;">
              ${meta.domain}
            </div>
            <div style="font-size: 16px; color: #ffffff; font-weight: 600; margin-bottom: 6px;">
              ${meta.title}
            </div>
            <div style="font-size: 13px; color: #a89f8c; line-height: 1.5;">
              ${meta.desc}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Clinical Intake: New Personalized Longevity Pathway</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #dfe2f1;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #121826; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);">
          <!-- Header Bar -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background: linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 24, 38, 0) 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
              <div style="font-family: monospace; font-size: 10px; color: #d4af37; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 8px;">
                COGNITIVE EDGE CLINIC &bull; CLINICAL CONCIERGE
              </div>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: normal; letter-spacing: 0.02em;">
                New Longevity Pathway Inquiry
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #a89f8c;">
                A prospective member has submitted priority clinical objectives.
              </p>
            </td>
          </tr>

          <!-- Patient Meta Card -->
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 12px;">
                    <span style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #99907c; display: block; margin-bottom: 2px;">Patient / Submitter</span>
                    <a href="mailto:${submitterEmail}" style="font-size: 15px; color: #d4af37; text-decoration: none; font-weight: 600;">${submitterEmail}</a>
                  </td>
                  <td style="padding: 8px 12px; text-align: right;">
                    <span style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #99907c; display: block; margin-bottom: 2px;">Intake Reference</span>
                    <span style="font-family: monospace; font-size: 11px; color: #dfe2f1;">${assessmentId.slice(0, 8)}...</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #99907c; font-family: monospace;">
                    Submitted: ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Objectives Section -->
          <tr>
            <td style="padding: 16px 32px 28px 32px;">
              <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #d4af37; margin-bottom: 12px;">
                Selected Priority Objectives (${selectedObjectives.length})
              </div>
              <table width="100%" cellspacing="0" cellpadding="0">
                ${objectivesHtml}
              </table>
            </td>
          </tr>

          <!-- Action Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0b0f19; border-top: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
              <a href="mailto:${submitterEmail}?subject=Cognitive%20Edge%20Clinic%20%E2%80%94%20Your%20Personalized%20Longevity%20Pathway" style="display: inline-block; background-color: #d4af37; color: #0b0f19; text-decoration: none; font-weight: bold; font-family: monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 28px; border-radius: 9999px;">
                Reply Directly to Patient &rarr;
              </a>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #6e675b; font-family: monospace;">
                Zero-ePHI Standard &bull; Encrypted Clinical Transport &bull; Dr. Andreas Runheim, MD
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendPathwayInquiryEmail(
  payload: PathwayEmailPayload
): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = payload.recipient || "andreas.runheim@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Cognitive Edge Clinic <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("Notice: RESEND_API_KEY unconfigured. Email transmission simulated.");
    return {
      success: true,
      simulated: true,
    };
  }

  const html = buildPathwayEmailHtml(payload);
  const textSummary = [
    `=== COGNITIVE EDGE CLINIC: NEW LONGEVITY PATHWAY INQUIRY ===`,
    `Patient Email: ${payload.submitterEmail}`,
    `Intake Reference: ${payload.assessmentId}`,
    `Selected Priority Objectives:`,
    ...payload.selectedObjectives.map((obj, i) => `  ${i + 1}. ${obj}`),
    `Submitted At: ${payload.timestamp || new Date().toISOString()}`,
    `Reply to this email directly to contact the prospective patient.`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        reply_to: payload.submitterEmail,
        subject: `[Clinical Intake] New Longevity Pathway from ${payload.submitterEmail}`,
        html,
        text: textSummary,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API delivery error:", data);
      return {
        success: false,
        error: data.message || "Failed to dispatch email via Resend.",
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Resend network exception:", msg);
    return {
      success: false,
      error: msg,
    };
  }
}
