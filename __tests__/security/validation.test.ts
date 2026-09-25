import { NextRequest } from "next/server";
import {
  LoginSchema,
  RegisterSchema,
  AssessmentSchema,
  CalcomWebhookSchema,
  OgQuerySchema,
  SessionTokenFormatSchema,
  SessionRequestSchema,
  detectPrototypePollution,
  hasPrototypePollution,
  parseAndValidateJson,
  MAX_PAYLOAD_BYTES,
} from "@/lib/security/validation/schemas";

describe("Security Validation Library & Schemas", () => {
  describe("1. LoginSchema", () => {
    test("accepts valid credentials", () => {
      const valid = {
        email: "member@cognitiveedgeclinic.com",
        password: "SuperSecurePassword123!",
      };
      const result = LoginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    test("rejects invalid email format", () => {
      const invalid = {
        email: "not-an-email",
        password: "ValidPassword123!",
      };
      const result = LoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test("rejects empty password", () => {
      const invalid = {
        email: "user@example.com",
        password: "",
      };
      const result = LoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test("strictly rejects additional unknown properties", () => {
      const invalid = {
        email: "user@example.com",
        password: "password123",
        role: "admin",
      };
      const result = LoginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test("rejects strings exceeding 255 chars", () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      expect(LoginSchema.safeParse({ email: longEmail, password: "valid" }).success).toBe(false);

      const longPass = "p".repeat(256);
      expect(
        LoginSchema.safeParse({ email: "user@example.com", password: longPass }).success
      ).toBe(false);
    });
  });

  describe("2. RegisterSchema", () => {
    test("accepts valid registration payload", () => {
      const valid = {
        email: "patient@cognitiveedgeclinic.com",
        password: "ValidPass123!",
      };
      expect(RegisterSchema.safeParse(valid).success).toBe(true);
    });

    test("rejects passwords shorter than 6 characters", () => {
      const invalid = {
        email: "patient@cognitiveedgeclinic.com",
        password: "12345",
      };
      const result = RegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    test("strictly rejects extra properties", () => {
      const invalid = {
        email: "patient@cognitiveedgeclinic.com",
        password: "ValidPass123!",
        isAdmin: true,
      };
      expect(RegisterSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("3. AssessmentSchema", () => {
    test("accepts valid assessment answers and optional metadata", () => {
      const valid = {
        answers: {
          srt_mean_ms: 242.5,
          spatial_memory_accuracy: 0.92,
          stroop_interference: "normal",
        },
        metadata: {
          cohort: "40-59",
          clientVersion: "2.1.0",
        },
      };
      expect(AssessmentSchema.safeParse(valid).success).toBe(true);
    });

    test("accepts answers without metadata", () => {
      const valid = {
        answers: {
          q1: 10,
          q2: "severe",
        },
      };
      expect(AssessmentSchema.safeParse(valid).success).toBe(true);
    });

    test("rejects answer keys exceeding 100 characters", () => {
      const longKey = "k".repeat(101);
      const invalid = {
        answers: {
          [longKey]: 5,
        },
      };
      expect(AssessmentSchema.safeParse(invalid).success).toBe(false);
    });

    test("rejects string answer values exceeding 255 characters", () => {
      const longValue = "v".repeat(256);
      const invalid = {
        answers: {
          q1: longValue,
        },
      };
      expect(AssessmentSchema.safeParse(invalid).success).toBe(false);
    });

    test("strictly rejects unexpected top-level keys", () => {
      const invalid = {
        answers: { q1: 1 },
        unauthorizedField: "malicious",
      };
      expect(AssessmentSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("4. CalcomWebhookSchema", () => {
    test("accepts valid triggerEvent and payload", () => {
      const valid = {
        triggerEvent: "BOOKING_CREATED",
        payload: {
          uid: "booking_abc123",
          startTime: "2026-09-25T14:00:00Z",
        },
      };
      expect(CalcomWebhookSchema.safeParse(valid).success).toBe(true);
    });

    test("rejects triggerEvent exceeding 100 characters", () => {
      const invalid = {
        triggerEvent: "e".repeat(101),
        payload: {},
      };
      expect(CalcomWebhookSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("5. OgQuerySchema", () => {
    test("accepts empty/undefined optional parameters", () => {
      expect(OgQuerySchema.safeParse({}).success).toBe(true);
    });

    test("accepts valid bounded query parameters including description", () => {
      const valid = {
        title: "Quantitative Neuro-Metabolic Resuscitation",
        description: "Clinical protocol overview",
        category: "NEUROLOGY",
        subtitle: "Executive Concierge Longevity",
        sig: "a1b2c3d4e5f67890",
      };
      expect(OgQuerySchema.safeParse(valid).success).toBe(true);
    });

    test("strictly rejects unknown query parameters", () => {
      const invalid = {
        title: "Test Title",
        injectedParam: "attack",
      };
      expect(OgQuerySchema.safeParse(invalid).success).toBe(false);
    });

    test("rejects title exceeding 140 characters", () => {
      expect(OgQuerySchema.safeParse({ title: "t".repeat(141) }).success).toBe(false);
    });

    test("rejects description exceeding 160 characters", () => {
      expect(OgQuerySchema.safeParse({ description: "d".repeat(161) }).success).toBe(false);
    });

    test("rejects category exceeding 80 characters", () => {
      expect(OgQuerySchema.safeParse({ category: "c".repeat(81) }).success).toBe(false);
    });

    test("rejects subtitle exceeding 160 characters", () => {
      expect(OgQuerySchema.safeParse({ subtitle: "s".repeat(161) }).success).toBe(false);
    });

    test("rejects sig exceeding 128 characters", () => {
      expect(OgQuerySchema.safeParse({ sig: "x".repeat(129) }).success).toBe(false);
    });
  });

  describe("5b. SessionTokenFormatSchema & SessionRequestSchema", () => {
    test("accepts valid session token format (base64url.base64url)", () => {
      const validToken = "eyJhbGciOiJIUzI1NiJ9.sometokenhashvalue12345";
      expect(SessionTokenFormatSchema.safeParse(validToken).success).toBe(true);
    });

    test("rejects token without dot separator", () => {
      expect(SessionTokenFormatSchema.safeParse("nodothere1234567890").success).toBe(false);
    });

    test("rejects token with multiple dots", () => {
      expect(SessionTokenFormatSchema.safeParse("a.b.c.d").success).toBe(false);
    });

    test("rejects token with invalid characters", () => {
      expect(SessionTokenFormatSchema.safeParse("bad@token!.sig#123").success).toBe(false);
    });

    test("rejects token shorter than min length", () => {
      expect(SessionTokenFormatSchema.safeParse("a.b").success).toBe(false);
    });

    test("SessionRequestSchema accepts optional valid token and strictly rejects unknown keys", () => {
      expect(SessionRequestSchema.safeParse({}).success).toBe(true);
      expect(
        SessionRequestSchema.safeParse({
          token: "eyJhbGciOiJIUzI1NiJ9.sometokenhashvalue12345",
        }).success
      ).toBe(true);
      expect(
        SessionRequestSchema.safeParse({
          extraKey: "unexpected",
        }).success
      ).toBe(false);
    });
  });

  describe("6. Prototype Pollution Detection", () => {
    test("detects __proto__ in object", () => {
      const json = '{"__proto__": {"admin": true}}';
      expect(hasPrototypePollution(json)).toBe(true);
      const parsed = JSON.parse(json);
      expect(detectPrototypePollution(parsed)).toBe("__proto__");
    });

    test("detects constructor in object", () => {
      const json = '{"nested": {"constructor": 123}}';
      expect(hasPrototypePollution(json)).toBe(true);
      const parsed = JSON.parse(json);
      expect(detectPrototypePollution(parsed)).toBe("constructor");
    });

    test("detects prototype in nested array item", () => {
      const json = '{"items": [{"prototype": "danger"}]}';
      expect(hasPrototypePollution(json)).toBe(true);
      const parsed = JSON.parse(json);
      expect(detectPrototypePollution(parsed)).toBe("prototype");
    });

    test("returns null and false for clean payloads", () => {
      const clean = { email: "clean@example.com", details: { score: 100 } };
      expect(detectPrototypePollution(clean)).toBeNull();
      expect(hasPrototypePollution(clean)).toBe(false);
    });
  });

  describe("7. parseAndValidateJson Helper", () => {
    const createReq = (bodyText: string, headers: Record<string, string> = {}) => {
      return new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json",
          ...headers,
        }),
        body: bodyText,
      });
    };

    test("successfully parses and validates conforming JSON", async () => {
      const payload = JSON.stringify({
        email: "member@example.com",
        password: "ValidPassword123!",
      });
      const req = createReq(payload);
      const result = await parseAndValidateJson(req, LoginSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("member@example.com");
        expect(result.errorResponse).toBeNull();
      }
    });

    test("rejects payloads > 64KB with HTTP 413 Payload Too Large", async () => {
      // Create body > 64KB
      const hugePadding = "a".repeat(65 * 1024);
      const payload = JSON.stringify({ email: "user@example.com", password: hugePadding });
      const req = createReq(payload);

      const result = await parseAndValidateJson(req, LoginSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(413);
        expect(result.error.code).toBe("PAYLOAD_TOO_LARGE");
        const body = await result.errorResponse.json();
        expect(body.code).toBe("PAYLOAD_TOO_LARGE");
        expect(body.error).toContain("Payload exceeds maximum allowed limit");
      }
    });

    test("rejects large Content-Length header with HTTP 413", async () => {
      const req = createReq('{"email":"test@example.com"}', {
        "content-length": String(MAX_PAYLOAD_BYTES + 1000),
      });
      const result = await parseAndValidateJson(req, LoginSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(413);
        expect(result.error.code).toBe("PAYLOAD_TOO_LARGE");
      }
    });

    test("rejects prototype pollution with HTTP 400 and PROTOTYPE_POLLUTION_DETECTED", async () => {
      const payload = '{"email":"user@example.com","password":"pwd","__proto__":{"polluted":true}}';
      const req = createReq(payload);

      const result = await parseAndValidateJson(req, LoginSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(400);
        expect(result.error.code).toBe("PROTOTYPE_POLLUTION_DETECTED");
        const body = await result.errorResponse.json();
        expect(body.error).toContain("Prototype pollution attempt rejected");
      }
    });

    test("rejects constructor prototype pollution with HTTP 400", async () => {
      const payload = '{"email":"user@example.com","password":"pwd","constructor":{}}';
      const req = createReq(payload);

      const result = await parseAndValidateJson(req, LoginSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(400);
        expect(result.error.code).toBe("PROTOTYPE_POLLUTION_DETECTED");
      }
    });

    test("rejects malformed JSON syntax with HTTP 400 INVALID_JSON", async () => {
      const req = createReq("{not-valid-json");
      const result = await parseAndValidateJson(req, LoginSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(400);
        expect(result.error.code).toBe("INVALID_JSON");
        const body = await result.errorResponse.json();
        expect(body.error).toBe("Invalid JSON payload.");
      }
    });

    test("rejects empty body with HTTP 400 INVALID_JSON", async () => {
      const req = createReq("   ");
      const result = await parseAndValidateJson(req, LoginSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(400);
        expect(result.error.code).toBe("INVALID_JSON");
      }
    });

    test("rejects schema violations with HTTP 400 and sanitized details", async () => {
      const req = createReq(JSON.stringify({ email: "invalid-email", password: "" }));
      const result = await parseAndValidateJson(req, LoginSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorResponse.status).toBe(400);
        expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(result.error.code);
        const body = await result.errorResponse.json();
        expect(["INVALID_PAYLOAD", "VALIDATION_ERROR"]).toContain(body.code);
        expect(Array.isArray(body.details)).toBe(true);
        expect(body.details.length).toBeGreaterThan(0);
        // Verify no stack trace leaked
        expect(JSON.stringify(body)).not.toMatch(/node:internal|\.ts:|\.js:/);
      }
    });
  });
});
