import crypto from "crypto";
import { generateHmacSignature, verifyHmacSignature } from "@/lib/crypto/signatures";

describe("HMAC-SHA256 Cryptographic Signatures (src/lib/crypto/signatures)", () => {
  const secret = "super_secure_clinical_webhook_secret_key_2026";
  const payload = JSON.stringify({
    event: "BOOKING_CREATED",
    id: "booking_12345",
    timestamp: "2026-09-10T12:00:00.000Z",
  });

  describe("generateHmacSignature", () => {
    test("generates a 64-character lowercase hex digest", () => {
      const signature = generateHmacSignature(payload, secret);
      expect(signature).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(signature)).toBe(true);
    });

    test("matches Node.js native crypto HMAC-SHA256 digest output", () => {
      const expectedDigest = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      const signature = generateHmacSignature(payload, secret);
      expect(signature).toBe(expectedDigest);
    });

    test("produces distinct digests for distinct payloads or secrets", () => {
      const sig1 = generateHmacSignature(payload, secret);
      const sig2 = generateHmacSignature(payload + "_modified", secret);
      const sig3 = generateHmacSignature(payload, secret + "_modified");
      expect(sig1).not.toBe(sig2);
      expect(sig1).not.toBe(sig3);
      expect(sig2).not.toBe(sig3);
    });
  });

  describe("verifyHmacSignature", () => {
    test("returns true for a valid signature matching payload and secret", () => {
      const signature = generateHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload, signature, secret)).toBe(true);
    });

    test("returns false for a tampered payload", () => {
      const signature = generateHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload + "tampered", signature, secret)).toBe(false);
    });

    test("returns false for a forged/invalid signature", () => {
      const signature = "a".repeat(64);
      expect(verifyHmacSignature(payload, signature, secret)).toBe(false);
    });

    test("returns false for an incorrect secret", () => {
      const signature = generateHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload, signature, "wrong_secret_key")).toBe(false);
    });

    test("returns false when signature or secret is empty or missing", () => {
      const signature = generateHmacSignature(payload, secret);
      expect(verifyHmacSignature(payload, "", secret)).toBe(false);
      expect(verifyHmacSignature(payload, signature, "")).toBe(false);
      expect(verifyHmacSignature(payload, "", "")).toBe(false);
    });

    test("returns false when signature length does not match expected length without throwing", () => {
      expect(verifyHmacSignature(payload, "short_sig", secret)).toBe(false);
      expect(verifyHmacSignature(payload, "a".repeat(128), secret)).toBe(false);
    });
  });
});
