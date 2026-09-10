import crypto from "crypto";

/**
 * Supported Subresource Integrity (SRI) cryptographic hashing algorithms.
 */
export type SriAlgorithm = "sha256" | "sha384" | "sha512";

/**
 * Immutable array of supported SRI algorithms.
 */
export const SUPPORTED_SRI_ALGORITHMS: readonly SriAlgorithm[] = Object.freeze([
  "sha256",
  "sha384",
  "sha512",
] as const);

/**
 * Locked remote script domains authorized to execute in the clinical portal.
 */
export const LOCKED_REMOTE_SCRIPT_DOMAINS: readonly string[] = Object.freeze([
  "https://app.cal.com",
  "https://js.stripe.com",
]);

/**
 * Locked connect-src domains authorized for outbound API and telemetry communication.
 */
export const LOCKED_CONNECT_DOMAINS: readonly string[] = Object.freeze([
  "https://api.sprucehealth.com",
  "https://api.stripe.com",
  "https://app.cal.com",
]);

/**
 * Locked frame-src domains authorized for embedded widgets and checkout modals.
 */
export const LOCKED_FRAME_DOMAINS: readonly string[] = Object.freeze([
  "https://app.cal.com",
  "https://js.stripe.com",
]);

/**
 * Configuration options for building dynamic Content-Security-Policy headers.
 */
export interface CspOptions {
  /** Additional script sources to authorize in script-src */
  additionalScriptDomains?: readonly string[];
  /** Additional connect sources to authorize in connect-src */
  additionalConnectDomains?: readonly string[];
  /** Additional frame sources to authorize in frame-src */
  additionalFrameDomains?: readonly string[];
  /** Additional image sources to authorize in img-src */
  additionalImgDomains?: readonly string[];
  /** Additional style sources to authorize in style-src */
  additionalStyleDomains?: readonly string[];
  /** Additional font sources to authorize in font-src */
  additionalFontDomains?: readonly string[];
  /** Additional media sources to authorize in media-src */
  additionalMediaDomains?: readonly string[];
  /** Custom directives to override or append */
  directives?: Record<string, string | readonly string[] | boolean | null | undefined>;
  /** Allow 'unsafe-eval' in script-src (typically for development/debugging) */
  allowEval?: boolean;
  /** Allow 'unsafe-inline' fallback in script-src for legacy browsers without CSP3 support */
  unsafeInlineFallback?: boolean;
  /** Report URI endpoint for CSP violation telemetry */
  reportUri?: string;
  /** Report-To endpoint group name */
  reportTo?: string;
  /** Enforce upgrade-insecure-requests directive */
  upgradeInsecureRequests?: boolean;
}

/**
 * Regular expression validating acceptable CSP nonce characters (standard Base64 / URL-safe Base64).
 * Prevents header/directive injection attacks through the nonce parameter.
 */
const NONCE_VALIDATION_REGEX = /^[A-Za-z0-9+/=_-]+$/;

/**
 * Generates a high-entropy 128-bit (16-byte) Base64 cryptographic nonce per request
 * for inline script and style execution authorization.
 *
 * @returns 24-character Base64-encoded nonce string.
 */
export function generateCspNonce(): string {
  return crypto.randomBytes(16).toString("base64");
}

/**
 * Constructs an immutable, strict Content-Security-Policy header string incorporating
 * `strict-dynamic`, `frame-ancestors 'none'`, and locked remote script domains.
 *
 * @param nonce - Cryptographic per-request nonce generated via `generateCspNonce()`.
 * @param options - Optional customizations for additional domains, report endpoints, or directive overrides.
 * @returns Serialized Content-Security-Policy header string.
 */
