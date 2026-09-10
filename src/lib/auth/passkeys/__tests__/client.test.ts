/**
 * Unit Tests for Hardware-Attested WebAuthn / Passkey Client Gateway
 *
 * Verifies:
 * - Feature detection (isWebAuthnAvailable, isPlatformAuthenticatorAvailable)
 * - Pure client-side WebAuthn wrappers (registerPasskey, authenticateWithPasskey)
 * - Base64URL and ephemeral challenge utilities
 * - Error mapping and graceful error code translation
 * - Zero-ePHI architecture policy attestation
 */

import {
  isWebAuthnAvailable,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
  authenticateWithPasskey,
  bufferToBase64Url,
  base64UrlToBuffer,
  generateEphemeralChallenge,
  normalizeChallenge,
  ZERO_EPHI_AUTHENTICATION_POLICY,
} from "../client";

describe("WebAuthn Passkey Client Gateway", () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  afterEach(() => {
    // Restore globals
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
    delete (global as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;
  });

  describe("Base64URL & Challenge Utilities", () => {
    it("correctly encodes and decodes round-trip base64url data", () => {
      const sample = new Uint8Array([0, 1, 2, 250, 255, 64, 128, 192]);
      const base64Url = bufferToBase64Url(sample);
      expect(base64Url).not.toContain("+");
      expect(base64Url).not.toContain("/");
      expect(base64Url).not.toContain("=");

      const decoded = base64UrlToBuffer(base64Url);
      expect(Array.from(decoded)).toEqual(Array.from(sample));
    });

    it("generates 32 bytes (256 bits) of ephemeral entropy for challenges", () => {
      const challenge1 = generateEphemeralChallenge(32);
      const challenge2 = generateEphemeralChallenge(32);

      expect(challenge1.byteLength).toBe(32);
      expect(challenge2.byteLength).toBe(32);
      expect(challenge1).not.toEqual(challenge2);
    });

    it("normalizes challenges across string, buffer, and empty inputs", () => {
      const emptyNormalized = normalizeChallenge();
      expect(emptyNormalized.byteLength).toBe(32);

      const arrayBuffer = new Uint8Array([10, 20, 30]).buffer;
      const bufferNormalized = normalizeChallenge(arrayBuffer);
      expect(Array.from(bufferNormalized)).toEqual([10, 20, 30]);

      const uint8 = new Uint8Array([40, 50, 60]);
      const uint8Normalized = normalizeChallenge(uint8);
      expect(Array.from(uint8Normalized)).toEqual([40, 50, 60]);
    });
  });

  describe("Zero-ePHI Architecture Safeguards", () => {
    it("attests zero-ePHI isolation standards", () => {
      expect(ZERO_EPHI_AUTHENTICATION_POLICY.architecture).toContain("Zero-Knowledge");
      expect(ZERO_EPHI_AUTHENTICATION_POLICY.challengeEntropyBits).toBe(256);
      expect(ZERO_EPHI_AUTHENTICATION_POLICY.biometricTransmission).toBe(
        "STRICTLY_PROHIBITED_BY_HARDWARE_SPECIFICATION"
      );
    });
  });

  describe("Feature Detection", () => {
    it("returns false when window or navigator is unavailable", async () => {
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      });

      const webAuthn = await isWebAuthnAvailable();
      const platform = await isPlatformAuthenticatorAvailable();

      expect(webAuthn).toBe(false);
      expect(platform).toBe(false);
    });

    it("detects WebAuthn availability when credentials API is present", async () => {
      const mockCreate = jest.fn();
      const mockGet = jest.fn();

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: mockCreate,
              get: mockGet,
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = class {};

      const available = await isWebAuthnAvailable();
      expect(available).toBe(true);
    });

    it("detects platform authenticator support", async () => {
      const mockIsAvailable = jest.fn().mockResolvedValue(true);

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: jest.fn(),
              get: jest.fn(),
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: mockIsAvailable,
      };

      const platform = await isPlatformAuthenticatorAvailable();
      expect(platform).toBe(true);
      expect(mockIsAvailable).toHaveBeenCalledTimes(1);
    });
  });

  describe("Passkey Registration (navigator.credentials.create)", () => {
    it("successfully creates a passkey credential and formats results", async () => {
      const rawIdBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
      const clientDataJSONBuffer = new TextEncoder().encode(
        JSON.stringify({ type: "webauthn.create", challenge: "test-challenge", origin: "https://clinic.test" })
      ).buffer;
      const attestationObjectBuffer = new Uint8Array([5, 6, 7, 8]).buffer;

      const mockCredential = {
        id: "mock-cred-id-123",
        rawId: rawIdBuffer,
        authenticatorAttachment: "platform",
        response: {
          clientDataJSON: clientDataJSONBuffer,
          attestationObject: attestationObjectBuffer,
          getTransports: () => ["internal"],
        },
      };

      const mockCreate = jest.fn().mockResolvedValue(mockCredential);

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: mockCreate,
              get: jest.fn(),
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = class {};

      const result = await registerPasskey({
        userName: "vip@clinic.test",
        userDisplayName: "VIP Member",
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBe("mock-cred-id-123");
      expect(result.transports).toEqual(["internal"]);
      expect(result.clientDataParsed?.type).toBe("webauthn.create");
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("translates DOMException NotAllowedError into structured code", async () => {
      const domError = new DOMException("The operation was cancelled by the user.", "NotAllowedError");
      const mockCreate = jest.fn().mockRejectedValue(domError);

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: mockCreate,
              get: jest.fn(),
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = class {};

      const result = await registerPasskey();

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_ALLOWED");
      expect(result.error).toContain("cancelled by member");
    });
  });

  describe("Passkey Authentication (navigator.credentials.get)", () => {
    it("successfully authenticates and extracts signature", async () => {
      const rawIdBuffer = new Uint8Array([9, 8, 7]).buffer;
      const clientDataJSONBuffer = new TextEncoder().encode(
        JSON.stringify({ type: "webauthn.get", challenge: "auth-challenge", origin: "https://clinic.test" })
      ).buffer;
      const authDataBuffer = new Uint8Array([11, 12, 13]).buffer;
      const signatureBuffer = new Uint8Array([21, 22, 23]).buffer;

      const mockAssertion = {
        id: "mock-auth-cred-id",
        rawId: rawIdBuffer,
        response: {
          clientDataJSON: clientDataJSONBuffer,
          authenticatorData: authDataBuffer,
          signature: signatureBuffer,
          userHandle: null,
        },
      };

      const mockGet = jest.fn().mockResolvedValue(mockAssertion);

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: jest.fn(),
              get: mockGet,
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = class {};

      const result = await authenticateWithPasskey({
        challenge: "test-auth-challenge",
      });

      expect(result.success).toBe(true);
      expect(result.credentialId).toBe("mock-auth-cred-id");
      expect(result.clientDataParsed?.type).toBe("webauthn.get");
      expect(result.signature).toBeTruthy();
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("handles authenticator cancellation or timeout gracefully", async () => {
      const domError = new DOMException("User verification failed", "NotAllowedError");
      const mockGet = jest.fn().mockRejectedValue(domError);

      Object.defineProperty(global, "window", {
        value: {
          navigator: {
            credentials: {
              create: jest.fn(),
              get: mockGet,
            },
          },
          location: { hostname: "clinic.test" },
        },
        writable: true,
      });

      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = class {};

      const result = await authenticateWithPasskey();

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("NOT_ALLOWED");
      expect(result.error).toContain("cancelled by member");
    });
  });
});
