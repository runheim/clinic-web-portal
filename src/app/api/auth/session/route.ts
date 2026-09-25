import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";
import {
  hasPrototypePollution,
  parseAndValidateJson,
  SessionRequestSchema,
  SessionTokenFormatSchema,
} from "@/lib/security/validation/schemas";

/**
 * Session Verification Endpoint (GET /api/auth/session)
 *
 * Verifies session credentials from either:
 * - `clinic_session` HttpOnly cookie
 * - `Authorization: Bearer <token>` header
 *
 * Enforces strict formatting via SessionTokenFormatSchema and fail-closed security.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "session");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many session requests. Please try again later." },
      {
        status: 429,
        headers: rlHeaders,
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    if (hasPrototypePollution(searchParams.toString())) {
      return NextResponse.json(
        { error: "Prototype pollution attempt rejected.", code: "PROTOTYPE_POLLUTION_DETECTED" },
        { status: 400, headers: rlHeaders }
      );
    }

    // 1. Extract token from cookie
    const cookieToken = request.cookies.get("clinic_session")?.value;

    // 2. Extract token from Authorization Bearer header
    let bearerToken: string | undefined;
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch) {
        bearerToken = bearerMatch[1].trim();
      } else {
        // Malformed authorization header -> fail closed
        return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
      }
    }

    const rawToken = cookieToken || bearerToken;
    if (!rawToken || rawToken.trim().length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    // 3. Strict schema validation of session token structure (two base64url segments separated by a dot)
    const tokenValidation = SessionTokenFormatSchema.safeParse(rawToken);
    if (!tokenValidation.success) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    // 4. Cryptographic HMAC verification and expiry validation
    const session = verifySessionToken(tokenValidation.data);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    return NextResponse.json(
      { authenticated: true, email: session.email },
      { status: 200, headers: rlHeaders }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
  }
}

/**
 * Session Verification Endpoint (POST /api/auth/session)
 * Accepts structured JSON body `{ token?: string }` with strict schema validation.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "session");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many session requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const validation = await parseAndValidateJson(request, SessionRequestSchema);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const authHeader = request.headers.get("authorization");
    let bearerToken: string | undefined;
    if (authHeader) {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch) {
        bearerToken = bearerMatch[1].trim();
      }
    }

    const rawToken =
      validation.data.token ||
      request.cookies.get("clinic_session")?.value ||
      bearerToken;

    if (!rawToken || rawToken.trim().length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    const tokenValidation = SessionTokenFormatSchema.safeParse(rawToken);
    if (!tokenValidation.success) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    const session = verifySessionToken(tokenValidation.data);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
    }

    return NextResponse.json(
      { authenticated: true, email: session.email },
      { status: 200, headers: rlHeaders }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
  }
}