export function buildContentSecurityPolicy(
  nonce: string,
  options?: CspOptions
): string {
  if (!nonce || typeof nonce !== "string" || nonce.trim() === "") {
    throw new Error("Invalid CSP nonce: nonce must be a non-empty string.");
  }

  const trimmedNonce = nonce.trim();
  if (!NONCE_VALIDATION_REGEX.test(trimmedNonce)) {
    throw new Error("Invalid CSP nonce: nonce contains illegal characters.");
  }

  // Assemble script-src sources
  const scriptSources: string[] = [
    "'self'",
    `'nonce-${trimmedNonce}'`,
    "'strict-dynamic'",
    ...LOCKED_REMOTE_SCRIPT_DOMAINS,
  ];

  if (options?.unsafeInlineFallback) {
    scriptSources.push("'unsafe-inline'");
  }

  if (options?.allowEval) {
    scriptSources.push("'unsafe-eval'");
  }

  if (options?.additionalScriptDomains && options.additionalScriptDomains.length > 0) {
    for (const domain of options.additionalScriptDomains) {
      if (domain && !scriptSources.includes(domain)) {
        scriptSources.push(domain);
      }
    }
  }

  // Assemble connect-src sources
  const connectSources: string[] = ["'self'", ...LOCKED_CONNECT_DOMAINS];
  if (options?.additionalConnectDomains && options.additionalConnectDomains.length > 0) {
    for (const domain of options.additionalConnectDomains) {
      if (domain && !connectSources.includes(domain)) {
        connectSources.push(domain);
      }
    }
  }

  // Assemble frame-src sources
  const frameSources: string[] = ["'self'", ...LOCKED_FRAME_DOMAINS];
  if (options?.additionalFrameDomains && options.additionalFrameDomains.length > 0) {
    for (const domain of options.additionalFrameDomains) {
      if (domain && !frameSources.includes(domain)) {
        frameSources.push(domain);
      }
    }
  }

  // Assemble style-src sources
  const styleSources: string[] = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  if (options?.additionalStyleDomains && options.additionalStyleDomains.length > 0) {
    for (const domain of options.additionalStyleDomains) {
      if (domain && !styleSources.includes(domain)) {
        styleSources.push(domain);
      }
    }
  }

  // Assemble font-src sources
  const fontSources: string[] = ["'self'", "https://fonts.gstatic.com", "data:"];
  if (options?.additionalFontDomains && options.additionalFontDomains.length > 0) {
    for (const domain of options.additionalFontDomains) {
      if (domain && !fontSources.includes(domain)) {
        fontSources.push(domain);
      }
    }
  }

  // Assemble img-src sources
  const imgSources: string[] = ["'self'", "data:", "blob:", "https://images.unsplash.com"];
  if (options?.additionalImgDomains && options.additionalImgDomains.length > 0) {
    for (const domain of options.additionalImgDomains) {
      if (domain && !imgSources.includes(domain)) {
        imgSources.push(domain);
      }
    }
  }

  // Assemble media-src sources
  const mediaSources: string[] = [
    "'self'",
    "https://commondatastorage.googleapis.com",
    "blob:",
    "data:",
  ];
  if (options?.additionalMediaDomains && options.additionalMediaDomains.length > 0) {
    for (const domain of options.additionalMediaDomains) {
      if (domain && !mediaSources.includes(domain)) {
        mediaSources.push(domain);
      }
    }
  }

  // Base default directives
  const directivesMap = new Map<string, string | null>([
    ["default-src", "'self'"],
    ["script-src", scriptSources.join(" ")],
    ["style-src", styleSources.join(" ")],
    ["font-src", fontSources.join(" ")],
    ["img-src", imgSources.join(" ")],
    ["media-src", mediaSources.join(" ")],
    ["connect-src", connectSources.join(" ")],
    ["frame-src", frameSources.join(" ")],
    ["frame-ancestors", "'none'"],
    ["form-action", "'self' https://mycw*.eclinicalworks.com"],
    ["base-uri", "'self'"],
    ["object-src", "'none'"],
  ]);

  if (options?.upgradeInsecureRequests) {
    directivesMap.set("upgrade-insecure-requests", "");
  }

  if (options?.reportUri) {
    directivesMap.set("report-uri", options.reportUri.trim());
  }

  if (options?.reportTo) {
    directivesMap.set("report-to", options.reportTo.trim());
  }

  // Apply custom directive overrides if provided
  if (options?.directives) {
    for (const [key, val] of Object.entries(options.directives)) {
      if (val === false || val === null || val === undefined) {
        directivesMap.delete(key);
      } else if (val === true) {
        directivesMap.set(key, "");
      } else if (Array.isArray(val)) {
        directivesMap.set(key, val.join(" "));
      } else if (typeof val === "string") {
        directivesMap.set(key, val.trim());
      }
    }
  }

  const renderedDirectives: string[] = [];
  for (const [key, val] of directivesMap.entries()) {
    if (val === "") {
      renderedDirectives.push(`${key};`);
    } else if (val !== null) {
      renderedDirectives.push(`${key} ${val};`);
    }
  }

  return renderedDirectives.join(" ");
}

