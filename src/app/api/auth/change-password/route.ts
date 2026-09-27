import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { findUserByEmail, saveUser } from "@/lib/auth/userStore";
import { verifySessionToken, verifyPassword } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password change requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    // 1. Authenticate Session
    const cookieToken = request.cookies.get("clinic_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to change password." },
        { status: 401, headers: rlHeaders }
      );
    }

    const session = verifySessionToken(token);
    if (!session || !session.email) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401, headers: rlHeaders }
      );
    }

    // 2. Parse & Validate Request Body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400, headers: rlHeaders }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters in length." },
        { status: 400, headers: rlHeaders }
      );
    }

    // 3. Locate User Record
    const user = await findUserByEmail(session.email);
    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404, headers: rlHeaders }
      );
    }

    // 4. Verify Current Password
    let isCurrentValid = false;
    try {
      if (user.passwordHash) {
        if (user.passwordHash.startsWith("$2")) {
          isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
        } else if (user.passwordHash.includes(":")) {
          const [salt, hash] = user.passwordHash.split(":");
          isCurrentValid = verifyPassword(currentPassword, salt, hash);
        } else {
          isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
        }
      } else if (user.salt && user.hash) {
        isCurrentValid = verifyPassword(currentPassword, user.salt, user.hash);
      }
    } catch {
      isCurrentValid = false;
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password does not match our records." },
        { status: 401, headers: rlHeaders }
      );
    }

    // 5. Hash New Password and Save User
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newScryptHash = crypto.scryptSync(newPassword, newSalt, 64).toString("hex");

    user.passwordHash = newPasswordHash;
    user.salt = newSalt;
    user.hash = newScryptHash;

    await saveUser(user);

    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH] Password updated for member: ${user.email}`);
    }

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200, headers: rlHeaders }
    );
  } catch (err) {
    console.error("[CHANGE_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500, headers: rlHeaders }
    );
  }
}
