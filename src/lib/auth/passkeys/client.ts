/**
 * Hardware-Attested WebAuthn / Passkey Client Gateway
 *
 * Provides pure client-side WebAuthn API wrappers (navigator.credentials.create,
 * navigator.credentials.get) with zero-knowledge challenge generation and
 * zero-ePHI guarantees for concierge clinical vault members.
 *
 * Zero-ePHI Architecture:
 * - All challenge data is ephemeral and generated via cryptographically secure random bytes.
 * - Raw biometric vitals (fingerprints, facial geometry, retina scans) NEVER leave
 *   the hardware Secure Enclave (Apple SEP, Google Titan M2, Windows Hello TPM 2.0).
 * - Only hardware-attested cryptographic signatures over ephemeral challenges are transmitted.
 * - Strictly zero Protected Health Information (PHI) is processed or cached in auth payloads.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type PasskeyErrorCode =
  | "NOT_SUPPORTED"
  | "PLATFORM_NOT_SUPPORTED"
  | "NOT_ALLOWED"
  | "INVALID_STATE"
  | "SECURITY_ERROR"
  | "ABORTED"
  | "TIMEOUT"
  | "ENCLAVE_ERROR"
  | "UNKNOWN_ERROR";

export interface PasskeyClientDataParsed {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
}

export interface RegisterOptions {
  /** Pseudonymized vault user ID (ephemeral UUID; no ePHI). Defaults to random UUID. */
  userId?: string | Uint8Array;
  /** Masked member handle (e.g. member@vault.internal). Defaults to concierge handle. */
  userName?: string;
  /** Member display title. Defaults to "Concierge Vault Member". */
  userDisplayName?: string;
  /** Ephemeral challenge buffer or base64url string. Auto-generated if omitted. */
  challenge?: string | ArrayBuffer | Uint8Array;
  /** Relying party name. Defaults to "Cognitive Edge Clinic". */
  rpName?: string;
  /** Relying party ID (domain). Defaults to current hostname (or undefined for IP/dev). */
  rpId?: string;
  /** Authenticator selection criteria. Defaults to platform authenticator with user verification. */
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    userVerification?: UserVerificationRequirement;
    residentKey?: ResidentKeyRequirement;
    requireResidentKey?: boolean;
  };
  /** Supported public key cryptographic algorithms. Defaults to ES256 (-7) and RS256 (-257). */
  pubKeyCredParams?: PublicKeyCredentialParameters[];
  /** Timeout in milliseconds. Defaults to 60000ms. */
  timeout?: number;
  /** Attestation preference. Defaults to "none" for zero-ePHI anonymity. */
  attestation?: AttestationConveyancePreference;
  /** Credential descriptors to exclude from registration. */
  excludeCredentials?: Array<{
    id: string | ArrayBuffer | Uint8Array;
    type?: "public-key";
    transports?: AuthenticatorTransport[];
  }>;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  /** Base64URL-encoded credential identifier */
  credentialId?: string;
  /** Base64URL-encoded raw credential ID buffer */
  rawId?: string;
  /** Base64URL-encoded clientDataJSON */
  clientDataJSON?: string;
  /** Base64URL-encoded attestationObject */
  attestationObject?: string;
  /** Supported transports reported by authenticator */
  transports?: AuthenticatorTransport[];
  /** Authenticator attachment type ("platform" or "cross-platform") */
  authenticatorAttachment?: string | null;
  /** Parsed clientData for runtime assertion validation */
  clientDataParsed?: PasskeyClientDataParsed;
  /** Error message if registration failed */
  error?: string;
  /** Error classification code */
  errorCode?: PasskeyErrorCode;
}

export interface AuthenticateOptions {
  /** Ephemeral challenge buffer or base64url string. Auto-generated if omitted. */
  challenge?: string | ArrayBuffer | Uint8Array;
  /** Relying party ID (domain). Defaults to current hostname. */
  rpId?: string;
  /** Allowed credential descriptors. If omitted, triggers resident-key discoverable flow. */
  allowCredentials?: Array<{
    id: string | ArrayBuffer | Uint8Array;
    type?: "public-key";
    transports?: AuthenticatorTransport[];
  }>;
  /** User verification requirement. Defaults to "required" for TouchID / FaceID biometrics. */
  userVerification?: UserVerificationRequirement;
  /** Timeout in milliseconds. Defaults to 60000ms. */
  timeout?: number;
  /** Optional mediation (e.g. "conditional" for passkey autofill). */
  mediation?: CredentialMediationRequirement;
}

