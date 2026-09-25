import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, saveMember, hashPassword, createSessionToken } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { RegisterSchema, parseAndValidateJson } from "@/lib/security/validation/schemas";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: rlHeaders,
      }
    );
  }

  try {
    const validation = await parseAndValidateJson(request, RegisterSchema);
    if (!validation.success) {
      let errorMessage = validation.error.error;
      if (validation.error.code === "VALIDATION_ERROR" && Array.isArray(validation.error.details)) {
        const emailIssue = validation.error.details.find(
          (d: { path: string }) => d.path === "email"
        );
        const passIssue = validation.error.details.find(
          (d: { path: string }) => d.path === "password"
        );
        if (emailIssue) {
          errorMessage = "Please provide a valid email address.";
        } else if (passIssue) {
          errorMessage = "Password must be at least 6 characters.";
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: validation.error.code,
          details: validation.error.details,
        },
        {
          status: validation.errorResponse.status,
          headers: rlHeaders,
        }
      );
    }

    const { email, password } = validation.data;

    const existing = await getMember(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409, headers: rlHeaders }
      );
    }

    const { salt, hash } = hashPassword(password);
    await saveMember({
      email: email.toLowerCase().trim(),
      salt,
      hash,
      createdAt: new Date().toISOString(),
    });

    const token = createSessionToken(email);
    const response = NextResponse.json(
      { success: true, email: email.toLowerCase().trim() },
      { status: 200, headers: rlHeaders }
    );

    response.cookies.set("clinic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Registration service unavailable." },
      { status: 500, headers: rlHeaders }
    );
  }
}
