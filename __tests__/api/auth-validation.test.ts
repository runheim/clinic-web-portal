/**
 * Phase 2 Automated Attack & Abuse Test Battery
 * Suite: Auth Endpoint Input Validation & Fuzz Resistance
 *
 * Verifies strict rejection of:
 * - Malformed JSON payloads (HTTP 400)
 * - Payloads with extra unrecognized keys (HTTP 400 via Zod strict schema)
 * - Payloads with missing credentials or invalid field types (HTTP 400)
 *
 * Zero-ePHI Compliant: Synthetic test identifiers only (e.g. member_test_01).
 */

import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import * as authServer from "@/lib/auth/server";

jest.mock("@/lib/auth/server", () => ({
  getMember: jest.fn(),
  saveMember: jest.fn(),
  hashPassword: jest.fn(() => ({ salt: "mock_salt_value", hash: "mock_hash_value" })),
  verifyPassword: jest.fn(),
  createSessionToken: jest.fn(() => "mock-token-xyz"),
  verifySessionToken: jest.fn(),
}));

describe("Phase 2 Battery: Auth Validation & Attack Resistance (__tests__/api/auth-validation.test.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetRateLimits();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CLINIC_AUTH_SECRET: "mock_clinic_auth_secret_phase2",
    };
  });

  afterAll(() => {
    resetRateLimits();
    process.env = originalEnv;
  });

  const createRequest = (
    url: string,
    body: string | object | null,
    ip = "198.51.100.80",
    headers: Record<string, string> = {}
  ): NextRequest => {
    const rawBody = body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
    const headerMap = new Headers({
      "x-forwarded-for": ip,
      ...headers,
    });
    if (rawBody !== null && !headerMap.has("Content-Type")) {
      headerMap.set("Content-Type", "application/json");
    }

    return new NextRequest(url, {
      method: "POST",
      headers: headerMap,
      body: rawBody,
    });
  };

  // ============================================================================
  // 1. Malformed JSON Payloads -> Expects HTTP 400
  // ============================================================================
  describe("1. Malformed JSON Payloads -> HTTP 400", () => {
    test("rejects unclosed JSON syntax with HTTP 400 (INVALID_JSON)", async () => {
      const malformedPayload = '{"email": "member_test_01@example.com", "password":';
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        malformedPayload,
        "198.51.100.81"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
      expect(json.error).toBe("Invalid JSON payload.");
    });

    test("rejects truncated JSON missing closing brace with HTTP 400", async () => {
      const truncatedPayload = '{"email": "member_test_01@example.com", "password": "mock-password-xyz"';
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        truncatedPayload,
        "198.51.100.82"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("rejects arbitrary non-JSON string with HTTP 400", async () => {
      const nonJsonString = "NOT_A_VALID_JSON_STRING_AT_ALL";
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        nonJsonString,
        "198.51.100.83"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("rejects empty body string with HTTP 400", async () => {
      const emptyPayload = "";
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        emptyPayload,
        "198.51.100.84"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("rejects malformed JSON on registration route with HTTP 400", async () => {
      const malformedPayload = '{"email": "member_test_01@example.com", broken: true}';
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        malformedPayload,
        "198.51.100.85"
      );

      const res = await registerHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });
  });

  // ============================================================================
  // 2. Extra Unrecognized Keys -> Expects HTTP 400
  // ============================================================================
  describe("2. Extra Unrecognized Keys -> HTTP 400", () => {
    test("rejects login request with unrecognized property (strict schema enforcement)", async () => {
      const hostilePayload = {
        email: "member_test_01@example.com",
        password: "mock-password-xyz",
        extraField: "unexpected_token_injection",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        hostilePayload,
        "198.51.100.86"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(Array.isArray(json.details)).toBe(true);
      expect(authServer.getMember).not.toHaveBeenCalled();
    });

    test("rejects privilege escalation fields (role, isAdmin, permissions) with HTTP 400", async () => {
      const privilegeEscalationPayload = {
        email: "member_test_01@example.com",
        password: "mock-password-xyz",
        role: "administrator",
        isAdmin: true,
        permissions: ["root", "all"],
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        privilegeEscalationPayload,
        "198.51.100.87"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(authServer.getMember).not.toHaveBeenCalled();
    });

    test("rejects prototype pollution keys with HTTP 400", async () => {
      const protoPollutionPayload =
        '{"email":"member_test_01@example.com","password":"mock-password-xyz","__proto__":{"polluted":true}}';

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        protoPollutionPayload,
        "198.51.100.88"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");
      expect((Object.prototype as unknown as { polluted?: boolean }).polluted).toBeUndefined();
    });

    test("rejects extra unrecognized keys on registration endpoint with HTTP 400", async () => {
      const extraKeyRegistration = {
        email: "member_test_01@example.com",
        password: "mock-password-xyz",
        unauthorizedData: "should_reject",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        extraKeyRegistration,
        "198.51.100.89"
      );

      const res = await registerHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(authServer.saveMember).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 3. Missing Credentials -> Expects HTTP 400
  // ============================================================================
  describe("3. Missing Credentials -> HTTP 400", () => {
    test("rejects completely empty JSON object with HTTP 400 and explicit message", async () => {
      const emptyObjectPayload = {};

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        emptyObjectPayload,
        "198.51.100.90"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(json.error).toBe("Email and password are required.");
    });

    test("rejects request missing password field with HTTP 400", async () => {
      const missingPasswordPayload = {
        email: "member_test_01@example.com",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        missingPasswordPayload,
        "198.51.100.91"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(json.error).toBe("Email and password are required.");
    });

    test("rejects request missing email field with HTTP 400", async () => {
      const missingEmailPayload = {
        password: "mock-password-xyz",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        missingEmailPayload,
        "198.51.100.92"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(json.error).toBe("Email and password are required.");
    });

    test("rejects empty string credentials with HTTP 400", async () => {
      const emptyStringsPayload = {
        email: "",
        password: "",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        emptyStringsPayload,
        "198.51.100.93"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
    });

    test("rejects malformed email format with HTTP 400", async () => {
      const malformedEmailPayload = {
        email: "not-a-valid-email-address",
        password: "mock-password-xyz",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        malformedEmailPayload,
        "198.51.100.94"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(json.details).toBeDefined();
    });

    test("rejects null credential fields with HTTP 400", async () => {
      const nullCredsPayload = {
        email: null,
        password: null,
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        nullCredsPayload,
        "198.51.100.95"
      );

      const res = await loginHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
    });

    test("rejects missing credentials on registration route with HTTP 400", async () => {
      const missingCredsRegister = {};

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        missingCredsRegister,
        "198.51.100.96"
      );

      const res = await registerHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(json.code);
      expect(json.error).toBe("Please provide a valid email address.");
    });
  });
});
