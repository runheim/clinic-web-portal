import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

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

  const token = request.cookies.get("clinic_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: rlHeaders });
  }

  return NextResponse.json(
    { authenticated: true, email: session.email },
    { status: 200, headers: rlHeaders }
  );
}