/**
 * Generates an SRI (Subresource Integrity) hash string for a script or stylesheet payload.
 *
 * @param content - String or Buffer content of the asset to hash.
 * @param algorithm - Cryptographic hash algorithm ('sha256', 'sha384', or 'sha512'). Defaults to 'sha384'.
 * @returns Formatted SRI digest string (e.g. `sha384-H8brO8xBuVQhNtf5v1Ke1QGVu6nFBUUswVKyzA0W...`).
 */
export function generateSriHash(
  content: string | Buffer,
  algorithm: SriAlgorithm = "sha384"
): string {
  if (
    content === null ||
    content === undefined ||
    (typeof content !== "string" && !Buffer.isBuffer(content))
  ) {
    throw new TypeError("Invalid content: content must be a string or Buffer.");
  }

  if (!SUPPORTED_SRI_ALGORITHMS.includes(algorithm)) {
    throw new Error(
      `Unsupported SRI algorithm: "${algorithm}". Supported algorithms are: ${SUPPORTED_SRI_ALGORITHMS.join(", ")}.`
    );
  }

  const hash = crypto.createHash(algorithm).update(content).digest("base64");
  return `${algorithm}-${hash}`;
}

/**
 * Verifies content against an SRI (Subresource Integrity) metadata string.
 * Supports multiple space-separated integrity expressions and conforms to the W3C SRI specification:
 * - Discards invalid or unrecognized tokens.
 * - Selects the strongest hash algorithm present (sha512 > sha384 > sha256).
 * - Matches using constant-time comparison (crypto.timingSafeEqual) against candidate hashes.
 *
 * @param content - The content string or Buffer to verify.
 * @param expectedIntegrity - The SRI integrity string (e.g. "sha256-... sha384-...").
 * @returns True if the content matches any hash for the strongest algorithm in expectedIntegrity; false otherwise.
 */
export function verifySri(
  content: string | Buffer,
  expectedIntegrity: string
): boolean {
  if (
    content === null ||
    content === undefined ||
    (typeof content !== "string" && !Buffer.isBuffer(content))
  ) {
    return false;
  }

  if (!expectedIntegrity || typeof expectedIntegrity !== "string") {
    return false;
  }

  const trimmed = expectedIntegrity.trim();
  if (trimmed === "") {
    return false;
  }

  // W3C SRI algorithm ranking: sha512 (3) > sha384 (2) > sha256 (1)
  const algorithmStrength: Record<SriAlgorithm, number> = {
    sha512: 3,
    sha384: 2,
    sha256: 1,
  };

  interface ParsedSriToken {
    algorithm: SriAlgorithm;
    digestBase64: string;
    strength: number;
  }

  const parsedTokens: ParsedSriToken[] = [];
  const rawTokens = trimmed.split(/\s+/);

  for (const token of rawTokens) {
    // SRI metadata token syntax: <algorithm>-<base64-digest>[?<options>]
    const match = token.match(/^(sha256|sha384|sha512)-([A-Za-z0-9+/=]+)(?:\?.*)?$/);
    if (match) {
      const algo = match[1] as SriAlgorithm;
      const digestBase64 = match[2];
      parsedTokens.push({
        algorithm: algo,
        digestBase64,
        strength: algorithmStrength[algo],
      });
    }
  }

  if (parsedTokens.length === 0) {
    return false;
  }

  // Find the highest algorithm strength among all recognized tokens
  const maxStrength = Math.max(...parsedTokens.map((t) => t.strength));
  const candidateTokens = parsedTokens.filter((t) => t.strength === maxStrength);

  // Group by algorithm (candidates all share the same highest algorithm strength)
  const targetAlgorithm = candidateTokens[0].algorithm;
  const computedDigestBuffer = crypto.createHash(targetAlgorithm).update(content).digest();

  for (const candidate of candidateTokens) {
    try {
      const expectedDigestBuffer = Buffer.from(candidate.digestBase64, "base64");
      if (
        expectedDigestBuffer.length === computedDigestBuffer.length &&
        crypto.timingSafeEqual(expectedDigestBuffer, computedDigestBuffer)
      ) {
        return true;
      }
    } catch {
      // Ignore token decoding failure and proceed to next candidate
      continue;
    }
  }

  return false;
}
