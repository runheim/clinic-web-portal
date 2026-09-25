import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "session");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many logout requests. Please try again later." },
      {
        status: 429,
        headers: rlHeaders,
      }
    );
  }

  const response = NextResponse.json({ success: true }, { status: 200, headers: rlHeaders });
  response.cookies.delete("clinic_session");
  return response;
}
