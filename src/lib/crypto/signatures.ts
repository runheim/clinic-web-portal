import crypto from "crypto";

/**
 * Generates an HMAC-SHA256 hex digest for a payload string using a secret key.
 *
 * @param payload - The payload string to sign.
 * @param secret - The secret key used for generating the HMAC.
 * @returns 64-character hexadecimal signature digest.
 */
export function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifies an HMAC-SHA256 signature against a payload using constant-time comparison.
 *
 * @param payload - The original payload string.
 * @param signature - The signature to verify (hex digest).
 * @param secret - The secret key used for HMAC signing.
 * @returns True if the signature matches the calculated HMAC-SHA256 digest; false otherwise.
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expected = generateHmacSignature(payload, secret);
    const expectedBuffer = Buffer.from(expected, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
