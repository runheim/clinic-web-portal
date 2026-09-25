import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, verifyPassword, createSessionToken } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { LoginSchema, parseAndValidateJson } from "@/lib/security/validation/schemas";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: rlHeaders,
      }
    );
  }

  try {
    const validation = await parseAndValidateJson(request, LoginSchema);
    if (!validation.success) {
      const isMissingCreds =
        validation.error.code === "VALIDATION_ERROR" &&
        Array.isArray(validation.error.details) &&
        validation.error.details.some(
          (d: { path: string }) => d.path === "password" || d.path === "email"
        );

      const errorMessage = isMissingCreds
        ? "Email and password are required."
        : validation.error.error;

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

    const member = await getMember(email);
    if (!member) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401, headers: rlHeaders }
      );
    }

    const isValid = verifyPassword(password, member.salt, member.hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401, headers: rlHeaders }
      );
    }

    const token = createSessionToken(email);
    const response = NextResponse.json(
      { success: true, email: member.email },
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
      { error: "Authentication service unavailable." },
      { status: 500, headers: rlHeaders }
    );
  }
}
