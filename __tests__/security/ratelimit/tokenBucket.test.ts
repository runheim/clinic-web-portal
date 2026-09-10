import {
  checkRateLimit,
  resetRateLimits,
  getRateLimitMetrics,
  evictStaleBuckets,
  startPeriodicEviction,
  stopPeriodicEviction,
  configureRouteLimit,
  resolveRouteCategory,
  resolveRouteKey,
  STALE_BUCKET_TTL_MS,
  DEFAULT_LIMIT_CONFIGS,
  RateLimitResult,
  RateLimitMetrics,
} from "@/lib/security/ratelimit/tokenBucket";

describe("Security Engine — Edge Token Bucket Rate Limiter Battery", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterEach(() => {
    stopPeriodicEviction();
    resetRateLimits();
  });

  describe("1. Burst Capacity and Strict Route Limits", () => {
    test("Webhook endpoint: strictly enforces max 5 requests/min per IP", () => {
      const clientIp = "192.0.2.10";
      const baseTime = 1_000_000;

      // Burst of 5 requests should all succeed
      for (let i = 0; i < 5; i++) {
        const result: RateLimitResult = checkRateLimit(clientIp, "webhook", { now: baseTime });
        expect(result.allowed).toBe(true);
        expect(result.remainingTokens).toBe(4 - i);
        expect(result.retryAfterSeconds).toBeUndefined();
      }

      // 6th request within the same minute must be blocked
      const blockedResult = checkRateLimit(clientIp, "webhook", { now: baseTime });
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remainingTokens).toBe(0);
      expect(blockedResult.retryAfterSeconds).toBe(12); // 60s / 5 tokens = 12s per token
    });

    test("Webhook endpoint: resolves route paths containing 'webhook'", () => {
      const clientIp = "192.0.2.11";
      const baseTime = 1_000_000;

      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(clientIp, "/api/webhooks/calcom-spruce", { now: baseTime });
        expect(res.allowed).toBe(true);
      }

      const blocked = checkRateLimit(clientIp, "/api/webhooks/calcom-spruce", { now: baseTime });
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(12);
    });

    test("Auth routes: strictly enforces max 10 requests/min per IP", () => {
      const clientIp = "192.0.2.20";
      const baseTime = 2_000_000;

      // Burst of 10 requests should all be allowed
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(clientIp, "auth", { now: baseTime });
        expect(result.allowed).toBe(true);
        expect(result.remainingTokens).toBe(9 - i);
        expect(result.retryAfterSeconds).toBeUndefined();
      }

      // 11th request within the same minute must be blocked
      const blocked = checkRateLimit(clientIp, "auth", { now: baseTime });
      expect(blocked.allowed).toBe(false);
      expect(blocked.remainingTokens).toBe(0);
      expect(blocked.retryAfterSeconds).toBe(6); // 60s / 10 tokens = 6s per token
    });

    test("Contact endpoint: strictly enforces max 5 requests/min per IP", () => {
      const clientIp = "192.0.2.30";
      const baseTime = 3_000_000;

      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(clientIp, "/api/contact", { now: baseTime });
        expect(res.allowed).toBe(true);
      }

      const blocked = checkRateLimit(clientIp, "/api/contact", { now: baseTime });
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(12);
    });

    test("Default route: enforces standard 60 requests/min default", () => {
      const clientIp = "192.0.2.40";
      const baseTime = 4_000_000;

      // 60 requests succeed
      for (let i = 0; i < 60; i++) {
        const res = checkRateLimit(clientIp, "default", { now: baseTime });
        expect(res.allowed).toBe(true);
        expect(res.remainingTokens).toBe(59 - i);
      }

      // 61st request is blocked
      const blocked = checkRateLimit(clientIp, "default", { now: baseTime });
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(1); // 60s / 60 = 1s per token
    });

    test("Configurable defaults: supports custom route configuration", () => {
      const clientIp = "192.0.2.50";
      const baseTime = 5_000_000;

      configureRouteLimit("telehealth-consult", {
        capacity: 3,
        refillRatePerMinute: 3,
        windowMs: 60_000,
      });

      for (let i = 0; i < 3; i++) {
        expect(checkRateLimit(clientIp, "telehealth-consult", { now: baseTime }).allowed).toBe(true);
      }

      const blocked = checkRateLimit(clientIp, "telehealth-consult", { now: baseTime });
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBe(20); // 60s / 3 = 20s
    });

    test("Accepts options object as single argument", () => {
      const clientIp = "192.0.2.60";
      const res = checkRateLimit({ ip: clientIp, route: "webhook" });
      expect(res.allowed).toBe(true);
      expect(res.remainingTokens).toBe(4);
    });
  });

  describe("2. Rate Depletion & Retry-After Header Value Calculations", () => {
    test("Allowed requests omit retryAfterSeconds", () => {
      const res = checkRateLimit("192.0.2.70", "webhook");
      expect(res.allowed).toBe(true);
      expect(res.retryAfterSeconds).toBeUndefined();
    });

    test("Blocked request produces RFC 6585 / 7231 compliant integer Retry-After", () => {
      const clientIp = "192.0.2.71";
      const baseTime = 1_000_000;

      // Deplete 5 tokens
      for (let i = 0; i < 5; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }

      const throttled = checkRateLimit(clientIp, "webhook", { now: baseTime });
      expect(throttled.allowed).toBe(false);
      expect(typeof throttled.retryAfterSeconds).toBe("number");
      expect(Number.isInteger(throttled.retryAfterSeconds)).toBe(true);
      expect(throttled.retryAfterSeconds).toBe(12);

      // Verify header compatibility
      const retryAfterHeader = String(throttled.retryAfterSeconds);
      expect(retryAfterHeader).toBe("12");
      expect(parseInt(retryAfterHeader, 10)).toBe(12);
    });

    test("Calculates fractional time remaining accurately with Math.ceil", () => {
      const clientIp = "192.0.2.72";
      const baseTime = 1_000_000;

      // Deplete webhook bucket
      for (let i = 0; i < 5; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }

      // Check after 6,000ms (half of 12,000ms refill time)
      // 0.5 tokens refilled, 0.5 tokens still needed = 6,000ms => 6 seconds
      const halfWay = checkRateLimit(clientIp, "webhook", { now: baseTime + 6_000 });
      expect(halfWay.allowed).toBe(false);
      expect(halfWay.retryAfterSeconds).toBe(6);

      // Check after 11,500ms (500ms left until 1 token available)
      // Math.ceil(500 / 1000) = 1 second
      const nearEnd = checkRateLimit(clientIp, "webhook", { now: baseTime + 11_500 });
      expect(nearEnd.allowed).toBe(false);
      expect(nearEnd.retryAfterSeconds).toBe(1);
    });

    test("Returns valid resetTime timestamp indicating full bucket replenishment", () => {
      const clientIp = "192.0.2.73";
      const baseTime = 1_000_000;

      const first = checkRateLimit(clientIp, "webhook", { now: baseTime });
      expect(first.resetTime).toBe(baseTime + 12_000); // 1 token missing, 12s to full

      // Consume remaining 4 tokens
      for (let i = 0; i < 4; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }

      // Bucket empty: 5 tokens missing, 60,000ms to full
      const empty = checkRateLimit(clientIp, "webhook", { now: baseTime });
      expect(empty.resetTime).toBe(baseTime + 60_000);
      expect(empty.resetTime).toBeGreaterThan(baseTime);
    });
  });

  describe("3. Leak and Refill Timing", () => {
    test("Refills tokens smoothly over time based on elapsed milliseconds", () => {
      const clientIp = "192.0.2.80";
      const baseTime = 1_000_000;

      // Consume all 5 tokens
      for (let i = 0; i < 5; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }

      // At 11,999ms, still not enough for 1 full token
      const justBefore = checkRateLimit(clientIp, "webhook", { now: baseTime + 11_999 });
      expect(justBefore.allowed).toBe(false);

      // At 12,000ms, exactly 1 token is refilled and available
      const atRefill = checkRateLimit(clientIp, "webhook", { now: baseTime + 12_000 });
      expect(atRefill.allowed).toBe(true);
      expect(atRefill.remainingTokens).toBe(0); // consumed the 1 refilled token

      // Next request immediately fails
      const immediatelyAfter = checkRateLimit(clientIp, "webhook", { now: baseTime + 12_000 });
      expect(immediatelyAfter.allowed).toBe(false);
    });

    test("Refills multiple tokens across larger time increments", () => {
      const clientIp = "192.0.2.81";
      const baseTime = 1_000_000;

      // Consume all 5 tokens
      for (let i = 0; i < 5; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }

      // Advance by 36,000ms = 3 tokens refilled (36,000 / 12,000)
      const after3Tokens = checkRateLimit(clientIp, "webhook", { now: baseTime + 36_000 });
      expect(after3Tokens.allowed).toBe(true);
      expect(after3Tokens.remainingTokens).toBe(2); // 3 refilled - 1 consumed = 2 remaining
    });

    test("Never overflows bucket capacity even after prolonged idle period", () => {
      const clientIp = "192.0.2.82";
      const baseTime = 1_000_000;

      // Consume 1 token
      checkRateLimit(clientIp, "webhook", { now: baseTime });

      // Idle for 24 hours (86,400,000 ms)
      const afterDay = checkRateLimit(clientIp, "webhook", { now: baseTime + 86_400_000 });
      expect(afterDay.allowed).toBe(true);
      // Even with massive elapsed time, tokens capped at capacity (5) - 1 consumed = 4
      expect(afterDay.remainingTokens).toBe(4);
    });

    test("Supports multi-token cost parameter", () => {
      const clientIp = "192.0.2.83";
      const baseTime = 1_000_000;

      // Consume 3 tokens in one request
      const multi = checkRateLimit(clientIp, "webhook", { cost: 3, now: baseTime });
      expect(multi.allowed).toBe(true);
      expect(multi.remainingTokens).toBe(2);

      // Attempting cost 3 with only 2 tokens left should be blocked
      const denied = checkRateLimit(clientIp, "webhook", { cost: 3, now: baseTime });
      expect(denied.allowed).toBe(false);
      expect(denied.remainingTokens).toBe(2);
      expect(denied.retryAfterSeconds).toBe(12); // needs 1 more token = 12s
    });
  });

  describe("4. IP and Route Bucket Isolation", () => {
    test("Isolates rate limits between distinct client IP addresses", () => {
      const ipA = "10.0.0.1";
      const ipB = "10.0.0.2";
      const baseTime = 1_000_000;

      // Exhaust IP A
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ipA, "webhook", { now: baseTime }).allowed).toBe(true);
      }
      expect(checkRateLimit(ipA, "webhook", { now: baseTime }).allowed).toBe(false);

      // IP B must be completely unaffected and have full quota
      for (let i = 0; i < 5; i++) {
        const resB = checkRateLimit(ipB, "webhook", { now: baseTime });
        expect(resB.allowed).toBe(true);
        expect(resB.remainingTokens).toBe(4 - i);
      }
      expect(checkRateLimit(ipB, "webhook", { now: baseTime }).allowed).toBe(false);
    });

    test("Isolates rate limits between different routes for the same IP", () => {
      const clientIp = "192.168.1.50";
      const baseTime = 1_000_000;

      // Deplete webhook quota (5 requests)
      for (let i = 0; i < 5; i++) {
        checkRateLimit(clientIp, "webhook", { now: baseTime });
      }
      expect(checkRateLimit(clientIp, "webhook", { now: baseTime }).allowed).toBe(false);

      // Same IP can still access auth endpoints (10 requests quota)
      for (let i = 0; i < 10; i++) {
        const authRes = checkRateLimit(clientIp, "auth", { now: baseTime });
        expect(authRes.allowed).toBe(true);
      }
      expect(checkRateLimit(clientIp, "auth", { now: baseTime }).allowed).toBe(false);

      // Same IP can still access contact endpoints (5 requests quota)
      expect(checkRateLimit(clientIp, "contact", { now: baseTime }).allowed).toBe(true);
    });

    test("Handles IPv6 addresses safely without bucket collisions", () => {
      const ipv6A = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const ipv6B = "::1";
      const baseTime = 1_000_000;

      for (let i = 0; i < 5; i++) {
        checkRateLimit(ipv6A, "webhook", { now: baseTime });
      }
      expect(checkRateLimit(ipv6A, "webhook", { now: baseTime }).allowed).toBe(false);

      // Loopback IPv6 is isolated
      expect(checkRateLimit(ipv6B, "webhook", { now: baseTime }).allowed).toBe(true);
    });
  });

  describe("5. Stale IP Eviction and Memory Leak Protection", () => {
    test("Evicts buckets that have been inactive for > 1 hour", () => {
      const ip1 = "172.16.0.1";
      const ip2 = "172.16.0.2";
      const baseTime = 1_000_000;

      checkRateLimit(ip1, "webhook", { now: baseTime });
      checkRateLimit(ip2, "webhook", { now: baseTime + 1_800_000 }); // accessed 30 mins later

      expect(getRateLimitMetrics().totalTrackedBuckets).toBe(2);

      // Evict at baseTime + 1 hour + 1 millisecond
      // ip1 should be evicted (inactive for > 1 hour)
      // ip2 was accessed 30 mins ago, so it must be kept
      const evicted = evictStaleBuckets(STALE_BUCKET_TTL_MS, baseTime + STALE_BUCKET_TTL_MS + 1);
      expect(evicted).toBe(1);

      const metrics = getRateLimitMetrics();
      expect(metrics.totalTrackedBuckets).toBe(1);
      expect(metrics.evictedBucketsCount).toBe(1);
    });

    test("Retains active buckets accessed within the 1-hour window", () => {
      const activeIp = "172.16.0.3";
      const baseTime = 10_000_000;

      checkRateLimit(activeIp, "webhook", { now: baseTime });

      // Run eviction after 45 minutes (within 1 hour)
      const evicted = evictStaleBuckets(STALE_BUCKET_TTL_MS, baseTime + 45 * 60 * 1000);
      expect(evicted).toBe(0);
      expect(getRateLimitMetrics().totalTrackedBuckets).toBe(1);
    });

    test("Lazy eviction automatically triggers during checkRateLimit after 1 minute", () => {
      const staleIp = "172.16.0.4";
      const newIp = "172.16.0.5";
      const baseTime = 20_000_000;

      // Seed stale IP at baseTime
      checkRateLimit(staleIp, "webhook", { now: baseTime });
      expect(getRateLimitMetrics().totalTrackedBuckets).toBe(1);

      // Advance time by 1 hour + 2 minutes, and check with a new IP
      const futureTime = baseTime + STALE_BUCKET_TTL_MS + 120_000;
      checkRateLimit(newIp, "webhook", { now: futureTime });

      // The stale IP should have been lazily evicted, leaving only newIp
      const metrics = getRateLimitMetrics();
      expect(metrics.totalTrackedBuckets).toBe(1);
      expect(metrics.evictedBucketsCount).toBe(1);
    });

    test("Evicted IP receives a fresh full-capacity bucket on next request", () => {
      const ip = "172.16.0.6";
      const baseTime = 30_000_000;

      // Exhaust IP
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, "webhook", { now: baseTime });
      }
      expect(checkRateLimit(ip, "webhook", { now: baseTime }).allowed).toBe(false);

      // Evict after 1 hour
      evictStaleBuckets(STALE_BUCKET_TTL_MS, baseTime + STALE_BUCKET_TTL_MS + 1);

      // Request after eviction behaves like a brand new client
      const freshResult = checkRateLimit(ip, "webhook", { now: baseTime + STALE_BUCKET_TTL_MS + 10 });
      expect(freshResult.allowed).toBe(true);
      expect(freshResult.remainingTokens).toBe(4);
    });

    test("Zero open handles: background eviction timer starts, unrefs, and stops cleanly", () => {
      startPeriodicEviction(100);
      // Calling again is idempotent and replaces previous interval
      startPeriodicEviction(100);
      stopPeriodicEviction();
      // Safe to call stop multiple times
      stopPeriodicEviction();
    });
  });

  describe("6. Metrics Telemetry and Reset Controls", () => {
    test("Accurately tracks totalChecks, totalAllowed, and totalBlocked", () => {
      const ip = "10.10.10.1";
      const baseTime = 1_000_000;

      // 5 allowed
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, "webhook", { now: baseTime });
      }
      // 3 blocked
      for (let i = 0; i < 3; i++) {
        checkRateLimit(ip, "webhook", { now: baseTime });
      }

      const metrics: RateLimitMetrics = getRateLimitMetrics();
      expect(metrics.totalChecks).toBe(8);
      expect(metrics.totalAllowed).toBe(5);
      expect(metrics.totalBlocked).toBe(3);
      expect(metrics.totalTrackedBuckets).toBe(1);
      expect(metrics.bucketsByRoute.webhook).toBe(1);
    });

    test("resetRateLimits without arguments resets all buckets and counters", () => {
      checkRateLimit("1.1.1.1", "webhook");
      checkRateLimit("2.2.2.2", "auth");

      expect(getRateLimitMetrics().totalTrackedBuckets).toBe(2);

      resetRateLimits();

      const metrics = getRateLimitMetrics();
      expect(metrics.totalTrackedBuckets).toBe(0);
      expect(metrics.totalChecks).toBe(0);
      expect(metrics.totalAllowed).toBe(0);
      expect(metrics.totalBlocked).toBe(0);
      expect(metrics.evictedBucketsCount).toBe(0);
    });

    test("resetRateLimits with IP argument clears only that specific IP", () => {
      const targetIp = "192.168.100.1";
      const otherIp = "192.168.100.2";

      checkRateLimit(targetIp, "webhook");
      checkRateLimit(targetIp, "auth");
      checkRateLimit(otherIp, "webhook");

      expect(getRateLimitMetrics().totalTrackedBuckets).toBe(3);

      resetRateLimits(targetIp);

      const metrics = getRateLimitMetrics();
      expect(metrics.totalTrackedBuckets).toBe(1);
      expect(metrics.bucketsByRoute.webhook).toBe(1);
    });
  });

  describe("7. Helper Functions & Route Categorization", () => {
    test("resolveRouteCategory identifies webhook, auth, contact, and default", () => {
      expect(resolveRouteCategory("webhook")).toBe("webhook");
      expect(resolveRouteCategory("/api/webhooks/spruce")).toBe("webhook");
      expect(resolveRouteCategory("/api/auth/login")).toBe("auth");
      expect(resolveRouteCategory("/api/contact-us")).toBe("contact");
      expect(resolveRouteCategory("/api/other")).toBe("default");
      expect(resolveRouteCategory(undefined)).toBe("default");
    });

    test("resolveRouteKey preserves custom configured routes", () => {
      configureRouteLimit("custom-route", { capacity: 15, refillRatePerMinute: 15 });
      expect(resolveRouteKey("custom-route")).toBe("custom-route");
    });

    test("DEFAULT_LIMIT_CONFIGS exports required constants", () => {
      expect(DEFAULT_LIMIT_CONFIGS.webhook.capacity).toBe(5);
      expect(DEFAULT_LIMIT_CONFIGS.auth.capacity).toBe(10);
      expect(DEFAULT_LIMIT_CONFIGS.contact.capacity).toBe(5);
      expect(DEFAULT_LIMIT_CONFIGS.default.capacity).toBe(60);
    });
  });
});
