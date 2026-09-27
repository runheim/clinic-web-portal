import React from "react";
import { renderToString } from "react-dom/server";
import { findUserByEmail, getUser, saveUser, UserRecord } from "@/lib/auth/userStore";
import { VaultInner } from "@/app/vault/page";

// Mock next/navigation for VaultInner SSR
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

describe("Unified Auth Store (Local Disk + Netlify Blobs) Suite", () => {
  beforeAll(() => {
    process.env.CLINIC_AUTH_SECRET = "test_auth_secret_clinical_edge_2026";
  });

  describe("findUserByEmail & getUser", () => {
    test("retrieves seeded demo standard user from local store", async () => {
      const user = await findUserByEmail("client.standard@cognitiveedgeclinic.com");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("client.standard@cognitiveedgeclinic.com");
      expect(user?.role).toBe("client");
      expect(user?.passwordHash).toBeDefined();
    });

    test("retrieves seeded demo VIP user from local store", async () => {
      const user = await getUser("vip.member@cognitiveedgeclinic.com");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("vip.member@cognitiveedgeclinic.com");
      expect(user?.role).toBe("client");
      expect(user?.clientName).toContain("VIP");
    });

    test("retrieves seeded admin user from local store", async () => {
      const user = await findUserByEmail("admin@cognitiveedgeclinic.com");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("admin@cognitiveedgeclinic.com");
      expect(user?.role).toBe("admin");
    });

    test("normalizes email with uppercase and leading/trailing whitespace", async () => {
      const user = await findUserByEmail("  CLIENT.STANDARD@COGNITIVEEDGECLINIC.COM  ");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("client.standard@cognitiveedgeclinic.com");
    });

    test("returns null cleanly for non-existent user without throwing", async () => {
      const user = await findUserByEmail("unknown_patient_999@doesnotexist.com");
      expect(user).toBeNull();
    });
  });

  describe("saveUser", () => {
    test("successfully writes and retrieves user record", async () => {
      const testEmail = `test_unified_${Date.now()}@patient.com`;
      const newRecord: UserRecord = {
        email: testEmail,
        passwordHash: "salt123:hash456",
        role: "client",
        clientName: "Test Patient",
        createdAt: new Date().toISOString(),
      };

      await saveUser(newRecord);

      const retrieved = await findUserByEmail(testEmail);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe(testEmail);
      expect(retrieved?.clientName).toBe("Test Patient");
      expect(retrieved?.passwordHash).toBe("salt123:hash456");
    });

    test("updates existing user record cleanly", async () => {
      const testEmail = `test_update_${Date.now()}@patient.com`;
      await saveUser({
        email: testEmail,
        passwordHash: "salt1:hash1",
        role: "client",
        clientName: "Before Update",
        createdAt: new Date().toISOString(),
      });

      await saveUser({
        email: testEmail,
        passwordHash: "salt2:hash2",
        role: "admin",
        clientName: "After Update",
        createdAt: new Date().toISOString(),
      });

      const updated = await findUserByEmail(testEmail);
      expect(updated).not.toBeNull();
      expect(updated?.clientName).toBe("After Update");
      expect(updated?.role).toBe("admin");
      expect(updated?.passwordHash).toBe("salt2:hash2");
    });
  });

  describe("Password Visibility Toggle in Vault Login Gate", () => {
    test("renders password visibility toggle button with accessible aria-label", () => {
      const html = renderToString(
        React.createElement(VaultInner, { initialAuthenticated: false })
      );

      expect(html).toContain('data-testid="toggle-password-visibility"');
      expect(html).toContain('aria-label="Show password"');
      expect(html).toContain('type="password"');
    });

    test("renders SVG eye icon within the toggle button", () => {
      const html = renderToString(
        React.createElement(VaultInner, { initialAuthenticated: false })
      );

      expect(html).toContain("<svg");
      expect(html).toContain('stroke="currentColor"');
      // Contains SVG path for eye icon
      expect(html).toContain("M2.036 12.322");
    });
  });
});
