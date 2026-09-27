import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, saveMember, hashPassword, verifySessionToken } from "@/lib/auth/server";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "auth");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many provisioning requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    // 1. Strict Authorization Gate: Session inspection
    const cookieToken = request.cookies.get("clinic_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to access staff provisioning." },
        { status: 401, headers: rlHeaders }
      );
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in." },
        { status: 401, headers: rlHeaders }
      );
    }

    const isAuthorizedAdmin = session.role === "admin";

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required to provision client credentials." },
        { status: 403, headers: rlHeaders }
      );
    }

    // 2. Parse & Validate Payload
    let body: {
      email?: string;
      password?: string;
      role?: string;
      clientName?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      membershipTier?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400, headers: rlHeaders }
      );
    }

    const {
      email,
      password,
      role = "client",
      clientName,
      firstName,
      lastName,
      phone,
      membershipTier,
    } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid client email address is required." },
        { status: 400, headers: rlHeaders }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters for provisioned credentials." },
        { status: 400, headers: rlHeaders }
      );
    }

    const normalizedRole: "client" | "admin" = role === "admin" ? "admin" : "client";
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Prevent duplicate account registration
    const existing = await getMember(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: `An account with email ${normalizedEmail} already exists.` },
        { status: 409, headers: rlHeaders }
      );
    }

    // 4. Securely hash and store in Netlify Blobs / Local persistence
    const { salt, hash } = hashPassword(password);
    const createdAt = new Date().toISOString();

    const resolvedClientName =
      (typeof clientName === "string" && clientName.trim()) ||
      (firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : firstName?.trim() || undefined);

    const resolvedTier =
      (typeof membershipTier === "string" && membershipTier.trim()) ||
      (normalizedRole === "admin" ? "Clinical Enclave Admin" : "Foundation");

    await saveMember({
      email: normalizedEmail,
      salt,
      hash,
      role: normalizedRole,
      clientName: resolvedClientName,
      firstName: typeof firstName === "string" ? firstName.trim() : undefined,
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      membershipTier: resolvedTier,
      createdAt,
    });

    const spruceMessage = `Welcome to Cognitive Edge Clinic. Your secure portal credentials have been provisioned: Username: ${normalizedEmail} | Temporary Password: ${password}. Access your vault at https://cognitive-wellness.netlify.app/vault`;

    return NextResponse.json(
      {
        success: true,
        message: `Client credentials successfully provisioned for ${normalizedEmail}.`,
        user: {
          email: normalizedEmail,
          role: normalizedRole,
          clientName: resolvedClientName || null,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          membershipTier: resolvedTier,
          createdAt,
        },
        spruceMessage,
      },
      { status: 201, headers: rlHeaders }
    );
  } catch (err) {
    console.error("Staff provisioning internal error:", err);
    return NextResponse.json(
      { error: "Failed to provision user credentials." },
      { status: 500, headers: rlHeaders }
    );
  }
}
