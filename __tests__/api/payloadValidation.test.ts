import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as assessmentHandler } from "@/app/api/assessment/route";
import { POST as calcomWebhookHandler } from "@/app/api/webhooks/calcom/route";
import {
  LoginSchema,
  RegisterSchema,
  AssessmentSchema,
  CalcomWebhookSchema,
  OgQuerySchema,
  parseAndValidateJson,
  detectPrototypePollution,
  hasPrototypePollution,
  MAX_PAYLOAD_BYTES,
} from "@/lib/security/validation/schemas";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import * as authServer from "@/lib/auth/server";
import crypto from "crypto";

jest.mock("@/lib/auth/server", () => ({
  getMember: jest.fn(),
  saveMember: jest.fn(),
  hashPassword: jest.fn(() => ({ salt: "mock_salt", hash: "mock_hash" })),
  verifyPassword: jest.fn(),
  createSessionToken: jest.fn(() => "mock_session_token_xyz"),
  verifySessionToken: jest.fn(),
}));

describe("API Security Battery: Payload Validation & Attack Resistance", () => {
  const originalEnv = process.env;
  const WEBHOOK_SECRET = "test_calcom_webhook_secret_key_123";

  beforeEach(() => {
    resetRateLimits();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CALCOM_WEBHOOK_SECRET: WEBHOOK_SECRET,
      CLINIC_AUTH_SECRET: "mock_auth_secret_for_validation_tests",
    };
  });

  afterAll(() => {
    resetRateLimits();
    process.env = originalEnv;
  });

  const createRequest = (
    url: string,
    body: string | object | null,
    headers: Record<string, string> = {}
  ): NextRequest => {
    const rawBody = body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
    const headerMap = new Headers(headers);
    if (rawBody && !headerMap.has("Content-Type")) {
      headerMap.set("Content-Type", "application/json");
    }

    return new NextRequest(url, {
      method: "POST",
      headers: headerMap,
      body: rawBody,
    });
  };

  const createSignedWebhookRequest = (rawBody: string, customSecret?: string): NextRequest => {
    const signature = crypto
      .createHmac("sha256", customSecret ?? WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    return new NextRequest("https://cognitiveedgeclinic.com/api/webhooks/calcom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cal-signature-256": signature,
        "x-forwarded-for": "198.51.100.99",
      },
      body: rawBody,
    });
  };

  // ==========================================================================
  // 1. Malformed JSON Payload Rejection (HTTP 400)
  // ==========================================================================
  describe("1. Malformed JSON Payload Rejection (HTTP 400)", () => {
    test("POST /api/auth/login rejects unclosed JSON syntax with HTTP 400", async () => {
      const malformed = '{"email": "user@cognitiveedgeclinic.com", "password":';
      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", malformed, {
        "x-forwarded-for": "198.51.100.11",
      });
      const res = await loginHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("POST /api/auth/register rejects truncated JSON with HTTP 400", async () => {
      const malformed = '{"email": "user@cognitiveedgeclinic.com"';
      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/register", malformed, {
        "x-forwarded-for": "198.51.100.12",
      });
      const res = await registerHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("POST /api/assessment rejects arbitrary non-JSON string with HTTP 400", async () => {
      const malformed = "THIS_IS_PLAIN_TEXT_NOT_JSON";
      const req = createRequest("https://cognitiveedgeclinic.com/api/assessment", malformed, {
        "x-forwarded-for": "198.51.100.13",
      });
      const res = await assessmentHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("POST /api/webhooks/calcom rejects malformed JSON with HTTP 400", async () => {
      const malformed = "{ broken json: 123 }";
      const req = createSignedWebhookRequest(malformed);
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_JSON");
    });

    test("parseAndValidateJson helper returns structured INVALID_JSON on empty body", async () => {
      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", "");
      const result = await parseAndValidateJson(req, LoginSchema);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_JSON");
      expect(result.errorResponse?.status).toBe(400);
    });
  });

  // ==========================================================================
  // 2. Oversize Payload Rejection (HTTP 413 or 400)
  // ==========================================================================
  describe("2. Oversize Payload Rejection (HTTP 413 or 400)", () => {
    test("POST /api/auth/login rejects payload exceeding 64KB with HTTP 413", async () => {
      const oversizedString = "A".repeat(MAX_PAYLOAD_BYTES + 500);
      const largePayload = JSON.stringify({
        email: "user@cognitiveedgeclinic.com",
        password: oversizedString,
      });

      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", largePayload, {
        "x-forwarded-for": "198.51.100.21",
        "Content-Length": String(Buffer.byteLength(largePayload)),
      });
      const res = await loginHandler(req);

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.code).toBe("PAYLOAD_TOO_LARGE");
    });

    test("POST /api/assessment rejects oversized payload (>64KB) even without Content-Length header", async () => {
      const largePadding = "x".repeat(MAX_PAYLOAD_BYTES + 1024);
      const largeBody = JSON.stringify({
        answers: { padding: largePadding },
      });

      const req = createRequest("https://cognitiveedgeclinic.com/api/assessment", largeBody, {
        "x-forwarded-for": "198.51.100.22",
      });
      const res = await assessmentHandler(req);

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.code).toBe("PAYLOAD_TOO_LARGE");
    });

    test("POST /api/webhooks/calcom rejects oversized signed webhook body with HTTP 413", async () => {
      const massivePayload = JSON.stringify({
        triggerEvent: "BOOKING_CREATED",
        payload: {
          hugeBuffer: "b".repeat(MAX_PAYLOAD_BYTES + 2000),
        },
      });

      const req = createSignedWebhookRequest(massivePayload);
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.code).toBe("PAYLOAD_TOO_LARGE");
    });

    test("parseAndValidateJson rejects early via Content-Length header check", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(MAX_PAYLOAD_BYTES + 100),
        },
        body: JSON.stringify({ answers: { srt: 200 } }),
      });

      const result = await parseAndValidateJson(req, AssessmentSchema);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("PAYLOAD_TOO_LARGE");
      expect(result.errorResponse?.status).toBe(413);
    });
  });

  // ==========================================================================
  // 3. Prototype Pollution Attempts Rejection (HTTP 400)
  // ==========================================================================
  describe("3. Prototype Pollution Attempts Rejection (HTTP 400)", () => {
    test("POST /api/auth/login rejects raw '__proto__' injection with HTTP 400", async () => {
      const attackPayload =
        '{"email":"admin@cognitiveedgeclinic.com","password":"Password123!","__proto__":{"isAdmin":true}}';

      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", attackPayload, {
        "x-forwarded-for": "198.51.100.31",
      });
      const res = await loginHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");

      // Verify Object prototype was not polluted
      expect((Object.prototype as unknown as { isAdmin?: boolean }).isAdmin).toBeUndefined();
    });

    test("POST /api/auth/register rejects 'constructor' prototype vector with HTTP 400", async () => {
      const attackPayload =
        '{"email":"hacker@cognitiveedgeclinic.com","password":"SecretPassword123!","constructor":{"prototype":{"polluted":true}}}';

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        attackPayload,
        {
          "x-forwarded-for": "198.51.100.32",
        }
      );
      const res = await registerHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");

      expect((Object.prototype as unknown as { polluted?: boolean }).polluted).toBeUndefined();
    });

    test("POST /api/assessment rejects nested prototype pollution in answers with HTTP 400", async () => {
      const attackPayload =
        '{"answers":{"srt":250,"__proto__":{"rootAccess":true}}}';

      const req = createRequest("https://cognitiveedgeclinic.com/api/assessment", attackPayload, {
        "x-forwarded-for": "198.51.100.33",
      });
      const res = await assessmentHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");

      expect((Object.prototype as unknown as { rootAccess?: boolean }).rootAccess).toBeUndefined();
    });

    test("POST /api/webhooks/calcom rejects prototype pollution payload with HTTP 400", async () => {
      const attackPayload =
        '{"triggerEvent":"BOOKING_CREATED","payload":{"__proto__":{"compromised":true}}}';

      const req = createSignedWebhookRequest(attackPayload);
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");

      expect((Object.prototype as unknown as { compromised?: boolean }).compromised).toBeUndefined();
    });

    test("detectPrototypePollution helper catches deep array and nested object pollution", () => {
      const cleanObject = { a: 1, b: { c: [2, 3] } };
      expect(detectPrototypePollution(cleanObject)).toBeNull();

      const pollutedObj1 = JSON.parse('{"__proto__": 123}');
      expect(detectPrototypePollution(pollutedObj1)).toBe("__proto__");

      const pollutedObj2 = JSON.parse('{"nested": {"constructor": 456}}');
      expect(detectPrototypePollution(pollutedObj2)).toBe("constructor");

      const pollutedObj3 = JSON.parse('{"arr": [{"prototype": 789}]}');
      expect(detectPrototypePollution(pollutedObj3)).toBe("prototype");
    });

    test("hasPrototypePollution helper identifies string and object vectors", () => {
      expect(hasPrototypePollution('{"__proto__": {}}')).toBe(true);
      expect(hasPrototypePollution('{"constructor": {}}')).toBe(true);
      expect(hasPrototypePollution('{"prototype": {}}')).toBe(true);
      expect(hasPrototypePollution('{"safeKey": "safeValue"}')).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Zod Schema Strictness (Unexpected Keys Rejected with HTTP 400)
  // ==========================================================================
  describe("4. Zod Schema Strictness (Unexpected Keys Rejected with HTTP 400)", () => {
    test("POST /api/auth/login rejects unexpected fields (e.g. role, isAdmin) with HTTP 400", async () => {
      const payload = {
        email: "member@cognitiveedgeclinic.com",
        password: "ValidPassword123!",
        role: "superuser",
        injectedFlag: true,
      };

      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", payload, {
        "x-forwarded-for": "198.51.100.41",
      });
      const res = await loginHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(json.details)).toBe(true);
    });

    test("POST /api/auth/register rejects unexpected properties with HTTP 400", async () => {
      const payload = {
        email: "newmember@cognitiveedgeclinic.com",
        password: "ValidPassword123!",
        extraField: "not_allowed",
      };

      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/register", payload, {
        "x-forwarded-for": "198.51.100.42",
      });
      const res = await registerHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    test("POST /api/assessment rejects unexpected root properties with HTTP 400", async () => {
      const payload = {
        answers: {
          reaction_time: 250,
        },
        unexpectedProperty: "should_fail",
      };

      const req = createRequest("https://cognitiveedgeclinic.com/api/assessment", payload, {
        "x-forwarded-for": "198.51.100.43",
      });
      const res = await assessmentHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    test("rejects invalid field formats (malformed email, password under min length)", async () => {
      const invalidEmail = {
        email: "not-an-email-at-all",
        password: "ValidPassword123!",
      };

      const req1 = createRequest("https://cognitiveedgeclinic.com/api/auth/login", invalidEmail, {
        "x-forwarded-for": "198.51.100.44",
      });
      const res1 = await loginHandler(req1);
      expect(res1.status).toBe(400);

      const shortPassword = {
        email: "user@cognitiveedgeclinic.com",
        password: "123",
      };

      const req2 = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        shortPassword,
        {
          "x-forwarded-for": "198.51.100.45",
        }
      );
      const res2 = await registerHandler(req2);
      expect(res2.status).toBe(400);
    });

    test("OgQuerySchema strictly rejects unexpected query parameters", () => {
      const cleanQuery = { title: "Cognitive Assessment", category: "Neurology" };
      expect(OgQuerySchema.safeParse(cleanQuery).success).toBe(true);

      const hostileQuery = {
        title: "Cognitive Assessment",
        maliciousParam: "<script>alert(1)</script>",
      };
      expect(OgQuerySchema.safeParse(hostileQuery).success).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Valid Payloads Pass Schema Validation
  // ==========================================================================
  describe("5. Valid Payloads Pass Schema Validation", () => {
    test("valid login payload passes schema validation and reaches auth verification", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValueOnce({
        email: "physician@cognitiveedgeclinic.com",
        salt: "salt_abc",
        hash: "hash_abc",
      });
      (authServer.verifyPassword as jest.Mock).mockReturnValueOnce(true);

      const validPayload = {
        email: "physician@cognitiveedgeclinic.com",
        password: "CorrectPassword123!",
      };

      const req = createRequest("https://cognitiveedgeclinic.com/api/auth/login", validPayload, {
        "x-forwarded-for": "198.51.100.51",
      });
      const res = await loginHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.email).toBe("physician@cognitiveedgeclinic.com");
    });

    test("valid register payload passes schema validation and creates account", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValueOnce(null);

      const validPayload = {
        email: "newphysician@cognitiveedgeclinic.com",
        password: "StrongPasscode123!",
      };

      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        validPayload,
        {
          "x-forwarded-for": "198.51.100.52",
        }
      );
      const res = await registerHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(authServer.saveMember).toHaveBeenCalledTimes(1);
    });

    test("valid assessment payload returns HTTP 200 with sanitized Zero-ePHI summary", async () => {
      const validPayload = {
        answers: {
          reaction_time_ms: 238.4,
          spatial_memory_accuracy: 0.94,
          contraindications: "cleared",
        },
        metadata: {
          device: "desktop-edge",
          protocol_version: "2.1",
        },
      };

      const req = createRequest("https://cognitiveedgeclinic.com/api/assessment", validPayload, {
        "x-forwarded-for": "198.51.100.53",
      });
      const res = await assessmentHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.summary.quarantine).toBe("ZERO_ePHI_ENFORCED");
      expect(json.summary.metrics.totalAnswers).toBe(3);
      expect(json.summary.metrics.numericAnswersCount).toBe(2);
      expect(json.summary.metrics.averageNumericScore).toBe(119.67);
      expect(json.summary.assessmentId).toBeDefined();
    });

    test("valid Cal.com webhook payload passes validation and is acknowledged", async () => {
      const validPayload = {
        triggerEvent: "BOOKING_CREATED",
        payload: {
          title: "Neuro-Longevity Intake Consultation",
          startTime: "2026-10-15T15:00:00.000Z",
          attendees: [
            {
              name: "Clinical Candidate",
              email: "candidate@example.com",
              phoneNumber: "+15555550199",
            },
          ],
        },
      };

      const req = createSignedWebhookRequest(JSON.stringify(validPayload));
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.event).toBe("BOOKING_CREATED");
    });

    test("direct schema checks confirm full coverage across all input types", () => {
      expect(
        LoginSchema.safeParse({ email: "user@example.com", password: "p" }).success
      ).toBe(true);
      expect(
        RegisterSchema.safeParse({ email: "user@example.com", password: "password123" }).success
      ).toBe(true);
      expect(
        AssessmentSchema.safeParse({ answers: { test: 123 } }).success
      ).toBe(true);
      expect(
        CalcomWebhookSchema.safeParse({ triggerEvent: "PING", payload: {} }).success
      ).toBe(true);
    });
  });
});
