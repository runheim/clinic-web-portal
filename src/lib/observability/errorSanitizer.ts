/**
 * Zero-ePHI Error Sanitizer & Scrubbed Client Telemetry
 * Cognitive Edge Clinic — Architectural Telemetry Quarantine
 *
 * Enforces HIPAA Security Rule & Zero-ePHI compliance by deterministically
 * scrubbing URL query parameters, hash fragments, auth tokens, names,
 * emails, phone numbers, SSNs, credit cards, and numerical MRNs (6-10 digits)
 * before any telemetry is captured, logged, or dispatched.
 */

export interface SanitizedErrorEnvelope {
  correlationId: string;
  route: string;
  code: string;
  message: string;
  stackSignature: string;
  timestamp: string;
}

const REDACTED = "[REDACTED]";

/**
 * Deterministically generates a unique cryptographic or pseudo-random correlation ID.
 * Employs Web Crypto / Node crypto when available, with a deterministic fallback.
 */
function generateCorrelationId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `ENC-${globalThis.crypto.randomUUID()}`;
  }

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `ENC-${hex}`;
  }

  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `ENC-${time}-${rand}`;
}

/**
 * Aggressively sanitizes a route string, stripping URL query parameters and hash fragments.
 * Defaults to current window location pathname or "/" if omitted.
 */
export function cleanRoute(route?: string): string {
  if (route && typeof route === "string") {
    try {
      const parsed = new URL(route, "http://localhost");
      return parsed.pathname;
    } catch {
      return route.split("?")[0].split("#")[0] || "/";
    }
  }

  if (typeof window !== "undefined" && window.location) {
    try {
      return window.location.pathname || "/";
    } catch {
      return "/";
    }
  }

  return "/";
}

/**
 * Deterministically scrubs all forms of PII/ePHI from text:
 * - URL query parameters and hash fragments (from full URLs, relative paths, and standalone strings)
 * - Basic auth credentials in URLs
 * - Auth tokens, Bearer headers, JWTs, API keys, and session secrets
 * - Names (prefixed key-values, clinical honorifics, and explicit patient references)
 * - Email patterns
 * - Credit card numbers (formatted and unformatted 13-19 digits)
 * - Social Security Numbers (SSNs)
 * - Numerical strings resembling MRNs (6-10 digits) or unformatted phone numbers
 * - Formatted US and international phone numbers
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let scrubbed = text;

  // 1. Basic Auth credentials in URLs (e.g. https://user:password@domain.com)
  scrubbed = scrubbed.replace(/(https?:\/\/)([^:\s]+):([^@\s]+)@/gi, "$1[REDACTED]:[REDACTED]@");

  // 2. Query parameters and hash fragments in absolute URLs
  // e.g. https://clinic.com/patients?mrn=123456#record -> https://clinic.com/patients
  scrubbed = scrubbed.replace(
    /(https?:\/\/[^\s"'`<>?#]+)(?:\?[^\s"'`<>#]*)?(?:#[^\s"'`<>*]*)?/gi,
    "$1"
  );

  // 3. Query parameters and hash fragments in relative URL paths
  // e.g. /api/patients?token=secret123#frag -> /api/patients
  scrubbed = scrubbed.replace(
    /((?:\/[a-zA-Z0-9_.-]+)+)(?:\?[^\s"'`<>#]*)?(?:#[^\s"'`<>*]*)?/g,
    "$1"
  );

  // 4. Standalone URL query parameters and hash fragments
  scrubbed = scrubbed.replace(/\?[a-zA-Z0-9_.~!$&'()*+,;=:@%/-]+/g, REDACTED);
  scrubbed = scrubbed.replace(/#[a-zA-Z0-9_.~!$&'()*+,;=:@%/-]+/g, REDACTED);

  // 5. Auth headers and tokens (Bearer, Basic)
  scrubbed = scrubbed.replace(
    /\b(Authorization\s*:\s*)?Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    `$1Bearer ${REDACTED}`
  );
  scrubbed = scrubbed.replace(/\bBasic\s+[A-Za-z0-9+/=]{10,}/gi, `Basic ${REDACTED}`);

  // 6. Standalone JWTs (3 base64url segments separated by dots)
  scrubbed = scrubbed.replace(
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    REDACTED
  );

  // 7. Auth tokens, API keys, passwords, and secrets in key-value formats
  scrubbed = scrubbed.replace(
    /\b(api[_-]?key|access[_-]?token|auth(?:orization)?|session[_-]?id|token|secret|password|passwd|private[_-]?key)\s*([:=])\s*(?!Bearer\b)["']?([A-Za-z0-9\-._~+/]{6,})["']?/gi,
    `$1$2${REDACTED}`
  );

  // 8. Email patterns
  scrubbed = scrubbed.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    REDACTED
  );

  // 9. Credit Card numbers (16-digit standard, 15-digit Amex, or unformatted 13-16 digits)
  scrubbed = scrubbed.replace(/\b(?:\d{4}[ -]){3}\d{4}\b/g, REDACTED);
  scrubbed = scrubbed.replace(/\b3[47]\d{2}[ -]\d{6}[ -]\d{5}\b/g, REDACTED);
  scrubbed = scrubbed.replace(
    /\b(?:4\d{15}|5[1-5]\d{14}|6011\d{12}|65\d{14}|3[47]\d{13})\b/g,
    REDACTED
  );

  // 10. Social Security Numbers (SSNs)
  scrubbed = scrubbed.replace(/\b\d{3}[- ]\d{2}[- ]\d{4}\b/g, REDACTED);

  // 11. Formatted US and International Phone numbers
  scrubbed = scrubbed.replace(
    /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    REDACTED
  );
  scrubbed = scrubbed.replace(/\+(?:[0-9][-.\s]?){7,15}[0-9]\b/g, REDACTED);

  // 12. Explicit MRN / Patient ID prefixes with alphanumeric or numeric identifiers
  scrubbed = scrubbed.replace(
    /\b(mrn|patient[_-]?id|record[_-]?id|chart[_-]?number)\s*([:=])\s*["']?([A-Za-z0-9-]{4,15})["']?/gi,
    (_match, key: string, delim: string) => {
      return delim === ":" ? `${key}: ${REDACTED}` : `${key}${delim}${REDACTED}`;
    }
  );

  // 13. Numerical strings resembling MRNs (6-10 digits) or unformatted 10-digit phone numbers.
  // Preserves 3-digit HTTP status codes (e.g. 404, 500) and 4-digit calendar years (e.g. 2026).
  scrubbed = scrubbed.replace(/\b\d{6,10}\b/g, REDACTED);

  // 14. Names in key-value pairs (quoted or capitalized word sequences)
  // Quoted: patient_name="John Doe", candidate_name='Alice Smith'
  scrubbed = scrubbed.replace(
    /\b(patient[_-]?name|first[_-]?name|last[_-]?name|full[_-]?name|user[_-]?name|client[_-]?name|customer[_-]?name|candidate[_-]?name)\s*([:=])\s*["']([^"'\r\n]{2,40})["']/gi,
    `$1$2${REDACTED}`
  );
  // Unquoted capitalized words: patient_name: John Doe
  scrubbed = scrubbed.replace(
    /\b(patient[_-]?name|first[_-]?name|last[_-]?name|full[_-]?name|user[_-]?name|client[_-]?name|customer[_-]?name|candidate[_-]?name)\s*([:=])\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    `$1$2${REDACTED}`
  );

  // 15. Medical honorifics / clinical titles (e.g. Dr. John Smith, Doctor Foster, Mr. Wayne)
  scrubbed = scrubbed.replace(
    /\b(?:Dr\.|Doctor|Mr\.|Mrs\.|Ms\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
    REDACTED
  );

  // 16. Explicit "patient: John Doe"
  scrubbed = scrubbed.replace(
    /\b(patient)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
    `$1: ${REDACTED}`
  );

  return scrubbed;
}

/**
 * Sanitizes stack traces: scrubs PII, strips local operating system usernames
 * and directories (e.g. C:\Users\username or /Users/username), and normalizes references.
 */
