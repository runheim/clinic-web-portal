import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, verifyPassword, createSessionToken } from "@/lib/auth/server";
import { checkRateLimit } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIpFromForwarded = forwarded ? forwarded.split(",")[0]?.trim() : null;
    const clientIpFromReal = request.headers.get("x-real-ip")?.trim();
    const ip = clientIpFromForwarded || clientIpFromReal || "127.0.0.1";

    const rateLimit = checkRateLimit(ip, "/api/auth/login");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
            "X-RateLimit-Remaining": String(rateLimit.remainingTokens),
            "X-RateLimit-Reset": String(rateLimit.resetTime),
          },
        }
      );
    }
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const member = await getMember(email);
    if (!member) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = verifyPassword(password, member.salt, member.hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = createSessionToken(email);
    const response = NextResponse.json({ success: true, email: member.email });

    response.cookies.set("clinic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 500 });
  }
}
