import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip"))?.trim() || "127.0.0.1";
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
