import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("clinic_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, email: session.email });
}
