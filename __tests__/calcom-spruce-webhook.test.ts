import { POST } from "@/app/api/webhooks/calcom/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

describe("Cal.com to Spruce Health Webhook Relay (/api/webhooks/calcom)", () => {
  const secret = "test_webhook_secret_key_12345";
  const spruceKey = "test_spruce_api_key_67890";
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      CALCOM_WEBHOOK_SECRET: secret,
      SPRUCE_API_KEY: spruceKey,
    };
    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createSignedRequest(body: object, customSecret?: string): NextRequest {
    const rawBody = JSON.stringify(body);
    const hmac = crypto.createHmac("sha256", customSecret || secret);
    const signature = hmac.update(rawBody).digest("hex");

    return new NextRequest("http://localhost:3000/api/webhooks/calcom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cal-signature-256": signature,
      },
      body: rawBody,
    });
  }

  // TEST CASE 1: Valid BOOKING_CREATED event triggers Spruce POST and returns 200
  test("Test Case 1: Valid BOOKING_CREATED payload triggers POST to Spruce contacts and returns 200", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: "spruce_contact_123", displayName: "Richard Roe" }),
    });

    const bookingPayload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "cal_booking_982148",
        title: "Comprehensive 45-Minute Neuro-Diagnostic Consultation",
        startTime: "2026-08-20T14:15:00.000Z",
        attendees: [
          {
            name: "Richard Roe",
            email: "richard.roe@example.com",
            phoneNumber: "+13365550144",
            timeZone: "America/New_York",
          },
        ],
      },
    };

    const req = createSignedRequest(bookingPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.event).toBe("BOOKING_CREATED");
    expect(json.candidate.email).toBe("richard.roe@example.com");
    expect(json.spruceRelayStatus).toBe("provisioned");

    // Verify Spruce fetch call parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sprucehealth.com/v1/contacts",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spruceKey}`,
        },
        body: expect.stringContaining("richard.roe@example.com"),
      })
    );
  });

  // TEST CASE 2: Non-booking events (e.g. BOOKING_RESCHEDULED) are gracefully ignored without calling Spruce
  test("Test Case 2: Non-booking events (e.g. BOOKING_RESCHEDULED) are gracefully ignored with 200 without calling Spruce", async () => {
    const rescheduledPayload = {
      triggerEvent: "BOOKING_RESCHEDULED",
      payload: {
        uid: "cal_booking_982148",
        title: "Rescheduled Consultation",
      },
    };

    const req = createSignedRequest(rescheduledPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toContain("BOOKING_RESCHEDULED acknowledged without action");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST CASE 3: Signature mismatch returns HTTP 401
  test("Test Case 3: Invalid HMAC signature returns HTTP 401 Unauthorized", async () => {
    const bookingPayload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        attendees: [{ name: "Impostor", email: "hacker@example.com" }],
      },
    };

    // Sign with an invalid secret
    const req = createSignedRequest(bookingPayload, "wrong_unauthorized_secret");
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid HMAC signature");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // TEST CASE 4: Spruce API downtime (502 Bad Gateway) is gracefully caught and swallowed without unhandled server crashes
  test("Test Case 4: Spruce API downtime (502 Bad Gateway) is gracefully handled without crashing", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new Error("Invalid JSON from 502 Bad Gateway");
      },
    });

    const bookingPayload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "cal_booking_down_test",
        startTime: "2026-08-21T10:00:00Z",
        attendees: [
          {
            name: "Eleanor Vance",
            email: "eleanor.vance@example.com",
          },
        ],
      },
    };

    const req = createSignedRequest(bookingPayload);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.spruceRelayStatus).toBe("failed");
    expect(json.spruceResponse.statusText).toBe("Bad Gateway");
  });
});