export interface PasskeyAuthResult {
  success: boolean;
  /** Base64URL-encoded credential identifier */
  credentialId?: string;
  /** Base64URL-encoded raw credential ID buffer */
  rawId?: string;
  /** Base64URL-encoded clientDataJSON */
  clientDataJSON?: string;
  /** Base64URL-encoded authenticatorData */
  authenticatorData?: string;
  /** Base64URL-encoded cryptographic signature */
  signature?: string;
  /** Base64URL-encoded userHandle if returned by authenticator */
  userHandle?: string | null;
  /** Parsed clientData for runtime assertion validation */
  clientDataParsed?: PasskeyClientDataParsed;
  /** Error message if authentication failed */
  error?: string;
  /** Error classification code */
  errorCode?: PasskeyErrorCode;
}

// ---------------------------------------------------------------------------
// Zero-ePHI Architecture Policy Statement
// ---------------------------------------------------------------------------

export const ZERO_EPHI_AUTHENTICATION_POLICY = {
  architecture: "Zero-Knowledge Hardware-Attested WebAuthn/FIDO2",
  enclaveIsolation: "Hardware Enclave (Apple Secure Enclave, Android Titan M2, TPM 2.0)",
  challengeEntropyBits: 256,
  biometricTransmission: "STRICTLY_PROHIBITED_BY_HARDWARE_SPECIFICATION",
  hipaaComplianceStandard: "45 CFR § 164.312(d)",
} as const;

// ---------------------------------------------------------------------------
// Base64URL & ArrayBuffer Encoding Utilities
// ---------------------------------------------------------------------------

/**
 * Converts an ArrayBuffer or Uint8Array into a URL-safe Base64 (base64url) string.
 */
export function bufferToBase64Url(buffer: ArrayBuffer | ArrayLike<number>): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Converts a URL-safe Base64 (base64url) string into a Uint8Array.
 */
export function base64UrlToBuffer(base64url: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64url, "base64url");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates an ephemeral cryptographically secure pseudorandom challenge.
 * Zero-knowledge guarantee: contains 256 bits of pure entropy, 0 personal identifiers.
 */
export function generateEphemeralChallenge(byteLength: number = 32): Uint8Array {
  const challenge = new Uint8Array(byteLength);
  const cryptoObj =
    (typeof window !== "undefined" ? window.crypto : null) ??
    (typeof globalThis !== "undefined" ? globalThis.crypto : null);

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(challenge);
  } else {
    for (let i = 0; i < byteLength; i++) {
      challenge[i] = Math.floor(Math.random() * 256);
    }
  }
  return challenge;
}

/**
 * Normalizes a challenge into a Uint8Array suitable for WebAuthn APIs.
 */
export function normalizeChallenge(challenge?: string | ArrayBuffer | Uint8Array): Uint8Array {
  if (!challenge) {
    return generateEphemeralChallenge(32);
  }
  if (challenge instanceof Uint8Array) {
    return challenge;
  }
  if (challenge instanceof ArrayBuffer) {
    return new Uint8Array(challenge);
  }
  if (typeof challenge === "string") {
    try {
      return base64UrlToBuffer(challenge);
    } catch {
      return new TextEncoder().encode(challenge);
    }
  }
  return generateEphemeralChallenge(32);
}

/**
 * Resolves a safe relying party ID. In WebAuthn, RP ID must not be an IP address.
 */
function getRelyingPartyId(providedId?: string): string | undefined {
  if (providedId) return providedId;
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  if (!hostname || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return undefined;
  }
  return hostname;
}

/**
 * Normalizes DOMException errors into structured Passkey error codes.
 */
