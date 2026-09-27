import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findUserByEmail } from "@/lib/auth/userStore";
import { compare } from "bcryptjs";
import { createSessionToken, verifyPassword, getMember } from "@/lib/auth/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import { LoginSchema, parseAndValidateJson } from "@/lib/security/validation/schemas";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip"))?.trim() ||
    "127.0.0.1";
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    // 1. Validate payload structure & protect against prototype pollution
    const validation = await parseAndValidateJson(request, LoginSchema);
    if (!validation.success) {
      const isMissingCreds =
        (validation.error.code === "VALIDATION_ERROR" || validation.error.code === "INVALID_PAYLOAD") &&
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

    // Validate presence of credentials
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400, headers: rlHeaders }
      );
    }

    // 2. Look up user record via unified userStore
    const user = (await findUserByEmail(email)) || (await getMember(email));
    if (!user) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[AUTH] User not found: ${email}`);
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: rlHeaders }
      );
    }

    // 3. Compare password against user.passwordHash with bcryptjs and scrypt fallback
    let isPasswordValid = false;
    try {
      if (user.passwordHash) {
        if (user.passwordHash.startsWith("$2")) {
          isPasswordValid = await compare(password, user.passwordHash);
        } else if (user.passwordHash.includes(":")) {
          const [salt, hash] = user.passwordHash.split(":");
          isPasswordValid = verifyPassword(password, salt, hash);
        } else {
          isPasswordValid = await compare(password, user.passwordHash);
        }
      } else if (user.salt && user.hash) {
        isPasswordValid = verifyPassword(password, user.salt, user.hash);
      }
    } catch {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[AUTH] Password verification failed for: ${email}`);
      }
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: rlHeaders }
      );
    }

    // 4. Development Logging
    if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
      console.log(`[AUTH] User verified: ${user.email}`);
    }

    // 5. Session / Token Generation
    const userRole = user.role || "client";
    const token = createSessionToken(user.email, userRole);

    const response = NextResponse.json(
      {
        success: true,
        redirectUrl: "/vault",
        role: userRole,
        email: user.email,
      },
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
  } catch (err) {
    console.error("[AUTH_LOGIN_ERROR]", err);
    return NextResponse.json(
      { error: "Authentication service unavailable." },
      { status: 500, headers: rlHeaders }
    );
  }
}