function scrubStack(rawStack?: string): string {
  if (!rawStack || typeof rawStack !== "string") {
    return "NO_STACK";
  }

  let scrubbed = scrubPII(rawStack);

  // Strip Windows local user profile paths: C:\Users\<username>\...
  scrubbed = scrubbed.replace(/[a-zA-Z]:\\[Uu]sers\\[^\\]+\\/g, "[LOCAL_PATH]\\");

  // Strip POSIX local user profile paths: /Users/<username>/... or /home/<username>/...
  scrubbed = scrubbed.replace(/\/(?:Users|home)\/[^/]+\//g, "[LOCAL_PATH]/");

  // Strip webpack/sourcemap query parameters
  scrubbed = scrubbed.replace(
    /(https?:\/\/[^\s"'`<>?#]+)(?:\?[^\s"'`<>#]*)?(?:#[^\s"'`<>*]*)?/g,
    "$1"
  );

  return scrubbed;
}

/**
 * Sanitizes an unknown runtime error into an anonymized SanitizedErrorEnvelope.
 * Handles Error instances, Next.js digests, custom error objects, string throws,
 * null, undefined, and primitive values.
 */
export function sanitizeError(error: unknown, route?: string): SanitizedErrorEnvelope {
  const resolvedRoute = cleanRoute(route);
  const timestamp = new Date().toISOString();

  // Null exception
  if (error === null) {
    return {
      correlationId: generateCorrelationId(),
      route: resolvedRoute,
      code: "NULL_EXCEPTION",
      message: "Null exception intercepted",
      stackSignature: "NO_STACK",
      timestamp,
    };
  }

  // Undefined exception
  if (error === undefined) {
    return {
      correlationId: generateCorrelationId(),
      route: resolvedRoute,
      code: "UNDEFINED_EXCEPTION",
      message: "Undefined exception intercepted",
      stackSignature: "NO_STACK",
      timestamp,
    };
  }

  // Standard Error instance (or subclass)
  if (error instanceof Error) {
    const errorWithMeta = error as Error & {
      digest?: unknown;
      code?: unknown;
      status?: unknown;
    };

    const correlationId =
      typeof errorWithMeta.digest === "string" && errorWithMeta.digest.trim().length > 0
        ? errorWithMeta.digest
        : generateCorrelationId();

    const code =
      typeof errorWithMeta.code === "string"
        ? scrubPII(errorWithMeta.code)
        : typeof errorWithMeta.code === "number"
        ? `CODE_${errorWithMeta.code}`
        : typeof errorWithMeta.status === "number"
        ? `HTTP_${errorWithMeta.status}`
        : error.name || "Error";

    return {
      correlationId,
      route: resolvedRoute,
      code,
      message: scrubPII(error.message || "An unexpected error occurred"),
      stackSignature: scrubStack(error.stack),
      timestamp,
    };
  }

  // String error
  if (typeof error === "string") {
    return {
      correlationId: generateCorrelationId(),
      route: resolvedRoute,
      code: "STRING_ERROR",
      message: scrubPII(error),
      stackSignature: "NO_STACK",
      timestamp,
    };
  }

  // Plain objects and custom exception records
  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    const correlationId =
      typeof obj.digest === "string" && obj.digest.trim().length > 0
        ? obj.digest
        : typeof obj.correlationId === "string" && obj.correlationId.trim().length > 0
        ? obj.correlationId
        : generateCorrelationId();

    const code =
      typeof obj.code === "string"
        ? scrubPII(obj.code)
        : typeof obj.code === "number"
        ? `CODE_${obj.code}`
        : typeof obj.status === "number"
        ? `HTTP_${obj.status}`
        : typeof obj.name === "string"
        ? scrubPII(obj.name)
        : "CUSTOM_OBJECT_ERROR";

    let rawMessage = "Custom object exception";
    if (typeof obj.message === "string") {
      rawMessage = obj.message;
    } else if (typeof obj.error === "string") {
      rawMessage = obj.error;
    } else {
      try {
        rawMessage = JSON.stringify(error);
      } catch {
        rawMessage = "Unserializable custom object exception";
      }
    }

    const rawStack = typeof obj.stack === "string" ? obj.stack : undefined;

    return {
      correlationId,
      route: resolvedRoute,
      code,
      message: scrubPII(rawMessage),
      stackSignature: scrubStack(rawStack),
      timestamp,
    };
  }

  // Primitive fallbacks (number, boolean, symbol, bigint)
  return {
    correlationId: generateCorrelationId(),
    route: resolvedRoute,
    code: "PRIMITIVE_ERROR",
    message: scrubPII(String(error)),
    stackSignature: "NO_STACK",
    timestamp,
  };
}

/**
 * Captures a client error, sanitizes it under Zero-ePHI Quarantine,
 * logs it safely to console, dispatches a custom browser event if window is defined,
 * and returns the SanitizedErrorEnvelope.
 */
export function captureClientError(error: unknown, route?: string): SanitizedErrorEnvelope {
  const envelope = sanitizeError(error, route);

  // Safe client console logging under Zero-ePHI Quarantine
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(
      `[Zero-ePHI Telemetry Intercept] [${envelope.correlationId}] ${envelope.code}: ${envelope.message}`
    );
  }

  // Dispatch custom browser event if window is available
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      const event = new CustomEvent("zero-ephi-telemetry-error", { detail: envelope });
      window.dispatchEvent(event);
    } catch {
      // Gracefully handle restricted DOM environments
    }
  }

  return envelope;
}

/**
 * Attaches global error and unhandled promise rejection interceptors to the window object.
 * Also intercepts network failures in window.fetch if available.
 * Returns a cleanup function that detaches listeners and restores native fetch.
 */
export function initGlobalErrorInterceptor(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const errorHandler = (event: ErrorEvent) => {
    try {
      const errorToSanitize = event.error ?? event.message ?? "Unknown window error";
      captureClientError(
        errorToSanitize,
        window.location ? window.location.pathname : undefined
      );
    } catch {
      // Prevent recursive handler failures
    }
  };

  const rejectionHandler = (event: PromiseRejectionEvent) => {
    try {
      const reason = event.reason ?? "Unhandled promise rejection";
      captureClientError(
        reason,
        window.location ? window.location.pathname : undefined
      );
    } catch {
      // Prevent recursive handler failures
    }
  };

  window.addEventListener("error", errorHandler);
  window.addEventListener("unhandledrejection", rejectionHandler);

  let originalFetch: typeof window.fetch | undefined;
  if (typeof window.fetch === "function") {
    originalFetch = window.fetch;
    window.fetch = async function (...args: Parameters<typeof window.fetch>) {
      try {
        return await originalFetch!.apply(this, args);
      } catch (networkError) {
        try {
          captureClientError(
            networkError,
            window.location ? window.location.pathname : undefined
          );
        } catch {
          // Prevent telemetry interceptor from altering fetch exception
        }
        throw networkError;
      }
    };
  }

  return () => {
    window.removeEventListener("error", errorHandler);
    window.removeEventListener("unhandledrejection", rejectionHandler);
    if (originalFetch && window.fetch) {
      window.fetch = originalFetch;
    }
  };
}
