import {
  buildPathwayEmailHtml,
  sendPathwayInquiryEmail,
  PathwayEmailPayload,
} from "@/lib/email/resend";

describe("Resend Transactional Email Dispatcher Suite (__tests__/email/resendDispatcher.test.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const samplePayload: PathwayEmailPayload = {
    submitterEmail: "prospective.patient@example.com",
    recipient: "andreas.runheim@gmail.com",
    selectedObjectives: ["cognitive-endurance", "autonomic-hrv"],
    assessmentId: "uuid-1234-test-assessment",
    timestamp: "2026-09-25T04:30:00.000Z",
  };

  describe("HTML Email Template Construction", () => {
    test("builds luxury HTML email with submitter email and selected objectives", () => {
      const html = buildPathwayEmailHtml(samplePayload);

      expect(html).toContain("prospective.patient@example.com");
      expect(html).toContain("Executive Cognitive Endurance");
      expect(html).toContain("DLPFC & ATP Synthesis");
      expect(html).toContain("Autonomic Regulation & Deep Sleep");
      expect(html).toContain("Vagal Tone (rMSSD > 55ms)");
      expect(html).toContain("mailto:prospective.patient@example.com");
      expect(html).toContain("Dr. Andreas Runheim, MD");
    });
  });

  describe("Dispatch Lifecycle & Resend API Integration", () => {
    test("gracefully simulates delivery when RESEND_API_KEY is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendPathwayInquiryEmail(samplePayload);
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    test("invokes Resend API when RESEND_API_KEY is configured", async () => {
      process.env.RESEND_API_KEY = "re_mock_test_key_123456";

      const originalFetch = global.fetch;
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "resend-email-id-9988" }),
      });
      global.fetch = mockFetch;

      try {
        const result = await sendPathwayInquiryEmail(samplePayload);
        expect(result.success).toBe(true);
        expect(result.id).toBe("resend-email-id-9988");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.resend.com/emails",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer re_mock_test_key_123456",
            }),
          })
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    test("handles Resend API error response safely without throwing", async () => {
      process.env.RESEND_API_KEY = "re_mock_test_key_123456";

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Domain not verified or invalid API key" }),
      });

      try {
        const result = await sendPathwayInquiryEmail(samplePayload);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Domain not verified");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
