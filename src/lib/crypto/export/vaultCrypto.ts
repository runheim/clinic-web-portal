/**
 * =============================================================================
 * CLINICAL PROTOCOL & DOSSIER EXPORT VAULT CRYPTO ENGINE
 * Module: Zero-Knowledge In-Browser AES-GCM-256 Client-Side Encryption
 * 
 * Zero-Knowledge Architecture:
 * - Master passphrase and plaintext payload never leave the browser runtime.
 * - Zero network transmission of unencrypted clinical data or credentials.
 * - Zero server storage, zero database persistence, zero server disk writes.
 * 
 * Cryptographic Specifications:
 * - Cipher: AES-GCM-256 (authenticated symmetric encryption with 128-bit auth tag)
 * - Key Derivation: PBKDF2 (100,000 iterations of SHA-256)
 * - Cryptographic Salt: 16 bytes (128-bit CSPRNG salt per export)
 * - Initialization Vector (IV): 12 bytes (96-bit CSPRNG IV per export)
 * - Defense-in-depth MAC: HMAC-SHA256 integrity metadata calculated over envelope
 * - Envelope: Binary .edgevault container armored in standard RFC-style base64
 * =============================================================================
 */

export const VAULT_MAGIC = "EDGEVAUL"; // 8 ASCII bytes
export const VAULT_VERSION = 1; // uint8
export const PBKDF2_ITERATIONS = 100_000;
export const SALT_BYTE_LENGTH = 16; // 128-bit salt
export const IV_BYTE_LENGTH = 12; // 96-bit IV for AES-GCM
export const HMAC_BYTE_LENGTH = 32; // 256-bit HMAC-SHA256 signature
export const AES_KEY_BIT_LENGTH = 256;
export const GCM_TAG_BYTE_LENGTH = 16; // 128-bit authentication tag

export const ARMOR_HEADER = "-----BEGIN EDGEVAULT ENCRYPTED DOSSIER-----";
export const ARMOR_FOOTER = "-----END EDGEVAULT ENCRYPTED DOSSIER-----";

// Minimum binary length = MAGIC(8) + VER(1) + ITER(4) + SALT(16) + IV(12) + HMAC(32) + GCM_TAG(16) = 89 bytes
export const MIN_ENVELOPE_LENGTH =
  8 + 1 + 4 + SALT_BYTE_LENGTH + IV_BYTE_LENGTH + HMAC_BYTE_LENGTH + GCM_TAG_BYTE_LENGTH;

/**
 * Resolved Web Crypto implementation compatible with browsers and modern Node environments.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (subtle) is not supported in this runtime environment.");
}

/**
 * Cryptographically secure random byte generator.
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error("Cryptographically secure random number generator is not available.");
}

/**
 * Encodes a Uint8Array into a standard Base64 string without external dependencies.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
  }
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunking to avoid stack limits
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize) as unknown as number[]
    );
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string into a Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const sanitized = base64.replace(/\s+/g, "");
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(sanitized, "base64");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives both a 256-bit AES-GCM key and a 256-bit HMAC-SHA256 key from a passphrase
 * and salt using PBKDF2 (512 derived bits total).
 */
