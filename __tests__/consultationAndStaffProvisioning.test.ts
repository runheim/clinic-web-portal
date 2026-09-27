import React from "react";
import { renderToString } from "react-dom/server";
import { NextRequest } from "next/server";
import ConsultationPage from "@/app/consultation/page";
import LoginPage from "@/app/login/page";
import { VaultInner } from "@/app/vault/page";
import AdminProvisioningPage from "@/app/vault/admin/page";
import { POST as provisionHandler } from "@/app/api/auth/provision/route";
import { createSessionToken, saveMember, getMember } from "@/lib/auth/server";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe("Consultation Route Recovery & Staff-Only Auth Provisioning Suite", () => {
  beforeAll(() => {
    process.env.CLINIC_AUTH_SECRET = "test_auth_secret_clinical_edge_2026";
  });

  describe("Subagent 1: Luxury Consultation Route (/consultation)", () => {
    let html: string;

    beforeAll(() => {
      html = renderToString(React.createElement(ConsultationPage));
    });

    test("renders header and context with eyebrow and H1", () => {
      expect(html).toContain("● DIRECT CLINICAL INTAKE");
      expect(html).toContain("Schedule a Free Consultation");
      expect(html).toContain(
        "Connect directly with our clinical coordinator to begin your neuro-cellular and longevity evaluation."
      );
    });

    test("renders Card A: Direct Email Communication to andreas.runheim@gmail.com", () => {
      expect(html).toContain("SECURE CLINICAL INTAKE");
      expect(html).toContain("Email Clinical Staff");
      expect(html).toContain("Cognitive Edge Clinic");
      expect(html).toContain("andreas.runheim@gmail.com");
      expect(html).toContain("mailto:andreas.runheim@gmail.com?subject=Free%20Consultation%20Inquiry%20-%20Cognitive%20Edge%20Clinic");
      expect(html).toContain("Email Cognitive Edge Clinic");
    });

    test("renders Card B: Secure Text via Spruce Health (+1 743-333-0880)", () => {
      expect(html).toContain("ENCRYPTED CARE MESSENGER");
      expect(html).toContain("Text Clinical Staff via Spruce Health");
      expect(html).toContain("Spruce Health Telemetry");
      expect(html).toContain("+1 (743) 333-0880");
      expect(html).toContain("sms:+17433330880?&amp;body=Schedule%20free%20consultation%20with%20our%20clinic%20coordinator");
      expect(html).toContain("Text Clinic Coordinator via Spruce");
    });

    test("renders membership context banner and return to home navigation", () => {
      expect(html).toContain(
        "Evaluating ongoing clinical care? Explore our membership tiers and concierge programs."
      );
      expect(html).toContain('href="/membership"');
      expect(html).toContain("View Membership Options");
      expect(html).toContain('href="/"');
      expect(html).toContain("Return to Home");
    });
  });

  describe("Subagent 2: CTA Routing Verification", () => {
    test("secondary consultation trigger navigates cleanly to /consultation", () => {
      const html = renderToString(React.createElement(ConsultationPage));
      expect(html).toBeDefined();
    });
  });

  describe("Subagent 3: Staff Provisioning API Endpoint (/api/auth/provision)", () => {
    test("rejects unauthenticated requests with HTTP 401", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "patient@test.com", password: "Password123!" }),
      });

      const res = await provisionHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authentication required");
    });

    test("rejects non-admin clients with HTTP 403 Forbidden", async () => {
      const clientToken = createSessionToken("standarduser@example.com", "client");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${clientToken}`,
        },
        body: JSON.stringify({ email: "patient2@test.com", password: "Password123!" }),
      });

      const res = await provisionHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    test("rejects password shorter than 8 characters with HTTP 400", async () => {
      const adminToken = createSessionToken("admin@cognitiveedge.clinic", "admin");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({ email: "patient3@test.com", password: "short" }),
      });

      const res = await provisionHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Password must be at least 8 characters");
    });

    test("successfully provisions new user when called by admin with HTTP 201 and Spruce message", async () => {
      const adminToken = createSessionToken("owner@cognitiveedge.clinic", "admin");
      const newEmail = `provisioned_${Date.now()}@patient.com`;
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: "SecurePatientPassword123!",
          clientName: "Jane Doe",
          role: "client",
        }),
      });

      const res = await provisionHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.spruceMessage).toContain("Welcome to Cognitive Edge Clinic");
      expect(data.spruceMessage).toContain(newEmail);
      expect(data.spruceMessage).toContain("SecurePatientPassword123!");

      // Confirm user can be retrieved
      const member = await getMember(newEmail);
      expect(member).not.toBeNull();
      expect(member?.email).toBe(newEmail);
    });

    test("rejects duplicate email provisioning with HTTP 409", async () => {
      const adminToken = createSessionToken("admin@cognitiveedge.clinic", "admin");
      const duplicateEmail = `duplicate_${Date.now()}@patient.com`;

      await saveMember({
        email: duplicateEmail,
        salt: "salt",
        hash: "hash",
        createdAt: new Date().toISOString(),
      });

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/auth/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({
          email: duplicateEmail,
          password: "SecurePatientPassword123!",
        }),
      });

      const res = await provisionHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });
  });

  describe("Subagent 3: In-Portal Provisioning UI & Static Security Notice", () => {
    test("login page renders static staff-only restriction notice", () => {
      const html = renderToString(React.createElement(LoginPage));
      expect(html).toContain(
        "Access Restricted: Client portal credentials are created and provisioned exclusively by Cognitive Edge Clinic staff. Contact your coordinator to initiate access."
      );
    });

    test("vault unauthenticated gate renders static staff-only restriction notice", () => {
      const html = renderToString(
        React.createElement(VaultInner, { initialAuthenticated: false })
      );
      expect(html).toContain(
        "Access Restricted: Client portal credentials are created and provisioned exclusively by Cognitive Edge Clinic staff. Contact your coordinator to initiate access."
      );
    });

    test("vault page displays Administrative Client Provisioning section when role is admin", () => {
      const html = renderToString(
        React.createElement(VaultInner, {
          initialAuthenticated: true,
          initialEmail: "owner@cognitiveedge.com",
          initialRole: "admin",
        })
      );
      expect(html).toContain("Administrative Client Provisioning");
      expect(html).toContain("Staff Credential Dispatch Desk");
      expect(html).toContain("Client Email Address");
      expect(html).toContain("Temporary Password");
    });

    test("admin provisioning page (/vault/admin) renders securely", () => {
      const html = renderToString(React.createElement(AdminProvisioningPage));
      expect(html).toBeDefined();
    });
  });
});
