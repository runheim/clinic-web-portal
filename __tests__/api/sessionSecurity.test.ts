import { NextRequest } from "next/server";
import { GET as sessionHandler, POST as sessionPostHandler } from "@/app/api/auth/session/route";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/server";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import crypto from "crypto";

describe("API Security Battery: Session Security & Cookie Hardening", () => {
  const originalEnv = process.env;
  const AUTH_SECRET = "production_secure_clinical_auth_secret_key_9944";

  beforeEach(() => {
    resetRateLimits();
    jest.resetModules();
    process.env = {
      ...originalEnv,
      CLINIC_AUTH_SECRET: AUTH_SECRET,
    };
  });

  afterAll(() => {
    resetRateLimits();
    process.env = originalEnv;
  });

  const createSessionRequest = (
    cookieValue?: string | null,
    ip: string = "198.51.100.80",
    customHeaders: Record<string, string> = {}
  ): NextRequest => {
    const headers = new Headers(customHeaders);
    headers.set("x-forwarded-for", ip);

    if (cookieValue !== undefined && cookieValue !== null) {
      headers.set("Cookie", `clinic_session=${cookieValue}`);
    }

    return new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
      method: "GET",
      headers,
    });
  };

  // ==========================================================================
  // 1. Cookie Tampering & Signature Mutation
  // ==========================================================================
  describe("1. Cookie Tampering & Signature Mutation", () => {
    test("rejects token with single-character mutated HMAC signature", async () => {
      const email = "neurologist@cognitiveedgeclinic.com";
      const validToken = createSessionToken(email);
      const [payload, sig] = validToken.split(".");

      // Flip the last character of the signature
      const lastChar = sig.slice(-1);
      const replacementChar = lastChar === "a" ? "b" : "a";
      const tamperedSig = sig.slice(0, -1) + replacementChar;
      const tamperedToken = `${payload}.${tamperedSig}`;

      const req = createSessionRequest(tamperedToken, "198.51.100.81");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("rejects token when payload claims identity of another user without matching signature", async () => {
      const legitimateToken = createSessionToken("patient@cognitiveedgeclinic.com");
      const [, originalSig] = legitimateToken.split(".");

      // Forge payload with target victim email
      const forgedPayload = Buffer.from(
        JSON.stringify({
          email: "chief.medical.officer@cognitiveedgeclinic.com",
          exp: Date.now() + 1000 * 60 * 60,
        })
      ).toString("base64url");

      const attackToken = `${forgedPayload}.${originalSig}`;

      const req = createSessionRequest(attackToken, "198.51.100.82");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
      expect(json.email).toBeUndefined();
    });

    test("rejects token with truncated signature", async () => {
      const token = createSessionToken("doctor@cognitiveedgeclinic.com");
      const [payload, sig] = token.split(".");
      const truncatedToken = `${payload}.${sig.slice(0, 16)}`;

      const req = createSessionRequest(truncatedToken, "198.51.100.83");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("rejects token with extended/oversized signature", async () => {
      const token = createSessionToken("doctor@cognitiveedgeclinic.com");
      const [payload, sig] = token.split(".");
      const oversizedToken = `${payload}.${sig}${"f".repeat(64)}`;

      const req = createSessionRequest(oversizedToken, "198.51.100.84");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("rejects token signed with an unauthorized external secret", async () => {
      const email = "patient@cognitiveedgeclinic.com";
      const payload = Buffer.from(
        JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 })
      ).toString("base64url");

      const rogueSignature = crypto
        .createHmac("sha256", "rogue_attacker_secret_key")
        .update(payload)
        .digest("base64url");

      const rogueToken = `${payload}.${rogueSignature}`;

      const req = createSessionRequest(rogueToken, "198.51.100.85");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });
  });

  // ==========================================================================
  // 2. Session Token Expiration
  // ==========================================================================
  describe("2. Session Token Expiration", () => {
    test("rejects token expired by 1 hour with authenticated: false", async () => {
      const email = "expired.user@cognitiveedgeclinic.com";
      const expiredTimestamp = Date.now() - 1000 * 60 * 60; // 1 hour in the past

      const expiredPayload = Buffer.from(
        JSON.stringify({ email, exp: expiredTimestamp })
      ).toString("base64url");

      const signature = crypto
        .createHmac("sha256", AUTH_SECRET)
        .update(expiredPayload)
        .digest("base64url");

      const expiredToken = `${expiredPayload}.${signature}`;

      // Direct primitive check
      expect(verifySessionToken(expiredToken)).toBeNull();

      // Route handler check
      const req = createSessionRequest(expiredToken, "198.51.100.86");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("rejects token expired by 1 millisecond", async () => {
      const email = "just.expired@cognitiveedgeclinic.com";
      const expiredPayload = Buffer.from(
        JSON.stringify({ email, exp: Date.now() - 1 })
      ).toString("base64url");

      const signature = crypto
        .createHmac("sha256", AUTH_SECRET)
        .update(expiredPayload)
        .digest("base64url");

      const expiredToken = `${expiredPayload}.${signature}`;

      expect(verifySessionToken(expiredToken)).toBeNull();

      const req = createSessionRequest(expiredToken, "198.51.100.87");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("accepts token that is active and unexpired", async () => {
      const email = "active.member@cognitiveedgeclinic.com";
      const activeToken = createSessionToken(email);

      const req = createSessionRequest(activeToken, "198.51.100.88");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        authenticated: true,
        email,
      });
    });
  });

  // ==========================================================================
  // 3. Invalid & Missing Cookie Handling
  // ==========================================================================
  describe("3. Invalid & Missing Cookie Handling", () => {
    test("returns authenticated: false when Cookie header is completely absent", async () => {
      const req = createSessionRequest(null, "198.51.100.89");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("returns authenticated: false when clinic_session cookie has empty string value", async () => {
      const req = createSessionRequest("", "198.51.100.90");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("returns authenticated: false when other cookies exist but clinic_session is missing", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
        method: "GET",
        headers: {
          Cookie: "theme=dark; ga_session=GS1.1.12345; clinic_analytics=opt_out",
          "x-forwarded-for": "198.51.100.91",
        },
      });
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("returns authenticated: false when token lacks dot separator", async () => {
      const malformedCookie = "eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQnosignature";
      const req = createSessionRequest(malformedCookie, "198.51.100.92");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("returns authenticated: false when token has multiple dots (too many segments)", async () => {
      const multiDotCookie = "segment1.segment2.segment3.segment4";
      const req = createSessionRequest(multiDotCookie, "198.51.100.93");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("returns authenticated: false when payload is non-base64 garbage", async () => {
      const garbageToken = "!@#$%^&*().validLookingSignature";
      const req = createSessionRequest(garbageToken, "198.51.100.94");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("fails closed with authenticated: false when CLINIC_AUTH_SECRET is unconfigured", async () => {
      const validToken = createSessionToken("doctor@cognitiveedgeclinic.com");

      // Strip CLINIC_AUTH_SECRET from environment
      delete process.env.CLINIC_AUTH_SECRET;

      expect(verifySessionToken(validToken)).toBeNull();

      const req = createSessionRequest(validToken, "198.51.100.95");
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });
  });

  // ==========================================================================
  // 4. Bearer Token & Request Structure Validation
  // ==========================================================================
  describe("4. Bearer Token & Request Structure Validation", () => {
    test("accepts valid session token via Authorization Bearer header", async () => {
      const email = "neurologist@cognitiveedgeclinic.com";
      const validToken = createSessionToken(email);

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "x-forwarded-for": "198.51.100.96",
        },
      });

      const res = await sessionHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        authenticated: true,
        email,
      });
    });

    test("fails closed when Authorization header does not follow Bearer format", async () => {
      const email = "neurologist@cognitiveedgeclinic.com";
      const validToken = createSessionToken(email);

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
        method: "GET",
        headers: {
          Authorization: `Basic ${validToken}`,
          "x-forwarded-for": "198.51.100.97",
        },
      });

      const res = await sessionHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ authenticated: false });
    });

    test("POST /api/auth/session validates session request structure", async () => {
      const email = "researcher@cognitiveedgeclinic.com";
      const validToken = createSessionToken(email);

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.98",
        },
        body: JSON.stringify({ token: validToken }),
      });

      const res = await sessionPostHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        authenticated: true,
        email,
      });
    });

    test("POST /api/auth/session strictly rejects unexpected properties with HTTP 400", async () => {
      const email = "researcher@cognitiveedgeclinic.com";
      const validToken = createSessionToken(email);

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.99",
        },
        body: JSON.stringify({ token: validToken, unauthorizedField: "malicious" }),
      });

      const res = await sessionPostHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
    });
  });
});
