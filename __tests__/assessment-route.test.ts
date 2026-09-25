import { POST } from "@/app/api/assessment/route";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import { NextRequest } from "next/server";

describe("Public Assessment Endpoint (/api/assessment)", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterAll(() => {
    resetRateLimits();
  });

  const createRequest = (
    body: object | string | null,
    headers: Record<string, string> = {}
  ): NextRequest => {
    const rawBody = body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
    const headerMap = new Headers(headers);
    if (rawBody && !headerMap.has("Content-Type")) {
      headerMap.set("Content-Type", "application/json");
    }

    return new NextRequest("https://cognitiveedgeclinic.com/api/assessment", {
      method: "POST",
      headers: headerMap,
      body: rawBody,
    });
  };

  test("successfully processes valid assessment answers and returns sanitized summary", async () => {
    const req = createRequest(
      {
        answers: {
          srt_latency: 245.8,
          working_memory_score: 88,
          b6_level: "low",
        },
        metadata: {
          cohort: "40-59",
        },
      },
      { "x-forwarded-for": "198.51.100.1" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary).toBeDefined();
    expect(data.summary.quarantine).toBe("ZERO_ePHI_ENFORCED");
    expect(data.summary.metrics.totalAnswers).toBe(3);
    expect(data.summary.metrics.numericAnswersCount).toBe(2);
    expect(data.summary.metrics.averageNumericScore).toBe(166.9);
    expect(data.summary.assessmentId).toBeDefined();
    expect(res.headers.get("X-Zero-ePHI-Quarantine")).toBe("enforced");
  });

  test("strictly enforces 5 requests/minute rate limit", async () => {
    const clientIp = "198.51.100.99";

    // 5 requests allowed
    for (let i = 0; i < 5; i++) {
      const req = createRequest(
        { answers: { q1: i } },
        { "x-forwarded-for": clientIp }
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 6th request throttled with 429
    const throttledReq = createRequest(
      { answers: { q1: 5 } },
      { "x-forwarded-for": clientIp }
    );
    const throttledRes = await POST(throttledReq);
    expect(throttledRes.status).toBe(429);

    const json = await throttledRes.json();
    expect(json.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(throttledRes.headers.get("Retry-After")).toBeDefined();
    expect(throttledRes.headers.get("X-RateLimit-Remaining")).toBe("0");

    // Other IP unaffected
    const otherReq = createRequest(
      { answers: { q1: 1 } },
      { "x-forwarded-for": "198.51.100.100" }
    );
    const otherRes = await POST(otherReq);
    expect(otherRes.status).toBe(200);
  });

  test("rejects invalid input schema (missing answers)", async () => {
    const req = createRequest(
      { metadata: { cohort: "20-39" } },
      { "x-forwarded-for": "198.51.100.2" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  test("strictly rejects unknown top-level properties", async () => {
    const req = createRequest(
      {
        answers: { q1: 10 },
        injectedAdminRole: true,
      },
      { "x-forwarded-for": "198.51.100.3" }
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  test("rejects prototype pollution in assessment payload", async () => {
    const raw = '{"answers":{"q1":1},"__proto__":{"polluted":true}}';
    const req = createRequest(raw, { "x-forwarded-for": "198.51.100.4" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("PROTOTYPE_POLLUTION_DETECTED");
  });

  test("rejects payloads > 64KB with HTTP 413", async () => {
    const largePadding = "x".repeat(65 * 1024);
    const req = createRequest(
      { answers: { q1: largePadding } },
      { "x-forwarded-for": "198.51.100.5" }
    );
    const res = await POST(req);
    expect(res.status).toBe(413);

    const json = await res.json();
    expect(json.code).toBe("PAYLOAD_TOO_LARGE");
  });
});
