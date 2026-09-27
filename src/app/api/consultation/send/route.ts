import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY environment variable not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    const body = await request.json();
    const { name, email, phone, modality, preferredModality, notes } = body;
    const clinicalFocus = modality || preferredModality || "General Neuro-Longevity";

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: "Name and either email or phone are required." },
        { status: 400 }
      );
    }

    const emailHtml = `
<div style="font-family: sans-serif; background: #070B12; color: #E2E8F0; padding: 24px; border-radius: 8px;">
  <h2 style="color: #D4AF37; margin-top: 0;">New Free Consultation Request</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email || "Not provided"}</p>
  <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
  <p><strong>Area of Clinical Focus:</strong> ${clinicalFocus}</p>
  <p><strong>Clinical Notes / Inquiry:</strong></p>
  <blockquote style="border-left: 3px solid #D4AF37; margin: 12px 0; padding-left: 12px; color: #94A3B8;">
    ${notes || "No additional notes provided."}
  </blockquote>
  <hr style="border: 0; border-top: 1px solid #1E293B; margin: 20px 0;" />
  <p style="font-size: 12px; color: #64748B;">Dispatched via Cognitive Edge Clinic Secure Enclave • Winston-Salem, NC</p>
</div>
`.trim();

    const primaryFrom =
      process.env.RESEND_FROM_EMAIL ||
      "Cognitive Edge Clinic <intake@send.covenantspineandneurology.com>";
    const fallbackFrom = "Cognitive Edge Clinic <onboarding@resend.dev>";
    const recipient = "andreas.runheim@gmail.com";
    const subject = `New Consultation Request: ${name} [Cognitive Edge Clinic]`;

    let sendResult = await resend.emails.send({
      from: primaryFrom,
      to: [recipient],
      replyTo: email || undefined,
      subject,
      html: emailHtml,
    });

    if (sendResult.error) {
      console.warn("Primary sender failed, attempting fallback sender:", sendResult.error);
      sendResult = await resend.emails.send({
        from: fallbackFrom,
        to: [recipient],
        replyTo: email || undefined,
        subject,
        html: emailHtml,
      });
    }

    if (sendResult.error) {
      console.error("Resend dispatch error:", sendResult.error);
      return NextResponse.json(
        { error: sendResult.error.message || "Failed to dispatch consultation email." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Consultation request dispatched", data: sendResult.data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Consultation route exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
