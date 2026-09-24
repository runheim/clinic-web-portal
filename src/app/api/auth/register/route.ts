import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, saveMember, hashPassword, createSessionToken } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await getMember(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
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
    const response = NextResponse.json({ success: true, email: email.toLowerCase().trim() });
    
    response.cookies.set("clinic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal registration error";
    console.error("Registration error encountered:", err);
    return NextResponse.json({ error: `Registration error: ${message}` }, { status: 500 });
  }
}
