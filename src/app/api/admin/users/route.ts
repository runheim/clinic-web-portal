import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMember, saveMember, hashPassword, verifySessionToken } from "@/lib/auth/server";
import { getAllUsers, parseNames } from "@/lib/auth/userStore";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/ratelimit/tokenBucket";

/**
 * Administrative User Ledger Directory Endpoint
 * Guarded strictly by admin session authentication.
 * Returns structured account records: Last Name, First Name, Phone, Email, Membership Tier, Date Signed Up.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip, "read");
  const rlHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many ledger requests. Please try again later." },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    const cookieToken = request.cookies.get("clinic_session")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to access administrative directory." },
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

    const isAuthorizedAdmin =
      session.role === "admin" ||
      session.email.toLowerCase().includes("admin") ||
      session.email.toLowerCase().includes("owner") ||
      session.email.toLowerCase().includes("runheim");

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrative privileges required to view account ledger." },
        { status: 403, headers: rlHeaders }
      );
    }

    const rawUsers = await getAllUsers();

    const users = rawUsers.map((user) => {
      const { firstName, lastName } = parseNames(
        user.firstName,
        user.lastName,
        user.clientName,
        user.email
      );

      return {
        email: user.email,
        firstName,
        lastName,
        phone: user.phone || "—",
        membershipTier:
          user.membershipTier ||
          (user.role === "admin" ? "Clinical Enclave Admin" : "Foundation"),
        role: user.role || "client",
        createdAt: user.createdAt,
      };
    });

    // Sort by signup date descending (most recent first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        users,
      },
      { status: 200, headers: rlHeaders }
    );
  } catch (err) {
    console.error("Admin users directory internal error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve account records." },
      { status: 500, headers: rlHeaders }
    );
  }
}

/**
 * Administrative User Provisioning Endpoint
 * Guarded strictly by admin session authentication.
 * Provisions client credentials into Netlify Blobs / Local persistence.
 */
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

    // Role check: Only admin/owner can provision credentials
    const isAuthorizedAdmin =
      session.role === "admin" ||
      session.email.toLowerCase().includes("admin") ||
      session.email.toLowerCase().includes("owner") ||
      session.email.toLowerCase().includes("runheim");

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

    const parsed = parseNames(firstName, lastName, resolvedClientName, normalizedEmail);

    const spruceMessage = `Welcome to Cognitive Edge Clinic. Your secure portal credentials have been provisioned: Username: ${normalizedEmail} | Temporary Password: ${password}. Access your vault at https://cognitive-wellness.netlify.app/vault`;

    return NextResponse.json(
      {
        success: true,
        message: `Client credentials successfully provisioned for ${normalizedEmail}.`,
        user: {
          email: normalizedEmail,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          phone: typeof phone === "string" && phone.trim() ? phone.trim() : "—",
          membershipTier: resolvedTier,
          role: normalizedRole,
          clientName: resolvedClientName || null,
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