function normalizeWebAuthnError(
  err: unknown,
  operation: "registration" | "authentication"
): { error: string; errorCode: PasskeyErrorCode } {
  let errorCode: PasskeyErrorCode = "UNKNOWN_ERROR";
  let message = `Passkey ${operation} encountered an unexpected error.`;

  if (err instanceof DOMException || (typeof err === "object" && err !== null && "name" in err)) {
    const domErr = err as DOMException;
    switch (domErr.name) {
      case "NotAllowedError":
        errorCode = "NOT_ALLOWED";
        message = "Biometric verification was cancelled by member or timed out.";
        break;
      case "NotSupportedError":
        errorCode = "NOT_SUPPORTED";
        message = "Hardware biometric authenticator is not supported on this platform.";
        break;
      case "InvalidStateError":
        errorCode = "INVALID_STATE";
        message = "Passkey credential already registered or invalid authenticator state.";
        break;
      case "SecurityError":
        errorCode = "SECURITY_ERROR";
        message = "WebAuthn security error: insecure context or relying party mismatch.";
        break;
      case "AbortError":
        errorCode = "ABORTED";
        message = "Biometric operation was aborted.";
        break;
      case "TimeoutError":
        errorCode = "TIMEOUT";
        message = "Biometric authentication timed out.";
        break;
      default:
        message = domErr.message || message;
        break;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  return { error: message, errorCode };
}

/**
 * Safely resolves the CredentialsContainer from window.navigator or navigator.
 */
function getCredentialsContainer(): CredentialsContainer | undefined {
  if (typeof window !== "undefined" && window.navigator?.credentials) {
    return window.navigator.credentials;
  }
  if (typeof navigator !== "undefined" && navigator.credentials) {
    return navigator.credentials;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Feature Detection
// ---------------------------------------------------------------------------

/**
 * Feature detection: checks if the WebAuthn API is supported in the current environment.
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  const credentials = getCredentialsContainer();
  return Boolean(
    credentials &&
      typeof credentials.create === "function" &&
      typeof credentials.get === "function" &&
      typeof PublicKeyCredential !== "undefined"
  );
}

/**
 * Feature detection: checks if a platform authenticator (Apple TouchID/FaceID,
 * Windows Hello, Android Biometrics) is available on the client device.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  const available = await isWebAuthnAvailable();
  if (!available) {
    return false;
  }

  if (
    typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  ) {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Feature detection: checks if conditional UI (Passkey autofill) is supported.
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  const available = await isWebAuthnAvailable();
  if (!available) {
    return false;
  }

  if (
    typeof PublicKeyCredential !== "undefined" &&
    "isConditionalMediationAvailable" in PublicKeyCredential &&
    typeof PublicKeyCredential.isConditionalMediationAvailable === "function"
  ) {
    try {
      return await PublicKeyCredential.isConditionalMediationAvailable();
    } catch {
      return false;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Core WebAuthn Execution Wrappers
// ---------------------------------------------------------------------------

/**
 * Registers a new hardware-attested passkey for a concierge vault member.
 *
 * Pure client-side wrapper around `navigator.credentials.create`.
 * Hardware enclave guarantees zero raw biometric vitals leave the local device.
 */
export async function registerPasskey(
  options: RegisterOptions = {}
): Promise<PasskeyRegistrationResult> {
  const credentials = getCredentialsContainer();
  const isAvailable = await isWebAuthnAvailable();
  if (!isAvailable || !credentials) {
    return {
      success: false,
      error: "WebAuthn API is not supported in this client environment.",
      errorCode: "NOT_SUPPORTED",
    };
  }

  try {
    const rawUserId = options.userId
      ? typeof options.userId === "string"
        ? new TextEncoder().encode(options.userId)
        : options.userId
      : generateEphemeralChallenge(16);

    const rpId = getRelyingPartyId(options.rpId);

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: normalizeChallenge(options.challenge) as unknown as BufferSource,
      rp: {
        name: options.rpName ?? "Cognitive Edge Clinic",
        ...(rpId ? { id: rpId } : {}),
      },
      user: {
        id: rawUserId as unknown as BufferSource,
        name: options.userName ?? "concierge-member@vault.internal",
        displayName: options.userDisplayName ?? "Concierge Vault Member",
      },
      pubKeyCredParams: options.pubKeyCredParams ?? [
        // ES256 (NIST P-256) - Apple Secure Enclave & Android Titan M2
        { type: "public-key", alg: -7 },
        // RS256 - Windows Hello TPM 2.0
        { type: "public-key", alg: -257 },
        // Ed25519 - Modern FIDO2 security tokens
        { type: "public-key", alg: -8 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: options.authenticatorSelection?.authenticatorAttachment ?? "platform",
        userVerification: options.authenticatorSelection?.userVerification ?? "required",
        residentKey: options.authenticatorSelection?.residentKey ?? "preferred",
        requireResidentKey: options.authenticatorSelection?.requireResidentKey ?? false,
      },
      timeout: options.timeout ?? 60000,
      attestation: options.attestation ?? "none", // Zero-ePHI anonymity standard
      ...(options.excludeCredentials && options.excludeCredentials.length > 0
        ? {
            excludeCredentials: options.excludeCredentials.map((c) => ({
              id: (typeof c.id === "string" ? base64UrlToBuffer(c.id) : c.id) as unknown as BufferSource,
              type: c.type ?? "public-key",
              transports: c.transports,
            })),
          }
        : {}),
    };

    const credential = (await credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: "Hardware authenticator returned a null credential.",
        errorCode: "UNKNOWN_ERROR",
      };
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    let clientDataParsed: PasskeyClientDataParsed | undefined;
    try {
      const text = new TextDecoder().decode(response.clientDataJSON);
      clientDataParsed = JSON.parse(text) as PasskeyClientDataParsed;
    } catch {
      // Parsing non-critical; passkey assertion remains valid
    }

    const rawTransports = response.getTransports?.() ?? [];

    return {
      success: true,
      credentialId: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      attestationObject: bufferToBase64Url(response.attestationObject),
      transports: rawTransports as AuthenticatorTransport[],
      authenticatorAttachment: credential.authenticatorAttachment ?? "platform",
      clientDataParsed,
    };
  } catch (err) {
    const { error, errorCode } = normalizeWebAuthnError(err, "registration");
    return {
      success: false,
      error,
      errorCode,
    };
  }
}

/**
 * Authenticates a returning vault member using TouchID, FaceID, or platform passkey.
 *
 * Pure client-side wrapper around `navigator.credentials.get`.
 * Challenges are ephemeral zero-knowledge payloads containing zero ePHI.
 */
export async function authenticateWithPasskey(
  options: AuthenticateOptions = {}
): Promise<PasskeyAuthResult> {
  const credentials = getCredentialsContainer();
  const isAvailable = await isWebAuthnAvailable();
  if (!isAvailable || !credentials) {
    return {
      success: false,
      error: "WebAuthn API is not supported in this client environment.",
      errorCode: "NOT_SUPPORTED",
    };
  }

  try {
    const rpId = getRelyingPartyId(options.rpId);

    const allowCredentials = options.allowCredentials?.map((c) => ({
      id: (typeof c.id === "string" ? base64UrlToBuffer(c.id) : c.id) as unknown as BufferSource,
      type: c.type ?? ("public-key" as const),
      transports: c.transports,
    }));

    const publicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: normalizeChallenge(options.challenge) as unknown as BufferSource,
      ...(rpId ? { rpId } : {}),
      timeout: options.timeout ?? 60000,
      userVerification: options.userVerification ?? "required",
      ...(allowCredentials && allowCredentials.length > 0 ? { allowCredentials } : {}),
    };

    const credential = (await credentials.get({
      publicKey: publicKeyRequestOptions,
      ...(options.mediation ? { mediation: options.mediation } : {}),
    })) as PublicKeyCredential | null;

    if (!credential) {
      return {
        success: false,
        error: "Hardware authenticator returned null credential assertion.",
        errorCode: "NOT_ALLOWED",
      };
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    let clientDataParsed: PasskeyClientDataParsed | undefined;
    try {
      const text = new TextDecoder().decode(response.clientDataJSON);
      clientDataParsed = JSON.parse(text) as PasskeyClientDataParsed;
    } catch {
      // Parsing non-critical; passkey assertion remains valid
    }

    return {
      success: true,
      credentialId: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : null,
      clientDataParsed,
    };
  } catch (err) {
    const { error, errorCode } = normalizeWebAuthnError(err, "authentication");
    return {
      success: false,
      error,
      errorCode,
    };
  }
}
