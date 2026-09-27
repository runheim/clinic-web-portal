import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { POST as sendConsultationHandler } from "@/app/api/consultation/send/route";
import { EmailIntakeModal } from "@/components/consultation/EmailIntakeModal";

// Mock Resend class
const mockSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe("Consultation Intake API & Interactive Modal Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Subagent 1: POST /api/consultation/send Endpoint", () => {
    test("returns HTTP 500 when RESEND_API_KEY is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Patient",
          email: "patient@example.com",
        }),
      });

      const res = await sendConsultationHandler(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("RESEND_API_KEY environment variable not configured");
    });

    test("returns HTTP 400 when name is missing", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key_12345";

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "patient@example.com",
          phone: "3365550199",
        }),
      });

      const res = await sendConsultationHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Name and either email or phone are required.");
    });

    test("returns HTTP 400 when both email and phone are missing", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key_12345";

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Patient",
        }),
      });

      const res = await sendConsultationHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Name and either email or phone are required.");
    });

    test("successfully dispatches email and returns HTTP 200 when payload is valid", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key_12345";
      mockSend.mockResolvedValueOnce({
        data: { id: "msg_123456" },
        error: null,
      });

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Eleanor Vance",
          email: "eleanor@example.com",
          phone: "(336) 555-0199",
          preferredModality: "Cognitive Optimization / TMS",
          notes: "Looking to address afternoon cognitive fatigue.",
        }),
      });

      const res = await sendConsultationHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Consultation request dispatched");

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.to).toEqual(["andreas.runheim@gmail.com"]);
      expect(callArgs.subject).toBe("New Consultation Request: Eleanor Vance [Cognitive Edge Clinic]");
      expect(callArgs.html).toContain("Eleanor Vance");
      expect(callArgs.html).toContain("eleanor@example.com");
      expect(callArgs.html).toContain("(336) 555-0199");
      expect(callArgs.html).toContain("Cognitive Optimization / TMS");
      expect(callArgs.html).toContain("Looking to address afternoon cognitive fatigue.");
    });

    test("attempts fallback sender if primary sender encounters domain verification error", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key_12345";
      mockSend
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Domain not verified", name: "validation_error" },
        })
        .mockResolvedValueOnce({
          data: { id: "msg_fallback_999" },
          error: null,
        });

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/consultation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Arthur Pendelton",
          email: "arthur@example.com",
        }),
      });

      const res = await sendConsultationHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend.mock.calls[0][0].from).toContain("covenantspineandneurology.com");
      expect(mockSend.mock.calls[1][0].from).toContain("onboarding@resend.dev");
    });
  });

  describe("Subagent 2: EmailIntakeModal Component", () => {
    test("does not render when isOpen is false", () => {
      const html = renderToString(
        React.createElement(EmailIntakeModal, {
          isOpen: false,
          onClose: jest.fn(),
        })
      );
      expect(html).toBe("");
    });

    test("renders all required form fields when isOpen is true", () => {
      const html = renderToString(
        React.createElement(EmailIntakeModal, {
          isOpen: true,
          onClose: jest.fn(),
        })
      );

      expect(html).toContain("DIRECT CLINICAL INTAKE");
      expect(html).toContain("Schedule a Free Consultation");
      expect(html).toContain("Full Name");
      expect(html).toContain("Email Address");
      expect(html).toContain("Mobile Phone");
      expect(html).toContain("Area of Clinical Focus");
      expect(html).toContain("Cognitive Optimization / TMS");
      expect(html).toContain("Dementia Prevention &amp; MCI");
      expect(html).toContain("Peptides &amp; Cellular Longevity");
      expect(html).toContain("Hormones &amp; Sexual Wellness");
      expect(html).toContain("Emsella &amp; Core Stability");
      expect(html).toContain("GLP-1 Metabolic Health");
      expect(html).toContain("General Longevity Consultation");
      expect(html).toContain("Notes / Questions");
      expect(html).toContain("Send Consultation Request");
      expect(html).toContain("Cancel");
    });
  });
});
