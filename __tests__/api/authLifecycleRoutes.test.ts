import { NextRequest } from "next/server";
import { POST as changePasswordHandler } from "@/app/api/auth/change-password/route";
import { POST as forgotPasswordHandler } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "@/app/api/auth/reset-password/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { createSessionToken, hashPassword, verifyPassword } from "@/lib/auth/server";
import { saveUser, findUserByEmail } from "@/lib/auth/userStore";
import { resetRateLimits } from "@/lib/security/ratelimit/tokenBucket";

describe("Auth Lifecycle Routes Suite (change-password, forgot-password, reset-password, logout)", () => {
  beforeEach(() => {
    resetRateLimits();
    process.env.CLINIC_AUTH_SECRET = "production_secure_clinical_auth_secret_key_9944";
  });

  afterAll(() => {
    resetRateLimits();
  });

  const createJsonRequest = (
    url: string,
    body: object | string | null,
    cookie?: string,
    ip: string = "198.51.100.201"
  ): NextRequest => {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("x-forwarded-for", ip);
    if (cookie) {
      headers.set("Cookie", `clinic_session=${cookie}`);
    }
    const rawBody = body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
    return new NextRequest(url, {
      method: "POST",
      headers,
      body: rawBody,
    });
  };

  // =========================================================================
  // 1. POST /api/auth/change-password
  // =========================================================================
  describe("1. POST /api/auth/change-password", () => {
    test("rejects unauthenticated request with HTTP 401", async () => {
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/change-password", {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      });

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Authentication required");
    });

    test("rejects invalid or malformed session token with HTTP 401", async () => {
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/change-password",
        {
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword123!",
        },
        "invalid.token.structure"
      );

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid or expired session");
    });

    test("rejects missing current password with HTTP 400", async () => {
      const token = createSessionToken("client.standard@cognitiveedgeclinic.com", "client");
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/change-password",
        { newPassword: "NewPassword123!" },
        token
      );

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Current password is required");
    });

    test("rejects new password shorter than 8 characters with HTTP 400", async () => {
      const token = createSessionToken("client.standard@cognitiveedgeclinic.com", "client");
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/change-password",
        { currentPassword: "OldPassword123!", newPassword: "short" },
        token
      );

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("at least 8 characters");
    });

    test("rejects incorrect current password with HTTP 401", async () => {
      const testEmail = `chg_pass_user_${Date.now()}@patient.com`;
      const { salt, hash } = hashPassword("CorrectOldPassword123!");
      await saveUser({
        email: testEmail,
        salt,
        hash,
        role: "client",
        createdAt: new Date().toISOString(),
      });

      const token = createSessionToken(testEmail, "client");
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/change-password",
        { currentPassword: "WrongPassword999!", newPassword: "BrandNewPassword123!" },
        token
      );

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Current password does not match");
    });

    test("successfully updates password with valid current password", async () => {
      const testEmail = `chg_success_${Date.now()}@patient.com`;
      const oldPass = "ValidInitialPassword123!";
      const newPass = "SuperSecureNewPassword2026!";
      const { salt, hash } = hashPassword(oldPass);
      await saveUser({
        email: testEmail,
        salt,
        hash,
        role: "client",
        createdAt: new Date().toISOString(),
      });

      const token = createSessionToken(testEmail, "client");
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/change-password",
        { currentPassword: oldPass, newPassword: newPass },
        token
      );

      const res = await changePasswordHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify that user record reflects the new password
      const updatedUser = await findUserByEmail(testEmail);
      expect(updatedUser).not.toBeNull();
      expect(verifyPassword(newPass, updatedUser!.salt!, updatedUser!.hash!)).toBe(true);
      expect(verifyPassword(oldPass, updatedUser!.salt!, updatedUser!.hash!)).toBe(false);
    });
  });

  // =========================================================================
  // 2. POST /api/auth/forgot-password
  // =========================================================================
  describe("2. POST /api/auth/forgot-password", () => {
    test("rejects invalid or missing email with HTTP 400", async () => {
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/forgot-password",
        { email: "not-an-email" }
      );

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("valid email");
    });

    test("returns uniform HTTP 200 success for non-existent user (enumeration prevention)", async () => {
      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/forgot-password",
        { email: "nobody_exists_here_9944@domain.com" }
      );

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("If an account exists");
    });

    test("generates and attaches reset token for existing user", async () => {
      const testEmail = `forgot_target_${Date.now()}@patient.com`;
      const { salt, hash } = hashPassword("TestPassword123!");
      await saveUser({
        email: testEmail,
        salt,
        hash,
        role: "client",
        createdAt: new Date().toISOString(),
      });

      const req = createJsonRequest(
        "https://cognitiveedgeclinic.com/api/auth/forgot-password",
        { email: testEmail }
      );

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const user = await findUserByEmail(testEmail);
      expect(user).not.toBeNull();
      expect(user?.resetToken).toBeDefined();
      expect(typeof user?.resetToken).toBe("string");
      expect(user?.resetTokenExpiry).toBeGreaterThan(Date.now());
    });
  });

  // =========================================================================
  // 3. POST /api/auth/reset-password
  // =========================================================================
  describe("3. POST /api/auth/reset-password", () => {
    test("rejects missing token with HTTP 400", async () => {
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/reset-password", {
        password: "NewPassword123!",
      });

      const res = await resetPasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("authorization reset token is required");
    });

    test("rejects password shorter than 8 characters with HTTP 400", async () => {
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/reset-password", {
        token: "some_valid_looking_token",
        password: "short",
      });

      const res = await resetPasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("at least 8 characters");
    });

    test("rejects non-existent or expired reset token with HTTP 400", async () => {
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/reset-password", {
        token: "completely_unrecognized_token_12345",
        password: "ValidNewPassword123!",
      });

      const res = await resetPasswordHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid or expired password reset token");
    });

    test("resets password, updates hash, and clears token for valid token", async () => {
      const testEmail = `reset_flow_${Date.now()}@patient.com`;
      const resetToken = `rtok_${Date.now()}_secret`;
      const { salt, hash } = hashPassword("OldPassword123!");
      await saveUser({
        email: testEmail,
        salt,
        hash,
        role: "client",
        resetToken,
        resetTokenExpiry: Date.now() + 1000 * 60 * 60, // 1 hour valid
        createdAt: new Date().toISOString(),
      });

      const newPass = "NewlyResetPassword2026!";
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/reset-password", {
        token: resetToken,
        password: newPass,
      });

      const res = await resetPasswordHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const user = await findUserByEmail(testEmail);
      expect(user).not.toBeNull();
      expect(user?.resetToken).toBeNull();
      expect(user?.resetTokenExpiry).toBeNull();
      expect(verifyPassword(newPass, user!.salt!, user!.hash!)).toBe(true);
    });
  });

  // =========================================================================
  // 4. POST /api/auth/logout
  // =========================================================================
  describe("4. POST /api/auth/logout", () => {
    test("clears clinic_session cookie and returns HTTP 200 with rate limit headers", async () => {
      const req = createJsonRequest("https://cognitiveedgeclinic.com/api/auth/logout", {});

      const res = await logoutHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify cookie is instructed to be deleted / expired
      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("clinic_session=");
      expect(res.headers.get("x-ratelimit-limit")).toBeDefined();
    });
  });
});
