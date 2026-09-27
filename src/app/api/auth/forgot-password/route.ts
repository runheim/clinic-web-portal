import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { findUserByEmail, saveUser } from "@/lib/auth/userStore";
import { Resend } from "resend";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400, headers: rlHeaders }
      );
    }
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400, headers: rlHeaders }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);

    if (user) {
      // 1. Generate secure crypto reset token (32 bytes entropy)
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = Date.now() + 1000 * 60 * 60; // 1-hour expiration

      // 2. Persist token to user store
      user.resetToken = token;
      user.resetTokenExpiry = expiry;
      await saveUser(user);

      // 3. Resolve request origin
      const origin =
        request.nextUrl.origin ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://cognitive-wellness.netlify.app";
      const resetLink = `${origin}/reset-password?token=${token}`;

      // 4. Dispatch obsidian-styled reset email via Resend if key is configured
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        try {
          const resend = new Resend(apiKey);
          const fromEmail =
            process.env.RESEND_FROM_EMAIL ||
            "Cognitive Edge Clinic <intake@send.covenantspineandneurology.com>";
          const fallbackFrom = "Cognitive Edge Clinic <onboarding@resend.dev>";

          const emailHtml = `
<div style="font-family: Arial, sans-serif; background: #070B12; color: #E2E8F0; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1E293B;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #D4AF37; font-size: 20px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">Cognitive Edge Clinic</h1>
    <p style="color: #64748B; font-size: 11px; font-family: monospace; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px;">Zero-ePHI Member Portal</p>
  </div>
  
  <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Password Reset Authorization</h2>
  <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
    A request was received to reset the portal credentials associated with <strong>${normalizedEmail}</strong>. This single-use authorization token remains active for 60 minutes.
  </p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="${resetLink}" style="background: #D4AF37; color: #070B12; font-weight: bold; font-family: monospace; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; padding: 14px 28px; border-radius: 9999px; text-decoration: none; display: inline-block;">
      Reset Portal Password &rarr;
    </a>
  </div>

  <p style="color: #64748B; font-size: 12px; line-height: 1.5;">
    If you did not initiate this credential reset, you can safely disregard this notification. Your current password remains active and unmodified.
  </p>

  <hr style="border: 0; border-top: 1px solid #1E293B; margin: 24px 0;" />
  <p style="font-size: 11px; color: #475569; font-family: monospace; text-align: center;">
    Cognitive Edge Clinical Group • Zero-ePHI Architecture • Winston-Salem, NC
  </p>
</div>
`.trim();

          let sendResult = await resend.emails.send({
            from: fromEmail,
            to: [normalizedEmail],
            subject: "Password Reset Authorization — Cognitive Edge Clinic",
            html: emailHtml,
          });

          if (sendResult.error) {
            console.warn("[AUTH] Primary Resend sender failed, trying fallback:", sendResult.error);
            sendResult = await resend.emails.send({
              from: fallbackFrom,
              to: [normalizedEmail],
              subject: "Password Reset Authorization — Cognitive Edge Clinic",
              html: emailHtml,
            });
          }
        } catch (mailErr) {
          console.error("[AUTH] Resend dispatch error during password reset:", mailErr);
        }
      } else {
        console.warn(`[AUTH] RESEND_API_KEY unconfigured. Reset link generated: ${resetLink}`);
      }
    }

    // Always return clean uniform 200 response to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email address, a password reset link has been dispatched.",
      },
      { status: 200, headers: rlHeaders }
    );
  } catch (err) {
    console.error("[FORGOT_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Password reset service temporarily unavailable." },
      { status: 500, headers: rlHeaders }
    );
  }
}
