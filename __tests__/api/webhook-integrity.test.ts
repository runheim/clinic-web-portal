/**
 * Phase 2 Automated Attack & Abuse Test Battery
 * Suite: Webhook HMAC Cryptographic Integrity & Signature Verification
 *
 * Verifies:
 * - Missing signature header returns HTTP 401
 * - Unconfigured webhook secret returns HTTP 503 (fail closed)
 * - Forged HMAC signature (wrong secret, modified payload, bit flips) returns HTTP 401
 * - Valid HMAC signature passes verification with HTTP 200
 *
 * Zero-ePHI Compliant: Synthetic test identifiers only (e.g. member_test_01).
 */

import { NextRequest } from "next/server";
import crypto from "crypto";
import { POST as calcomWebhookHandler } from "@/app/api/webhooks/calcom/route";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";

describe("Phase 2 Battery: Webhook Integrity & HMAC Tamper Defense (__tests__/api/webhook-integrity.test.ts)", () => {
  const originalEnv = process.env;
  const VALID_WEBHOOK_SECRET = "test_calcom_webhook_secret_phase2";

  beforeEach(() => {
    resetRateLimits();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CALCOM_WEBHOOK_SECRET: VALID_WEBHOOK_SECRET,
      // Leave SPRUCE_API_KEY unset to use simulated_local_relay
      SPRUCE_API_KEY: undefined,
    };
  });

  afterAll(() => {
    resetRateLimits();
    process.env = originalEnv;
  });

  const createWebhookRequest = (
    body: string | object,
    signatureHeader?: string,
    ip = "198.51.100.130"
  ): NextRequest => {
    const rawBody = typeof body === "string" ? body : JSON.stringify(body);
    const headers = new Headers({
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    });

    if (signatureHeader !== undefined) {
      headers.set("x-cal-signature-256", signatureHeader);
    }

    return new NextRequest("https://cognitiveedgeclinic.com/api/webhooks/calcom", {
      method: "POST",
      headers,
      body: rawBody,
    });
  };

  const generateSignature = (payload: string, secretKey: string): string => {
    return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
  };

  const samplePayload = {
    triggerEvent: "BOOKING_CREATED",
    payload: {
      uid: "cal_test_event_01",
      title: "Diagnostic Intake Assessment",
      startTime: "2026-10-15T14:00:00.000Z",
      attendees: [
        {
          name: "Test Member",
          email: "member_test_01@example.com",
          phoneNumber: "+15555550100",
        },
      ],
    },
  };

  // ============================================================================
  // 1. Missing Signature -> Expects HTTP 401 or 503
  // ============================================================================
  describe("1. Missing Signature & Unconfigured Secret Verification", () => {
    test("rejects request with completely missing x-cal-signature-256 header with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const req = createWebhookRequest(rawBody, undefined, "198.51.100.131");

      const res = await calcomWebhookHandler(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.error).toBe("Missing HMAC signature header");
    });

    test("rejects request with empty string signature header with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const req = createWebhookRequest(rawBody, "", "198.51.100.132");

      const res = await calcomWebhookHandler(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.error).toBe("Missing HMAC signature header");
    });

    test("fails closed with HTTP 503 when CALCOM_WEBHOOK_SECRET is unconfigured", async () => {
      delete process.env.CALCOM_WEBHOOK_SECRET;

      const rawBody = JSON.stringify(samplePayload);
      const signature = generateSignature(rawBody, VALID_WEBHOOK_SECRET);
      const req = createWebhookRequest(rawBody, signature, "198.51.100.133");

      const res = await calcomWebhookHandler(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.error).toContain("unconfigured or disabled");
    });
  });

  // ============================================================================
  // 2. Forged HMAC Signature -> Expects HTTP 401
  // ============================================================================
  describe("2. Forged & Tampered HMAC Signature -> HTTP 401", () => {
    test("rejects request signed with an illegitimate attacker secret with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const attackerSecret = "adversary_forged_secret_key_999";
      const forgedSignature = generateSignature(rawBody, attackerSecret);

      const req = createWebhookRequest(rawBody, forgedSignature, "198.51.100.134");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid HMAC signature");
    });

    test("rejects request when payload was tampered after signature generation with HTTP 401", async () => {
      const originalPayload = JSON.stringify(samplePayload);
      const validSignature = generateSignature(originalPayload, VALID_WEBHOOK_SECRET);

      // Adversary alters attendee email after valid signature was computed
      const tamperedPayload = JSON.stringify({
        ...samplePayload,
        payload: {
          ...samplePayload.payload,
          attendees: [{ name: "Tampered Name", email: "adversary@example.com" }],
        },
      });

      const req = createWebhookRequest(tamperedPayload, validSignature, "198.51.100.135");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid HMAC signature");
    });

    test("rejects arbitrary random hex string signature with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const bogusSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const req = createWebhookRequest(rawBody, bogusSignature, "198.51.100.136");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid HMAC signature");
    });

    test("rejects single-character mutated signature (timing-safe verification) with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const realSignature = generateSignature(rawBody, VALID_WEBHOOK_SECRET);

      // Flip first character
      const mutatedFirstChar = realSignature[0] === "a" ? "b" : "a";
      const forgedSignature = mutatedFirstChar + realSignature.slice(1);

      const req = createWebhookRequest(rawBody, forgedSignature, "198.51.100.137");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid HMAC signature");
    });

    test("rejects truncated signature of mismatched buffer length without crashing with HTTP 401", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const realSignature = generateSignature(rawBody, VALID_WEBHOOK_SECRET);
      const truncatedSignature = realSignature.slice(0, 32); // 32 chars instead of 64

      const req = createWebhookRequest(rawBody, truncatedSignature, "198.51.100.138");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid HMAC signature");
    });
  });

  // ============================================================================
  // 3. Valid HMAC Signature Passes Verification
  // ============================================================================
  describe("3. Valid HMAC Cryptographic Integrity", () => {
    test("accepts request with accurately computed HMAC-SHA256 signature with HTTP 200", async () => {
      const rawBody = JSON.stringify(samplePayload);
      const authenticSignature = generateSignature(rawBody, VALID_WEBHOOK_SECRET);

      const req = createWebhookRequest(rawBody, authenticSignature, "198.51.100.139");
      const res = await calcomWebhookHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("success");
      expect(json.event).toBe("BOOKING_CREATED");
      expect(json.candidate.email).toBe("member_test_01@example.com");
    });
  });
});
