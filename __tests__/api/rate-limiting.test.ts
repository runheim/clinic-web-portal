/**
 * Phase 2 Automated Attack & Abuse Test Battery
 * Suite: Rate Limiting & Denial-of-Service Defense
 *
 * Verifies:
 * - Burst requests exceeding bucket capacity trigger HTTP 429
 * - Responses contain compliant 'Retry-After', 'X-RateLimit-Remaining', and 'X-RateLimit-Reset' headers
 * - Multi-IP isolation prevents IP cross-contamination
 * - Rate limit recovery behavior
 *
 * Zero-ePHI Compliant: Synthetic test identifiers only (e.g. member_test_01).
 */

import { NextRequest } from "next/server";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { resetRateLimits, DEFAULT_LIMIT_CONFIGS } from "@/lib/security/ratelimit/tokenBucket";
import * as authServer from "@/lib/auth/server";

jest.mock("@/lib/auth/server", () => ({
  getMember: jest.fn(),
  verifyPassword: jest.fn(),
  createSessionToken: jest.fn(() => "mock-token-xyz"),
}));

describe("Phase 2 Battery: Auth Rate Limiting & Burst Protection (__tests__/api/rate-limiting.test.ts)", () => {
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

  const createLoginRequest = (
    ip: string,
    body: object = { email: "member_test_01@example.com", password: "mock-password-xyz" },
    extraHeaders: Record<string, string> = {}
  ): NextRequest => {
    const rawBody = JSON.stringify(body);
    const headers = new Headers({
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
      ...extraHeaders,
    });

    return new NextRequest("https://cognitiveedgeclinic.com/api/auth/login", {
      method: "POST",
      headers,
      body: rawBody,
    });
  };

  // ============================================================================
  // 1. Bucket Capacity & Burst Limit (10 req/min for Auth)
  // ============================================================================
  describe("1. Burst Limit & HTTP 429 Enforcement", () => {
    test("confirms auth tier capacity is configured to 10 requests", () => {
      expect(DEFAULT_LIMIT_CONFIGS.auth.capacity).toBe(10);
      expect(DEFAULT_LIMIT_CONFIGS.auth.refillRatePerMinute).toBe(10);
    });

    test("permits exactly 10 burst requests, throttles 11th with HTTP 429 and Retry-After header", async () => {
      const clientIp = "198.51.100.120";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Send 10 burst requests to exhaust bucket capacity
      for (let i = 0; i < 10; i++) {
        const req = createLoginRequest(clientIp);
        const res = await loginHandler(req);

        // Requests within capacity reach the auth handler (401 because user not found)
        expect(res.status).toBe(401);
        expect(res.headers.get("X-RateLimit-Remaining")).toBe(String(9 - i));
        expect(res.headers.get("X-RateLimit-Reset")).toBeDefined();
        expect(res.headers.get("Retry-After")).toBeNull();
      }

      // 11th request exceeds bucket capacity -> must be throttled with HTTP 429
      const throttledReq = createLoginRequest(clientIp);
      const throttledRes = await loginHandler(throttledReq);

      expect(throttledRes.status).toBe(429);

      // Verify payload
      const json = await throttledRes.json();
      expect(json).toEqual({
        error: "Too many login attempts. Please try again later.",
      });

      // Verify RFC Rate Limit Headers
      const retryAfter = throttledRes.headers.get("Retry-After");
      expect(retryAfter).not.toBeNull();
      expect(Number(retryAfter)).toBeGreaterThan(0);
      expect(Number(retryAfter)).toBeLessThanOrEqual(60);

      const remaining = throttledRes.headers.get("X-RateLimit-Remaining");
      expect(remaining).toBe("0");

      const reset = throttledRes.headers.get("X-RateLimit-Reset");
      expect(reset).not.toBeNull();
      expect(Number(reset)).toBeGreaterThan(Date.now() - 5000);
    });

    test("subsequent burst requests while throttled consistently return HTTP 429 with Retry-After", async () => {
      const clientIp = "198.51.100.121";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Exhaust all 10 tokens
      for (let i = 0; i < 10; i++) {
        await loginHandler(createLoginRequest(clientIp));
      }

      // Send 5 consecutive burst requests beyond limit
      for (let j = 0; j < 5; j++) {
        const excessReq = createLoginRequest(clientIp);
        const excessRes = await loginHandler(excessReq);

        expect(excessRes.status).toBe(429);
        expect(excessRes.headers.get("Retry-After")).not.toBeNull();
        expect(Number(excessRes.headers.get("Retry-After"))).toBeGreaterThan(0);
        expect(excessRes.headers.get("X-RateLimit-Remaining")).toBe("0");
      }
    });
  });

  // ============================================================================
  // 2. Multi-IP Isolation & Header Resolution
  // ============================================================================
  describe("2. Multi-IP Isolation & Header Resolution", () => {
    test("exhausting capacity on IP 1 does not throttle IP 2", async () => {
      const victimIp = "198.51.100.122";
      const distinctIp = "198.51.100.123";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Exhaust victim IP
      for (let i = 0; i < 10; i++) {
        await loginHandler(createLoginRequest(victimIp));
      }

      // Verify victim IP is throttled
      const victimRes = await loginHandler(createLoginRequest(victimIp));
      expect(victimRes.status).toBe(429);

      // Verify distinct IP is allowed with full remaining tokens
      const cleanReq = createLoginRequest(distinctIp);
      const cleanRes = await loginHandler(cleanReq);

      expect(cleanRes.status).toBe(401);
      expect(cleanRes.headers.get("X-RateLimit-Remaining")).toBe("9");
      expect(cleanRes.headers.get("Retry-After")).toBeNull();
    });

    test("rate limits properly using client IP from proxy chain in x-forwarded-for", async () => {
      const clientIp = "198.51.100.124";
      const proxyChain = `${clientIp}, 10.0.0.1, 172.16.0.2`;
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        const req = createLoginRequest(clientIp, undefined, { "x-forwarded-for": proxyChain });
        const res = await loginHandler(req);
        expect(res.status).toBe(401);
      }

      const throttledReq = createLoginRequest(clientIp, undefined, {
        "x-forwarded-for": proxyChain,
      });
      const throttledRes = await loginHandler(throttledReq);

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.headers.get("Retry-After")).not.toBeNull();
    });

    test("rate limits properly using x-real-ip when x-forwarded-for is missing", async () => {
      const realIp = "198.51.100.125";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      const createRealIpRequest = () => {
        const headers = new Headers({
          "Content-Type": "application/json",
          "x-real-ip": realIp,
        });
        return new NextRequest("https://cognitiveedgeclinic.com/api/auth/login", {
          method: "POST",
          headers,
          body: JSON.stringify({ email: "member_test_01@example.com", password: "mock-password-xyz" }),
        });
      };

      for (let i = 0; i < 10; i++) {
        const res = await loginHandler(createRealIpRequest());
        expect(res.status).toBe(401);
      }

      const throttled = await loginHandler(createRealIpRequest());
      expect(throttled.status).toBe(429);
      expect(throttled.headers.get("Retry-After")).not.toBeNull();
    });
  });

  // ============================================================================
  // 3. Reset & Recovery
  // ============================================================================
  describe("3. Reset & Recovery Behavior", () => {
    test("clearing rate limits restores access immediately", async () => {
      const clientIp = "198.51.100.126";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Exhaust capacity
      for (let i = 0; i < 10; i++) {
        await loginHandler(createLoginRequest(clientIp));
      }

      // Verify throttled
      const throttledRes = await loginHandler(createLoginRequest(clientIp));
      expect(throttledRes.status).toBe(429);

      // Reset limits
      resetRateLimits();

      // Next request should succeed again
      const restoredRes = await loginHandler(createLoginRequest(clientIp));
      expect(restoredRes.status).toBe(401);
      expect(restoredRes.headers.get("X-RateLimit-Remaining")).toBe("9");
      expect(restoredRes.headers.get("Retry-After")).toBeNull();
    });
  });
});
