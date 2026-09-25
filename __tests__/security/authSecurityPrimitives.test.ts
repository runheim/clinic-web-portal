import crypto from "node:crypto";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/server";
import * as canvasRendererModule from "@/lib/og/canvasRenderer";
import {
  generateOgSignature,
  verifyOgSignature,
} from "@/lib/og/canvasRenderer";
import {
  generateHmacSignature,
  verifyHmacSignature,
} from "@/lib/crypto/signatures";

describe("Security Orchestration Pass: Auth & Fail-Closed Primitives", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("src/lib/auth/server.ts - Password Verification & Timing-Safe Comparison", () => {
    test("verifies valid password against generated hash and salt", () => {
      const password = "Cognitive#Edge@2026!Secure";
      const { salt, hash } = hashPassword(password);

      expect(verifyPassword(password, salt, hash)).toBe(true);
    });

    test("fails safely for incorrect password", () => {
      const { salt, hash } = hashPassword("CorrectPassword");
      expect(verifyPassword("WrongPassword", salt, hash)).toBe(false);
    });

    test("fails safely for empty or missing password, salt, or hash", () => {
      const { salt, hash } = hashPassword("SomePassword");
      expect(verifyPassword("", salt, hash)).toBe(false);
      expect(verifyPassword("SomePassword", "", hash)).toBe(false);
      expect(verifyPassword("SomePassword", salt, "")).toBe(false);
      // @ts-expect-error test undefined inputs
      expect(verifyPassword(undefined, salt, hash)).toBe(false);
    });

    test("enforces buffer length pre-check before timingSafeEqual (mismatched buffer lengths do not throw)", () => {
      const { salt } = hashPassword("SomePassword");
      // Truncated hash (shorter buffer)
      expect(verifyPassword("SomePassword", salt, "abcd")).toBe(false);
      // Oversized hash (longer buffer)
      expect(verifyPassword("SomePassword", salt, "a".repeat(256))).toBe(false);
      // Odd-length non-hex or corrupted string
      expect(verifyPassword("SomePassword", salt, "xyz123")).toBe(false);
    });
  });

  describe("src/lib/auth/server.ts - CLINIC_AUTH_SECRET Fail-Closed Primitives", () => {
    test("createSessionToken throws immediately when CLINIC_AUTH_SECRET is unconfigured", () => {
      delete process.env.CLINIC_AUTH_SECRET;
      expect(() => createSessionToken("physician@cognitiveedge.clinic")).toThrow(
        "CLINIC_AUTH_SECRET must be configured in environment."
      );
    });

    test("verifySessionToken returns null immediately when CLINIC_AUTH_SECRET is unconfigured", () => {
      delete process.env.CLINIC_AUTH_SECRET;
      // Even if given a syntactically valid token format
      const fakeToken = "eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.fakeSignature";
      expect(verifySessionToken(fakeToken)).toBeNull();
    });

    test("creates and verifies session token successfully when CLINIC_AUTH_SECRET is configured", () => {
      process.env.CLINIC_AUTH_SECRET = "production_clinical_auth_secret_key_884102";
      const email = "neurologist@cognitiveedge.clinic";

      const token = createSessionToken(email);
      expect(token).toContain(".");

      const session = verifySessionToken(token);
      expect(session).not.toBeNull();
      expect(session?.email).toBe(email);
    });

    test("verifySessionToken rejects tampered signature or token", () => {
      process.env.CLINIC_AUTH_SECRET = "production_clinical_auth_secret_key_884102";
      const email = "neurologist@cognitiveedge.clinic";
      const token = createSessionToken(email);

      const [payload, sig] = token.split(".");
      const tamperedPayload = Buffer.from(
        JSON.stringify({ email: "attacker@evil.com", exp: Date.now() + 100000 })
      ).toString("base64url");

      expect(verifySessionToken(`${tamperedPayload}.${sig}`)).toBeNull();
      expect(verifySessionToken(`${payload}.invalidsignature`)).toBeNull();
    });

    test("verifySessionToken validates buffer length before timingSafeEqual (different length signatures)", () => {
      process.env.CLINIC_AUTH_SECRET = "production_clinical_auth_secret_key_884102";
      const email = "neurologist@cognitiveedge.clinic";
      const token = createSessionToken(email);
      const [payload] = token.split(".");

      // Shorter signature
      expect(verifySessionToken(`${payload}.short`)).toBeNull();
      // Longer signature
      expect(verifySessionToken(`${payload}.${"a".repeat(128)}`)).toBeNull();
    });

    test("verifySessionToken rejects expired tokens", () => {
      process.env.CLINIC_AUTH_SECRET = "production_clinical_auth_secret_key_884102";
      const email = "expired@cognitiveedge.clinic";
      const expiredPayload = Buffer.from(
        JSON.stringify({ email, exp: Date.now() - 10000 })
      ).toString("base64url");
      const signature = crypto
        .createHmac("sha256", process.env.CLINIC_AUTH_SECRET)
        .update(expiredPayload)
        .digest("base64url");

      expect(verifySessionToken(`${expiredPayload}.${signature}`)).toBeNull();
    });
  });

  describe("src/lib/og/canvasRenderer.tsx - Fail-Closed & Absence of DEFAULT_OG_SECRET", () => {
    test("confirms DEFAULT_OG_SECRET is absent from canvasRenderer exports", () => {
      expect((canvasRendererModule as Record<string, unknown>)["DEFAULT_OG_SECRET"]).toBeUndefined();
    });

    test("generateOgSignature throws when no secret is configured in env or arguments", () => {
      delete process.env.OG_SIGNING_SECRET;
      delete process.env.AUTH_SECRET;

      expect(() => generateOgSignature("Autonomic Vitality Protocol")).toThrow(
        "OG signing secret must be configured in environment."
      );
    });

    test("verifyOgSignature returns false (fails closed) when no secret is configured", () => {
      delete process.env.OG_SIGNING_SECRET;
      delete process.env.AUTH_SECRET;

      const title = "Autonomic Vitality Protocol";
      // Even if a valid-looking 64-char hex signature is passed
      const dummySig = "0".repeat(64);
      expect(verifyOgSignature(title, dummySig)).toBe(false);
    });

    test("generateOgSignature and verifyOgSignature work when secret is provided", () => {
      const secret = "dedicated_og_signing_key_secure_2026";
      const title = "Transcranial Photobiomodulation";

      const signature = generateOgSignature(title, secret);
      expect(signature).toHaveLength(64);
      expect(verifyOgSignature(title, signature, secret)).toBe(true);

      // Fails for tampered title
      expect(verifyOgSignature("Tampered Title", signature, secret)).toBe(false);
      // Fails for mismatched length
      expect(verifyOgSignature(title, "short_sig", secret)).toBe(false);
    });

    test("generateOgSignature reads from OG_SIGNING_SECRET env var", () => {
      process.env.OG_SIGNING_SECRET = "env_og_signing_key_4455";
      const title = "Ketogenic Neuro-Resuscitation";

      const signature = generateOgSignature(title);
      expect(signature).toHaveLength(64);
      expect(verifyOgSignature(title, signature)).toBe(true);
    });
  });

  describe("src/lib/crypto/signatures.ts - Timing-Safe HMAC Verification", () => {
    test("verifies valid HMAC signature", () => {
      const secret = "crypto_test_secret_998877";
      const payload = "patient-intake-event-2026";
      const sig = generateHmacSignature(payload, secret);

      expect(verifyHmacSignature(payload, sig, secret)).toBe(true);
    });

    test("rejects invalid signature or mismatched length safely", () => {
      const secret = "crypto_test_secret_998877";
      const payload = "patient-intake-event-2026";
      const sig = generateHmacSignature(payload, secret);

      expect(verifyHmacSignature(payload, sig + "x", secret)).toBe(false);
      expect(verifyHmacSignature(payload, sig.slice(0, 10), secret)).toBe(false);
      expect(verifyHmacSignature(payload, "invalid_sig", secret)).toBe(false);
      expect(verifyHmacSignature(payload, "", secret)).toBe(false);
      expect(verifyHmacSignature(payload, sig, "")).toBe(false);
    });
  });
});
