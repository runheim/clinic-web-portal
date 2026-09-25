import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/assessment/route";
import ClinicalPreScreeningAssessmentPage, {
  PATHWAY_OBJECTIVES,
} from "@/app/assessment/page";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";
import { getPathwayInquiry } from "@/lib/assessment/pathwayStore";

describe("Subagent 2: Assessment Objectives & Pathway Email Dispatch Test Suite", () => {
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
    const rawBody =
      body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
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

  describe("1. POST /api/assessment Pathway Submission Engine", () => {
    test("successfully processes pathway submission with email, objectives, and default targetRecipient", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      const email = "patient.candidate@domain.com";
      const selectedObjectives = [
        "Executive Cognitive Endurance (DLPFC & ATP Synthesis)",
        "Autonomic Regulation & Deep Sleep (Vagal Tone (rMSSD > 55ms))",
      ];

      const req = createRequest(
        {
          email,
          selectedObjectives,
        },
        { "x-forwarded-for": "198.51.100.10" }
      );

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipient).toBe("andreas.runheim@gmail.com");
      expect(data.message).toBe("Objectives successfully transmitted to clinical team.");
      expect(data.summary).toBeDefined();
      expect(data.summary.quarantine).toBe("ZERO_ePHI_ENFORCED");
      expect(data.summary.selectedObjectives).toEqual(selectedObjectives);
      expect(data.summary.assessmentId).toBeDefined();

      // Headers check
      expect(res.headers.get("X-Zero-ePHI-Quarantine")).toBe("enforced");
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      // Verify structured dispatch console logging
      expect(consoleSpy).toHaveBeenCalledWith(
        `[CLINICAL DISPATCH] Intended recipient: andreas.runheim@gmail.com | Submitter: ${email} | Objectives: ${selectedObjectives.join(", ")}`
      );

      // Verify persistence in pathway store (Blobs or local disk fallback)
      const record = await getPathwayInquiry(data.summary.assessmentId);
      expect(record).not.toBeNull();
      expect(record?.submitterEmail).toBe(email);
      expect(record?.targetRecipient).toBe("andreas.runheim@gmail.com");
      expect(record?.objectives).toEqual(selectedObjectives);
      expect(record?.status).toBe("dispatched");
      expect(record?.formattedIntake).toContain("Assigned Clinician: andreas.runheim@gmail.com");
      expect(record?.formattedIntake).toContain(email);

      consoleSpy.mockRestore();
    });

    test("supports optional custom targetRecipient when provided", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      const email = "exec@biotech.org";
      const customRecipient = "concierge.triage@domain.com";
      const selectedObjectives = [
        "Neurovascular & Endothelial Health (Cerebral Perfusion & eNOS)",
      ];

      const req = createRequest(
        {
          email,
          selectedObjectives,
          targetRecipient: customRecipient,
        },
        { "x-forwarded-for": "198.51.100.11" }
      );

      const res = await POST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recipient).toBe(customRecipient);
      expect(consoleSpy).toHaveBeenCalledWith(
        `[CLINICAL DISPATCH] Intended recipient: ${customRecipient} | Submitter: ${email} | Objectives: ${selectedObjectives.join(", ")}`
      );

      consoleSpy.mockRestore();
    });

    test("rejects invalid email formatting in pathway submission", async () => {
      const req = createRequest(
        {
          email: "invalid-not-an-email",
          selectedObjectives: ["Executive Cognitive Endurance"],
        },
        { "x-forwarded-for": "198.51.100.12" }
      );

      const res = await POST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(JSON.stringify(data.details)).toContain("email");
    });

    test("strictly enforces 5 requests/minute rate limit on pathway submissions", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const clientIp = "198.51.100.55";

      for (let i = 0; i < 5; i++) {
        const req = createRequest(
          {
            email: `patient${i}@domain.com`,
            selectedObjectives: ["Postural & Pelvic Core Stability (BTL Emsella 2.5 Tesla)"],
          },
          { "x-forwarded-for": clientIp }
        );
        const res = await POST(req);
        expect(res.status).toBe(200);
      }

      // 6th request is throttled
      const throttledReq = createRequest(
        {
          email: "throttled@domain.com",
          selectedObjectives: ["Postural & Pelvic Core Stability (BTL Emsella 2.5 Tesla)"],
        },
        { "x-forwarded-for": clientIp }
      );
      const throttledRes = await POST(throttledReq);
      expect(throttledRes.status).toBe(429);

      const data = await throttledRes.json();
      expect(data.code).toBe("RATE_LIMIT_EXCEEDED");

      consoleSpy.mockRestore();
    });

    test("rejects prototype pollution attempts in pathway payload", async () => {
      const raw =
        '{"email":"hacker@evil.com","selectedObjectives":["Test"],"__proto__":{"isAdmin":true}}';
      const req = createRequest(raw, { "x-forwarded-for": "198.51.100.13" });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.code).toBe("PROTOTYPE_POLLUTION_DETECTED");
    });
  });

  describe("2. Assessment Page UI Component Rendering", () => {
    let renderedHtml: string;

    beforeAll(() => {
      renderedHtml = renderToString(React.createElement(ClinicalPreScreeningAssessmentPage));
    });

    test("renders the 4 core clickable longevity objectives cards with domains", () => {
      // 1. Executive Cognitive Endurance
      expect(renderedHtml).toContain("Executive Cognitive Endurance");
      expect(renderedHtml).toContain("DLPFC &amp; ATP Synthesis");

      // 2. Autonomic Regulation & Deep Sleep
      expect(renderedHtml).toContain("Autonomic Regulation &amp; Deep Sleep");
      expect(renderedHtml).toContain("Vagal Tone (rMSSD &gt; 55ms)");

      // 3. Neurovascular & Endothelial Health
      expect(renderedHtml).toContain("Neurovascular &amp; Endothelial Health");
      expect(renderedHtml).toContain("Cerebral Perfusion &amp; eNOS");

      // 4. Postural & Pelvic Core Stability
      expect(renderedHtml).toContain("Postural &amp; Pelvic Core Stability");
      expect(renderedHtml).toContain("BTL Emsella 2.5 Tesla");
    });

    test("renders email input with label 'Clinical Communication Email' and placeholder", () => {
      expect(renderedHtml).toContain("Clinical Communication Email");
      expect(renderedHtml).toContain('type="email"');
      expect(renderedHtml).toContain('placeholder="name@domain.com"');
      expect(renderedHtml).toContain("required");
    });

    test("renders clinical concierge direct transmission indicator", () => {
      expect(renderedHtml).toContain(
        "Your priority objectives will be transmitted directly to our clinical concierge at andreas.runheim@gmail.com."
      );
    });

    test("renders the luxury pathway submit button", () => {
      expect(renderedHtml).toContain("Transmit Objectives &amp; Request Pathway →");
    });

    test("renders Zero-ePHI assurance badge and brand navigation", () => {
      expect(renderedHtml).toContain("Zero-ePHI");
      expect(renderedHtml).toContain("Ephemeral Client State");
      expect(renderedHtml).toContain("Cognitive Edge");
    });

    test("verifies PATHWAY_OBJECTIVES array exports all 4 standard clinical targets", () => {
      expect(PATHWAY_OBJECTIVES).toHaveLength(4);
      const titles = PATHWAY_OBJECTIVES.map((o) => o.title);
      expect(titles).toContain("Executive Cognitive Endurance");
      expect(titles).toContain("Autonomic Regulation & Deep Sleep");
      expect(titles).toContain("Neurovascular & Endothelial Health");
      expect(titles).toContain("Postural & Pelvic Core Stability");
    });
  });
});
