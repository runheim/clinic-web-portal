import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { findUserByResetToken, saveUser } from "@/lib/auth/userStore";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "A valid authorization reset token is required." },
        { status: 400, headers: rlHeaders }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters in length." },
        { status: 400, headers: rlHeaders }
      );
    }

    // 1. Locate user by valid token
    const user = await findUserByResetToken(token.trim());

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token. Please request a new link." },
        { status: 400, headers: rlHeaders }
      );
    }

    // 2. Hash new password with bcryptjs and scrypt fallback
    const passwordHash = await bcrypt.hash(password, 10);
    const salt = crypto.randomBytes(16).toString("hex");
    const scryptHash = crypto.scryptSync(password, salt, 64).toString("hex");

    // 3. Clear reset token & persist updated credentials
    user.passwordHash = passwordHash;
    user.salt = salt;
    user.hash = scryptHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await saveUser(user);

    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH] Password successfully reset for: ${user.email}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password successfully updated. You may now sign in with your new credentials.",
      },
      { status: 200, headers: rlHeaders }
    );
  } catch (err) {
    console.error("[RESET_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500, headers: rlHeaders }
    );
  }
}
