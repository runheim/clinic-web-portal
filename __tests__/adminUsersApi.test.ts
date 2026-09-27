import { NextRequest } from "next/server";
import { POST as adminUsersPostHandler, GET as adminUsersGetHandler } from "@/app/api/admin/users/route";
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

  describe("Admin Users Provisioning Route (POST /api/admin/users)", () => {
    test("rejects unauthenticated requests with HTTP 401", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unauth@test.com", password: "Password123!" }),
      });

      const res = await adminUsersPostHandler(req);
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

      const res = await adminUsersPostHandler(req);
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

      const res = await adminUsersPostHandler(req);
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
          firstName: "Eleanor",
          lastName: "Vance",
          phone: "+1 (336) 555-0142",
          email: newEmail,
          password: tempPass,
          membershipTier: "Concierge VIP",
          role: "client",
        }),
      });

      const res = await adminUsersPostHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.firstName).toBe("Eleanor");
      expect(data.user.lastName).toBe("Vance");
      expect(data.user.phone).toBe("+1 (336) 555-0142");
      expect(data.user.membershipTier).toBe("Concierge VIP");
      expect(data.spruceMessage).toContain("Welcome to Cognitive Edge Clinic");
      expect(data.spruceMessage).toContain(`Username: ${newEmail}`);
      expect(data.spruceMessage).toContain(`Temporary Password: ${tempPass}`);
      expect(data.spruceMessage).toContain("https://cognitive-wellness.netlify.app/vault");

      // Verify retrieval
      const member = await getMember(newEmail);
      expect(member).not.toBeNull();
      expect(member?.email).toBe(newEmail);
      expect(member?.firstName).toBe("Eleanor");
      expect(member?.lastName).toBe("Vance");
      expect(member?.phone).toBe("+1 (336) 555-0142");
      expect(member?.membershipTier).toBe("Concierge VIP");
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

      const res = await adminUsersPostHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already exists");
    });
  });

  describe("Admin Users Directory Ledger Route (GET /api/admin/users)", () => {
    test("rejects unauthenticated GET requests with HTTP 401", async () => {
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "GET",
      });

      const res = await adminUsersGetHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authentication required");
    });

    test("rejects client session GET request with HTTP 403 Forbidden", async () => {
      const clientToken = createSessionToken("patient@cognitiveedgeclinic.com", "client");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "GET",
        headers: {
          Cookie: `clinic_session=${clientToken}`,
        },
      });

      const res = await adminUsersGetHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    test("returns structured account list for authenticated admin", async () => {
      const adminToken = createSessionToken("andreas.runheim@gmail.com", "admin");
      const req = new NextRequest("https://cognitiveedgeclinic.com/api/admin/users", {
        method: "GET",
        headers: {
          Cookie: `clinic_session=${adminToken}`,
        },
      });

      const res = await adminUsersGetHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.count).toBe("number");
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);

      // Verify structured columns exist on all accounts
      for (const user of data.users) {
        expect(user).toHaveProperty("lastName");
        expect(user).toHaveProperty("firstName");
        expect(user).toHaveProperty("phone");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("membershipTier");
        expect(user).toHaveProperty("createdAt");
        expect(user).toHaveProperty("role");

        // Zero-ePHI and credential isolation: ensure no passwordHash or salt is exposed
        expect(user.passwordHash).toBeUndefined();
        expect(user.salt).toBeUndefined();
        expect(user.hash).toBeUndefined();
      }

      // Check seed roster inclusion
      const runheimAccount = data.users.find(
        (u: { email: string }) => u.email === "andreas.runheim@gmail.com"
      );
      expect(runheimAccount).toBeDefined();
      expect(runheimAccount.lastName).toBe("Runheim");
      expect(runheimAccount.firstName).toContain("David");
      expect(runheimAccount.phone).toBe("+1 (743) 333-0880");
      expect(runheimAccount.membershipTier).toBe("Clinical Enclave Admin");
    });
  });
});
