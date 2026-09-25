import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { GET as sessionHandler } from "@/app/api/auth/session/route";
import { POST as assessmentHandler } from "@/app/api/assessment/route";
import { POST as calcomWebhookHandler } from "@/app/api/webhooks/calcom/route";
import {
  resetRateLimits,
  getRateLimitHeaders,
  DEFAULT_LIMIT_CONFIGS,
  resolveRouteCategory,
} from "@/lib/security/ratelimit/tokenBucket";
import * as authServer from "@/lib/auth/server";
import crypto from "crypto";

jest.mock("@/lib/auth/server", () => ({
  getMember: jest.fn(),
  saveMember: jest.fn(),
  hashPassword: jest.fn(() => ({ salt: "salt", hash: "hash" })),
  verifyPassword: jest.fn(),
  createSessionToken: jest.fn(() => "mock_token"),
  verifySessionToken: jest.fn(),
}));

describe("API Security Battery: Tiered Rate Limiting & Header Contract", () => {
  const originalEnv = process.env;
  const WEBHOOK_SECRET = "webhook_secret_key_rate_limit_test";

  beforeEach(() => {
    resetRateLimits();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CALCOM_WEBHOOK_SECRET: WEBHOOK_SECRET,
      CLINIC_AUTH_SECRET: "mock_clinic_auth_secret",
    };
  });

  afterAll(() => {
    resetRateLimits();
    process.env = originalEnv;
  });

  const createRequest = (
    url: string,
    method: "GET" | "POST",
    ip: string,
    body?: object
  ): NextRequest => {
    const rawBody = body ? JSON.stringify(body) : undefined;
    const headers = new Headers({
      "x-forwarded-for": ip,
    });
    if (rawBody) {
      headers.set("Content-Type", "application/json");
    }

    return new NextRequest(url, {
      method,
      headers,
      body: rawBody,
    });
  };

  const createWebhookRequest = (ip: string, bodyObj: object): NextRequest => {
    const rawBody = JSON.stringify(bodyObj);
    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    return new NextRequest("https://cognitiveedgeclinic.com/api/webhooks/calcom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cal-signature-256": signature,
        "x-forwarded-for": ip,
      },
      body: rawBody,
    });
  };

  // ==========================================================================
  // 1. Tier Configuration Invariants
  // ==========================================================================
  describe("1. Tier Configuration & Route Categorization Invariants", () => {
    test("defines exact capacity and refill rates across security tiers", () => {
      expect(DEFAULT_LIMIT_CONFIGS.auth).toEqual({
        capacity: 10,
        refillRatePerMinute: 10,
        windowMs: 60_000,
      });

      expect(DEFAULT_LIMIT_CONFIGS.session).toEqual({
        capacity: 30,
        refillRatePerMinute: 30,
        windowMs: 60_000,
      });

      expect(DEFAULT_LIMIT_CONFIGS.form).toEqual({
        capacity: 5,
        refillRatePerMinute: 5,
        windowMs: 60_000,
      });

      expect(DEFAULT_LIMIT_CONFIGS.webhook).toEqual({
        capacity: 5,
        refillRatePerMinute: 5,
        windowMs: 60_000,
      });

      expect(DEFAULT_LIMIT_CONFIGS.default).toEqual({
        capacity: 60,
        refillRatePerMinute: 60,
        windowMs: 60_000,
      });
    });

    test("correctly maps endpoint paths to tiers", () => {
      expect(resolveRouteCategory("/api/auth/login")).toBe("auth");
      expect(resolveRouteCategory("/api/auth/register")).toBe("auth");
      expect(resolveRouteCategory("/api/auth/session")).toBe("session");
      expect(resolveRouteCategory("/api/auth/logout")).toBe("session");
      expect(resolveRouteCategory("/api/assessment")).toBe("form");
      expect(resolveRouteCategory("/api/webhooks/calcom")).toBe("webhook");
      expect(resolveRouteCategory("/api/og")).toBe("default");
    });
  });

  // ==========================================================================
  // 2. Auth Tier: Burst Limit of 10 req/min
  // ==========================================================================
  describe("2. Auth Tier: Burst Limit of 10 req/min", () => {
    test("POST /api/auth/login permits exactly 10 requests, throttles 11th with HTTP 429", async () => {
      const clientIp = "198.51.100.101";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Requests 1 through 10 should be processed within the auth bucket
      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          "https://cognitiveedgeclinic.com/api/auth/login",
          "POST",
          clientIp,
          { email: "user@cognitiveedgeclinic.com", password: "Password123!" }
        );
        const res = await loginHandler(req);

        // Not throttled (401 because mocked user is null, proving it reached auth handler)
        expect(res.status).toBe(401);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(9 - i));
        expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
        expect(res.headers.get("Retry-After")).toBeNull();
      }

      // 11th request must trigger HTTP 429
      const throttledReq = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        "POST",
        clientIp,
        { email: "user@cognitiveedgeclinic.com", password: "Password123!" }
      );
      const throttledRes = await loginHandler(throttledReq);

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(throttledRes.headers.get("X-RateLimit-Reset")).toBeDefined();

      const retryAfter = throttledRes.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!, 10)).toBeGreaterThan(0);
    });

    test("POST /api/auth/register permits 10 requests and throttles on the 11th", async () => {
      const clientIp = "198.51.100.102";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          "https://cognitiveedgeclinic.com/api/auth/register",
          "POST",
          clientIp,
          { email: `user${i}@cognitiveedgeclinic.com`, password: "StrongPassword123!" }
        );
        const res = await registerHandler(req);
        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(9 - i));
      }

      const reqBlocked = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/register",
        "POST",
        clientIp,
        { email: "user11@cognitiveedgeclinic.com", password: "StrongPassword123!" }
      );
      const resBlocked = await registerHandler(reqBlocked);

      expect(resBlocked.status).toBe(429);
      expect(resBlocked.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(resBlocked.headers.get("Retry-After")).toBeDefined();
    });
  });

  // ==========================================================================
  // 3. Session Tier: Burst Limit of 30 req/min
  // ==========================================================================
  describe("3. Session Tier: Burst Limit of 30 req/min", () => {
    test("GET /api/auth/session permits exactly 30 requests, throttles 31st with HTTP 429", async () => {
      const clientIp = "198.51.100.103";

      for (let i = 0; i < 30; i++) {
        const req = createRequest(
          "https://cognitiveedgeclinic.com/api/auth/session",
          "GET",
          clientIp
        );
        const res = await sessionHandler(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.authenticated).toBe(false);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(29 - i));
        expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
      }

      // 31st request triggers HTTP 429
      const blockedReq = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/session",
        "GET",
        clientIp
      );
      const blockedRes = await sessionHandler(blockedReq);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(blockedRes.headers.get("X-RateLimit-Reset")).toBeDefined();

      const retryAfter = blockedRes.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!, 10)).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 4. Form & Webhook Tiers: Burst Limit of 5 req/min
  // ==========================================================================
  describe("4. Form & Webhook Tiers: Burst Limit of 5 req/min", () => {
    test("POST /api/assessment permits exactly 5 submissions, throttles 6th with HTTP 429", async () => {
      const clientIp = "198.51.100.104";
      const payload = {
        answers: { srt_score: 220, memory: 92 },
      };

      for (let i = 0; i < 5; i++) {
        const req = createRequest(
          "https://cognitiveedgeclinic.com/api/assessment",
          "POST",
          clientIp,
          payload
        );
        const res = await assessmentHandler(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(4 - i));
        expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
        expect(res.headers.get("Retry-After")).toBeNull();
      }

      // 6th submission triggers HTTP 429
      const throttledReq = createRequest(
        "https://cognitiveedgeclinic.com/api/assessment",
        "POST",
        clientIp,
        payload
      );
      const throttledRes = await assessmentHandler(throttledReq);

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(throttledRes.headers.get("X-RateLimit-Reset")).toBeDefined();

      const retryAfter = throttledRes.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!, 10)).toBeGreaterThan(0);
    });

    test("POST /api/webhooks/calcom permits 5 webhooks, throttles 6th with HTTP 429", async () => {
      const clientIp = "198.51.100.105";
      const webhookPayload = {
        triggerEvent: "PING",
        payload: { status: "heartbeat" },
      };

      for (let i = 0; i < 5; i++) {
        const req = createWebhookRequest(clientIp, webhookPayload);
        const res = await calcomWebhookHandler(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(4 - i));
        expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
      }

      // 6th webhook must be throttled
      const reqBlocked = createWebhookRequest(clientIp, webhookPayload);
      const resBlocked = await calcomWebhookHandler(reqBlocked);

      expect(resBlocked.status).toBe(429);
      expect(resBlocked.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(resBlocked.headers.get("Retry-After")).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. HTTP 200 and 429 Headers Verification
  // ==========================================================================
  describe("5. Standardized Header Contract Verification", () => {
    test("HTTP 200 responses include X-RateLimit-Remaining and X-RateLimit-Reset", async () => {
      const clientIp = "198.51.100.106";
      const req = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/session",
        "GET",
        clientIp
      );
      const res = await sessionHandler(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("29");

      const resetTime = Number(res.headers.get("X-RateLimit-Reset"));
      expect(resetTime).toBeGreaterThan(Date.now() - 5000);
      expect(res.headers.get("Retry-After")).toBeNull();
    });

    test("HTTP 429 responses include Retry-After, X-RateLimit-Remaining, and X-RateLimit-Reset", async () => {
      const clientIp = "198.51.100.107";

      for (let i = 0; i < 5; i++) {
        await assessmentHandler(
          createRequest("https://cognitiveedgeclinic.com/api/assessment", "POST", clientIp, {
            answers: { q1: 1 },
          })
        );
      }

      const blockedRes = await assessmentHandler(
        createRequest("https://cognitiveedgeclinic.com/api/assessment", "POST", clientIp, {
          answers: { q1: 1 },
        })
      );

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(Number(blockedRes.headers.get("X-RateLimit-Reset"))).toBeGreaterThan(
        Date.now() - 5000
      );

      const retryAfter = Number(blockedRes.headers.get("Retry-After"));
      expect(retryAfter).toBeGreaterThanOrEqual(1);
    });

    test("getRateLimitHeaders helper produces consistent RFC headers", () => {
      const allowedResult = {
        allowed: true,
        remainingTokens: 8,
        resetTime: 1729000000000,
      };
      const allowedHeaders = getRateLimitHeaders(allowedResult);
      expect(allowedHeaders["X-RateLimit-Remaining"]).toBe("8");
      expect(allowedHeaders["X-RateLimit-Reset"]).toBe("1729000000000");
      expect(allowedHeaders["Retry-After"]).toBeUndefined();

      const blockedResult = {
        allowed: false,
        remainingTokens: 0,
        retryAfterSeconds: 12,
        resetTime: 1729000060000,
      };
      const blockedHeaders = getRateLimitHeaders(blockedResult);
      expect(blockedHeaders["X-RateLimit-Remaining"]).toBe("0");
      expect(blockedHeaders["X-RateLimit-Reset"]).toBe("1729000060000");
      expect(blockedHeaders["Retry-After"]).toBe("12");
    });
  });

  // ==========================================================================
  // 6. Multi-IP Isolation
  // ==========================================================================
  describe("6. Multi-IP Isolation", () => {
    test("throttling Client IP 1 does not affect Client IP 2 in Auth tier", async () => {
      const ip1 = "203.0.113.1";
      const ip2 = "203.0.113.2";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Exhaust IP 1
      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          "https://cognitiveedgeclinic.com/api/auth/login",
          "POST",
          ip1,
          { email: "user@example.com", password: "Password123!" }
        );
        const res = await loginHandler(req);
        expect(res.status).toBe(401);
      }

      // Verify IP 1 is throttled
      const throttled1 = await loginHandler(
        createRequest("https://cognitiveedgeclinic.com/api/auth/login", "POST", ip1, {
          email: "user@example.com",
          password: "Password123!",
        })
      );
      expect(throttled1.status).toBe(429);

      // Verify IP 2 is unaffected and has full burst capacity
      const freshReq2 = createRequest(
        "https://cognitiveedgeclinic.com/api/auth/login",
        "POST",
        ip2,
        { email: "user@example.com", password: "Password123!" }
      );
      const res2 = await loginHandler(freshReq2);

      expect(res2.status).toBe(401);
      expect(res2.headers.get("X-RateLimit-Remaining")).toBe("9");
    });

    test("throttling Client IP 1 does not affect Client IP 2 in Session tier", async () => {
      const ip1 = "203.0.113.11";
      const ip2 = "203.0.113.12";

      // Exhaust IP 1 across 30 requests
      for (let i = 0; i < 30; i++) {
        await sessionHandler(
          createRequest("https://cognitiveedgeclinic.com/api/auth/session", "GET", ip1)
        );
      }

      const blockedRes1 = await sessionHandler(
        createRequest("https://cognitiveedgeclinic.com/api/auth/session", "GET", ip1)
      );
      expect(blockedRes1.status).toBe(429);

      // IP 2 is completely clean
      const allowedRes2 = await sessionHandler(
        createRequest("https://cognitiveedgeclinic.com/api/auth/session", "GET", ip2)
      );
      expect(allowedRes2.status).toBe(200);
      expect(allowedRes2.headers.get("X-RateLimit-Remaining")).toBe("29");
    });

    test("throttling Client IP 1 does not affect Client IP 2 in Form tier", async () => {
      const ip1 = "203.0.113.21";
      const ip2 = "203.0.113.22";
      const payload = { answers: { q1: 5 } };

      for (let i = 0; i < 5; i++) {
        await assessmentHandler(
          createRequest("https://cognitiveedgeclinic.com/api/assessment", "POST", ip1, payload)
        );
      }

      const blocked1 = await assessmentHandler(
        createRequest("https://cognitiveedgeclinic.com/api/assessment", "POST", ip1, payload)
      );
      expect(blocked1.status).toBe(429);

      const allowed2 = await assessmentHandler(
        createRequest("https://cognitiveedgeclinic.com/api/assessment", "POST", ip2, payload)
      );
      expect(allowed2.status).toBe(200);
      expect(allowed2.headers.get("X-RateLimit-Remaining")).toBe("4");
    });
  });
});
