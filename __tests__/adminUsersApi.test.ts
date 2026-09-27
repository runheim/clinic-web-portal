import { NextRequest } from "next/server";
import { POST as adminUsersHandler } from "@/app/api/admin/users/route";
import { createSessionToken, saveMember, getMember } from "@/lib/auth/server";
import { isWebAuthnAvailable, isPlatformAuthenticatorAvailable, WEBAUTHN_DEPRECATED_CONFIG } from "@/lib/auth/webauthn";

describe("Admin Users API & WebAuthn Decoupling Suite", () => {
  beforeAll(() => {
    process.env.CLINIC_AUTH_SECRET = "test_auth_secret_clinical_edge_2026";
  });

  describe("WebAuthn Decoupling Stub", () => {
    test("confirms WebAuthn is decoupled and returns false", async () => {
      expect(WEBAUTHN_DEPRECATED_CONFIG.enabled).toBe(false);
      expect(WEBAUTHN_DEPRECATED_CONFIG.reason).toContain("staff-only provisioning");
      expect(await isWebAuthnAvailable()).toBe(false);
      expect(await isPlatformAuthenticatorAvailable()).toBe(false);
    });
  });

  describe("Admin Users Provisioning Route (/api/admin/users)", () => {
    test("rejects unauthenticated requests with HTTP 401", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unauth@test.com", password: "Password123!" }),
      });

      const res = await adminUsersHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authentication required");
    });

    test("rejects non-admin client session with HTTP 403 Forbidden", async () => {
      const clientToken = createSessionToken("standarduser@example.com", "client");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${clientToken}`,
        },
        body: JSON.stringify({ email: "newpatient@test.com", password: "Password123!" }),
      });

      const res = await adminUsersHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    test("rejects password shorter than 8 characters with HTTP 400", async () => {
      const adminToken = createSessionToken("admin@cognitiveedge.clinic", "admin");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({ email: "testpatient@test.com", password: "short" }),
      });

      const res = await adminUsersHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Password must be at least 8 characters");
    });

    test("successfully provisions user with HTTP 201 and formatted Spruce invitation string", async () => {
      const adminToken = createSessionToken("owner@cognitiveedge.clinic", "admin");
      const newEmail = `admin_api_user_${Date.now()}@patient.com`;
      const tempPass = "SecureAdminPass123!";

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: tempPass,
          clientName: "Eleanor Vance",
          role: "client",
        }),
      });

      const res = await adminUsersHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.spruceMessage).toContain("Welcome to Cognitive Edge Clinic");
      expect(data.spruceMessage).toContain(`Username: ${newEmail}`);
      expect(data.spruceMessage).toContain(`Temporary Password: ${tempPass}`);
      expect(data.spruceMessage).toContain("https://cognitive-wellness.netlify.app/vault");

      // Verify retrieval
      const member = await getMember(newEmail);
      expect(member).not.toBeNull();
      expect(member?.email).toBe(newEmail);
      expect(member?.clientName).toBe("Eleanor Vance");
    });

    test("rejects duplicate user creation with HTTP 409", async () => {
      const adminToken = createSessionToken("admin@cognitiveedge.clinic", "admin");
      const duplicateEmail = `duplicate_admin_${Date.now()}@patient.com`;

      await saveMember({
        email: duplicateEmail,
        salt: "testsalt",
        hash: "testhash",
        createdAt: new Date().toISOString(),
      });

      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `clinic_session=${adminToken}`,
        },
        body: JSON.stringify({
          email: duplicateEmail,
          password: "SecureAdminPass123!",
        }),
      });

      const res = await adminUsersHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });
  });
});