async function deriveVaultKeys(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<{ aesKey: CryptoKey; hmacKey: CryptoKey }> {
  if (!passphrase || typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Passphrase must be a non-empty string.");
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);

  // Import passphrase as PBKDF2 base key material
  const baseKey = await subtle.importKey(
    "raw",
    passphraseBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive 512 bits (64 bytes): first 32 bytes for AES-256, next 32 bytes for HMAC-SHA256
  const derivedBits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    512
  );

  const aesKeyBytes = derivedBits.slice(0, 32);
  const hmacKeyBytes = derivedBits.slice(32, 64);

  const aesKey = await subtle.importKey(
    "raw",
    aesKeyBytes,
    { name: "AES-GCM", length: AES_KEY_BIT_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  const hmacKey = await subtle.importKey(
    "raw",
    hmacKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  return { aesKey, hmacKey };
}

/**
 * Builds the authenticated metadata buffer for HMAC signing & verification.
 * Authenticates: MAGIC (8) + VERSION (1) + ITERATIONS (4) + SALT (16) + IV (12) + CIPHERTEXT (N)
 */
function buildHmacPayload(
  version: number,
  iterations: number,
  salt: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode(VAULT_MAGIC);

  const authData = new Uint8Array(8 + 1 + 4 + salt.length + iv.length + ciphertext.length);
  authData.set(magicBytes, 0);
  authData[8] = version;

  const view = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);
  view.setUint32(9, iterations, false); // Big-Endian

  authData.set(salt, 13);
  authData.set(iv, 13 + salt.length);
  authData.set(ciphertext, 13 + salt.length + iv.length);

  return authData;
}

/**
 * Packs all cryptographic envelope elements into a binary .edgevault container:
 * [0..8]   : MAGIC ("EDGEVAUL")
 * [8..9]   : VERSION (1)
 * [9..13]  : ITERATIONS (100,000)
 * [13..29] : SALT (16 bytes)
 * [29..41] : IV (12 bytes)
 * [41..73] : HMAC Signature (32 bytes)
 * [73..end]: CIPHERTEXT + GCM Auth Tag (N bytes)
 */
export function packVaultBinary(params: {
  version: number;
  iterations: number;
  salt: Uint8Array;
  iv: Uint8Array;
  hmac: Uint8Array;
  ciphertext: Uint8Array;
}): Uint8Array {
  const encoder = new TextEncoder();
  const magicBytes = encoder.encode(VAULT_MAGIC);
  const totalLength =
    8 + 1 + 4 + params.salt.length + params.iv.length + params.hmac.length + params.ciphertext.length;

  const envelope = new Uint8Array(totalLength);
  envelope.set(magicBytes, 0);
  envelope[8] = params.version;

  const view = new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength);
  view.setUint32(9, params.iterations, false);

  let offset = 13;
  envelope.set(params.salt, offset);
  offset += params.salt.length;

  envelope.set(params.iv, offset);
  offset += params.iv.length;

  envelope.set(params.hmac, offset);
  offset += params.hmac.length;

  envelope.set(params.ciphertext, offset);

  return envelope;
}

/**
 * Unpacks and validates header fields of a binary .edgevault container.
 */
export function unpackVaultBinary(envelope: Uint8Array): {
  version: number;
  iterations: number;
  salt: Uint8Array;
  iv: Uint8Array;
  hmac: Uint8Array;
  ciphertext: Uint8Array;
} {
  if (envelope.length < MIN_ENVELOPE_LENGTH) {
    throw new Error(
      `Invalid vault envelope: byte length (${envelope.length}) is shorter than minimum required (${MIN_ENVELOPE_LENGTH}).`
    );
  }

  const decoder = new TextDecoder();
  const magic = decoder.decode(envelope.subarray(0, 8));
  if (magic !== VAULT_MAGIC) {
    throw new Error(`Invalid vault envelope: unrecognized magic header '${magic}'.`);
  }

  const version = envelope[8];
  if (version !== VAULT_VERSION) {
    throw new Error(`Unsupported vault envelope version: ${version}. Expected ${VAULT_VERSION}.`);
  }

  const view = new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength);
  const iterations = view.getUint32(9, false);

  if (iterations < 10_000) {
    throw new Error(`Insecure vault envelope: PBKDF2 iterations (${iterations}) below minimum threshold.`);
  }

  let offset = 13;
  const salt = envelope.subarray(offset, offset + SALT_BYTE_LENGTH);
  offset += SALT_BYTE_LENGTH;

  const iv = envelope.subarray(offset, offset + IV_BYTE_LENGTH);
  offset += IV_BYTE_LENGTH;

  const hmac = envelope.subarray(offset, offset + HMAC_BYTE_LENGTH);
  offset += HMAC_BYTE_LENGTH;

  const ciphertext = envelope.subarray(offset);

  return { version, iterations, salt, iv, hmac, ciphertext };
}

/**
 * Encrypts arbitrary client data with AES-GCM-256 and PBKDF2 key derivation.
 * Returns an RFC-style armored base64 envelope string ready for saving as a .edgevault file.
 *
 * @param data - Any serializable JavaScript object, array, or primitive.
 * @param passphrase - The user master passphrase for key derivation.
 * @returns Armored base64 envelope string.
 */
export async function encryptVaultPayload(data: unknown, passphrase: string): Promise<string> {
  if (!passphrase || typeof passphrase !== "string" || passphrase.trim().length === 0) {
    throw new Error("Passphrase cannot be empty.");
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();

  // Serialize payload to UTF-8
  const serialized = JSON.stringify(data === undefined ? null : data);
  const plaintextBytes = encoder.encode(serialized);

  // Generate CSPRNG 128-bit salt and 96-bit IV
  const salt = getRandomBytes(SALT_BYTE_LENGTH);
  const iv = getRandomBytes(IV_BYTE_LENGTH);

  // Derive AES-GCM-256 and HMAC-SHA256 keys
  const { aesKey, hmacKey } = await deriveVaultKeys(passphrase, salt, PBKDF2_ITERATIONS);

  // Encrypt with AES-GCM-256 (includes appended 16-byte authentication tag)
  const ciphertextBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
    aesKey,
    plaintextBytes
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // Compute defense-in-depth HMAC-SHA256 signature across all metadata and ciphertext
  const hmacPayload = buildHmacPayload(VAULT_VERSION, PBKDF2_ITERATIONS, salt, iv, ciphertext);
  const hmacBuffer = await subtle.sign("HMAC", hmacKey, hmacPayload as unknown as BufferSource);
  const hmac = new Uint8Array(hmacBuffer);

  // Pack into structured binary container
  const binaryEnvelope = packVaultBinary({
    version: VAULT_VERSION,
    iterations: PBKDF2_ITERATIONS,
    salt,
    iv,
    hmac,
    ciphertext,
  });

  // Encode as armored base64 envelope
  const base64Content = bytesToBase64(binaryEnvelope);
  return `${ARMOR_HEADER}\n${base64Content}\n${ARMOR_FOOTER}`;
}

/**
 * Decrypts an armored .edgevault base64 envelope or raw binary base64 container.
 * Enforces constant-time HMAC verification before AES-GCM decryption to protect against tampering.
 *
 * @param armored - The armored base64 string or raw base64 envelope.
 * @param passphrase - The user master passphrase.
 * @returns The decrypted and parsed payload of type T.
 */
export async function decryptVaultPayload<T = unknown>(
  armored: string,
  passphrase: string
): Promise<T> {
  if (!passphrase || typeof passphrase !== "string" || passphrase.trim().length === 0) {
    throw new Error("Passphrase cannot be empty.");
  }

  if (!armored || typeof armored !== "string" || armored.trim().length === 0) {
    throw new Error("Armored vault envelope cannot be empty.");
  }

  // Strip armor headers/footers and whitespace
  const sanitized = armored
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  let envelopeBytes: Uint8Array;
  try {
    envelopeBytes = base64ToBytes(sanitized);
  } catch {
    throw new Error("Decryption failed: corrupted base64 encoding in vault envelope.");
  }

  // Unpack binary header
  const { version, iterations, salt, iv, hmac, ciphertext } = unpackVaultBinary(envelopeBytes);

  // Derive keys using envelope salt and iteration count
  const subtle = getSubtleCrypto();
  const { aesKey, hmacKey } = await deriveVaultKeys(passphrase, salt, iterations);

  // Verify defense-in-depth HMAC-SHA256 metadata
  const hmacPayload = buildHmacPayload(version, iterations, salt, iv, ciphertext);
  const isHmacValid = await subtle.verify(
    "HMAC",
    hmacKey,
    hmac as unknown as BufferSource,
    hmacPayload as unknown as BufferSource
  );

  if (!isHmacValid) {
    throw new Error(
      "Decryption failed: invalid passphrase or tampered vault envelope (HMAC verification failed)."
    );
  }

  // Decrypt with AES-GCM-256
  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as ArrayBuffer },
      aesKey,
      ciphertext as unknown as ArrayBuffer
    );
  } catch {
    throw new Error("Decryption failed: AES-GCM ciphertext integrity check failed.");
  }

  // Decode UTF-8 and parse JSON
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error("Decryption failed: decrypted payload is not valid JSON.");
  }
}
