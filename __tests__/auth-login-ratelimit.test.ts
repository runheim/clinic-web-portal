import { POST } from "@/app/api/auth/login/route";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import * as authServer from "@/lib/auth/server";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth/server", () => ({
  getMember: jest.fn(),
  verifyPassword: jest.fn(),
  createSessionToken: jest.fn(),
}));

describe("Subagent Beta: Auth Login Route Rate Limiting & Security Protection", () => {
  beforeEach(() => {
    resetRateLimits();
    jest.clearAllMocks();
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

    return new NextRequest("https://cognitiveedgeclinic.com/api/auth/login", {
      method: "POST",
      headers: headerMap,
      body: rawBody,
    });
  };

  describe("1. Client IP Resolution", () => {
    test("Resolves client IP from single x-forwarded-for header", async () => {
      const clientIp = "198.51.100.10";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      // Send 10 requests to consume all tokens for this IP
      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          { email: "user@example.com", password: "Password123!" },
          { "x-forwarded-for": clientIp }
        );
        const res = await POST(req);
        expect(res.status).toBe(401);
      }

      // 11th request from same IP should be rate limited
      const reqThrottled = createRequest(
        { email: "user@example.com", password: "Password123!" },
        { "x-forwarded-for": clientIp }
      );
      const resThrottled = await POST(reqThrottled);
      expect(resThrottled.status).toBe(429);

      // Different IP is unaffected
      const reqOther = createRequest(
        { email: "user@example.com", password: "Password123!" },
        { "x-forwarded-for": "198.51.100.11" }
      );
      const resOther = await POST(reqOther);
      expect(resOther.status).toBe(401);
    });

    test("Resolves client IP from comma-separated x-forwarded-for (first IP)", async () => {
      const firstIp = "198.51.100.20";
      const forwardedChain = `${firstIp}, 10.0.0.1, 172.16.0.1`;
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          { email: "user@example.com", password: "Password123!" },
          { "x-forwarded-for": forwardedChain }
        );
        const res = await POST(req);
        expect(res.status).toBe(401);
      }

      // 11th request matching first IP is throttled
      const reqThrottled = createRequest(
        { email: "user@example.com", password: "Password123!" },
        { "x-forwarded-for": firstIp }
      );
      const resThrottled = await POST(reqThrottled);
      expect(resThrottled.status).toBe(429);
    });

    test("Resolves client IP from x-real-ip when x-forwarded-for is missing", async () => {
      const realIp = "198.51.100.30";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        const req = createRequest(
          { email: "user@example.com", password: "Password123!" },
          { "x-real-ip": realIp }
        );
        const res = await POST(req);
        expect(res.status).toBe(401);
      }

      const throttled = await POST(
        createRequest(
          { email: "user@example.com", password: "Password123!" },
          { "x-real-ip": realIp }
        )
      );
      expect(throttled.status).toBe(429);
    });

    test("Falls back to 127.0.0.1 when neither x-forwarded-for nor x-real-ip is provided", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        const req = createRequest({ email: "user@example.com", password: "Password123!" });
        const res = await POST(req);
        expect(res.status).toBe(401);
      }

      const throttled = await POST(
        createRequest({ email: "user@example.com", password: "Password123!" })
      );
      expect(throttled.status).toBe(429);
    });
  });

  describe("2. HTTP 429 Response Format and RFC Headers", () => {
    test("Returns standard 429 payload with Retry-After, X-RateLimit-Remaining, and X-RateLimit-Reset", async () => {
      const clientIp = "198.51.100.40";
      (authServer.getMember as jest.Mock).mockResolvedValue(null);

      for (let i = 0; i < 10; i++) {
        await POST(
          createRequest(
            { email: "user@example.com", password: "Password123!" },
            { "x-forwarded-for": clientIp }
          )
        );
      }

      const res = await POST(
        createRequest(
          { email: "user@example.com", password: "Password123!" },
          { "x-forwarded-for": clientIp }
        )
      );

      expect(res.status).toBe(429);

      const json = await res.json();
      expect(json).toEqual({
        error: "Too many login attempts. Please try again later.",
      });

      // Headers verification
      const retryAfter = res.headers.get("Retry-After");
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!, 10)).toBeGreaterThan(0);

      const remaining = res.headers.get("X-RateLimit-Remaining");
      expect(remaining).toBe("0");

      const reset = res.headers.get("X-RateLimit-Reset");
      expect(reset).toBeDefined();
      expect(Number(reset)).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe("3. Normal Authentication Flow Within Rate Limit", () => {
    test("Returns 400 when JSON body is invalid", async () => {
      const req = createRequest("not-valid-json", {
        "x-forwarded-for": "198.51.100.50",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON payload.");
    });

    test("Returns 400 when email or password is missing", async () => {
      const req = createRequest(
        { email: "user@example.com" },
        { "x-forwarded-for": "198.51.100.51" }
      );
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Email and password are required.");
    });

    test("Returns 401 when member does not exist", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValueOnce(null);

      const req = createRequest(
        { email: "unknown@example.com", password: "SecretPassword123!" },
        { "x-forwarded-for": "198.51.100.52" }
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid email or password.");
    });

    test("Returns 401 when password verification fails", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValueOnce({
        email: "member@example.com",
        salt: "salt123",
        hash: "hash123",
      });
      (authServer.verifyPassword as jest.Mock).mockReturnValueOnce(false);

      const req = createRequest(
        { email: "member@example.com", password: "WrongPassword" },
        { "x-forwarded-for": "198.51.100.53" }
      );
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Invalid email or password.");
    });

    test("Returns 200 with session cookie when credentials are valid", async () => {
      (authServer.getMember as jest.Mock).mockResolvedValueOnce({
        email: "member@example.com",
        salt: "salt123",
        hash: "hash123",
      });
      (authServer.verifyPassword as jest.Mock).mockReturnValueOnce(true);
      (authServer.createSessionToken as jest.Mock).mockReturnValueOnce("test_session_token_xyz");

      const req = createRequest(
        { email: "member@example.com", password: "CorrectPassword123!" },
        { "x-forwarded-for": "198.51.100.54" }
      );
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual({
        success: true,
        email: "member@example.com",
      });

      const cookie = res.cookies.get("clinic_session");
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe("test_session_token_xyz");
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe("lax");
    });
  });
});
