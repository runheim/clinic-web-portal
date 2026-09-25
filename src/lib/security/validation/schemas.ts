/**
 * COGNITIVE EDGE CLINIC — SECURITY ENGINE
 * Strict Input Validation Schemas & Safe JSON Parser
 *
 * Implements:
 * - Strict Zod schemas for all client-facing and webhook endpoints
 * - Comprehensive prototype pollution detection and rejection
 * - Payload size enforcement (>64KB rejected with HTTP 413 Payload Too Large)
 * - Safe JSON parsing helper parseAndValidateJson returning sanitized HTTP 400/413 error responses
 * - Zero stack trace / internal exception leakage
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Maximum permitted payload size across public edge API routes: 64KB (65,536 bytes).
 */
export const MAX_PAYLOAD_BYTES = 64 * 1024; // 65,536 bytes

/**
 * Prohibited object keys that could lead to Prototype Pollution.
 */
export const PROHIBITED_PROPERTIES = ["__proto__", "constructor", "prototype"] as const;

const PROTOTYPE_POLLUTION_REGEX = /"__proto__"|"constructor"|"prototype"/i;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for authentication login requests.
 */
export const LoginSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(255),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema for member registration requests.
 */
export const RegisterSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(6).max(255),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema for clinical assessment submissions.
 */
export const AssessmentSchema = z
  .object({
    answers: z.record(z.string().max(100), z.union([z.number(), z.string().max(255)])),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AssessmentInput = z.infer<typeof AssessmentSchema>;

/**
 * Schema for inbound Cal.com webhook events.
 */
export const CalcomWebhookSchema = z
  .object({
    triggerEvent: z.string().max(100),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();

export type CalcomWebhookInput = z.infer<typeof CalcomWebhookSchema>;

/**
 * Schema for OpenGraph card image generation query parameters.
 */
export const OgQuerySchema = z
  .object({
    title: z.string().max(140).optional(),
    description: z.string().max(160).optional(),
    category: z.string().max(80).optional(),
    subtitle: z.string().max(160).optional(),
    sig: z.string().max(128).optional(),
  })
  .strict();

export type OgQueryInput = z.infer<typeof OgQuerySchema>;

/**
 * Schema for session token formatting validation (base64url payload . base64url signature).
 */
export const SessionTokenFormatSchema = z
  .string()
  .min(10)
  .max(1024)
  .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "Invalid session token format");

export type SessionTokenFormatInput = z.infer<typeof SessionTokenFormatSchema>;

/**
 * Schema for Bearer authorization header.
 */
export const BearerHeaderSchema = z
  .string()
  .regex(/^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i, "Invalid bearer token header format");

/**
 * Schema for session verification request payload.
 */
export const SessionRequestSchema = z
  .object({
    token: SessionTokenFormatSchema.optional(),
  })
  .strict();

export type SessionRequestInput = z.infer<typeof SessionRequestSchema>;

// ============================================================================
// Prototype Pollution Detection
// ============================================================================

/**
 * Recursively inspects an input to detect any prohibited prototype pollution property.
 * Returns the prohibited key name if found, or null if clean.
 */
export function detectPrototypePollution(data: unknown): string | null {
  if (data === null || typeof data !== "object") {
    return null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const detected = detectPrototypePollution(item);
      if (detected) return detected;
    }
    return null;
  }

  const ownProperties = Object.getOwnPropertyNames(data);
  for (const prop of ownProperties) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") {
      return prop;
    }
    try {
      const value = (data as Record<string, unknown>)[prop];
      if (value !== null && typeof value === "object") {
        const detected = detectPrototypePollution(value);
        if (detected) return detected;
      }
    } catch {
      // If property getter throws, treat as suspicious
      return prop;
    }
  }

  return null;
}

/**
 * Determines whether an input contains prototype pollution vectors.
 * Accepts strings (e.g. raw JSON or query strings) or objects.
 */
export function hasPrototypePollution(input: unknown): boolean {
  if (input === null || input === undefined) {
    return false;
  }

  if (typeof input === "string") {
    return PROTOTYPE_POLLUTION_REGEX.test(input);
  }

  if (typeof input === "object") {
    return detectPrototypePollution(input) !== null;
  }

  return false;
}

// ============================================================================
// Safe JSON Parsing & Validation
// ============================================================================

export interface ValidationErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export type ParseValidationResult<T> =
  | {
      success: true;
      data: T;
      errorResponse: null;
      error: null;
    }
  | {
      success: false;
      data: null;
      errorResponse: NextResponse<ValidationErrorResponse>;
      error: ValidationErrorResponse;
    };

/**
 * Sanitizes validation error message text, paths, and codes:
 * - HTML-encodes entity delimiters to prevent XSS reflection
 * - Strips non-printable ASCII control characters and null bytes
 * - Redacts stack traces, internal paths, and database query keywords
 */
export function sanitizeValidationText(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str
    .replace(/[<>&"']/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        case "'":
          return "&#x27;";
        default:
          return c;
      }
    })
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[a-zA-Z]:\\[^\s:]+:\d+:\d+/g, "[LOCAL_PATH]")
    .replace(/\/[^\s:]+:\d+:\d+/g, "[LOCAL_PATH]")
    .replace(/node:[^\s)]+/g, "[INTERNAL]")
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|FROM|WHERE|TABLE|pg_|sqlite)\b/gi, "[REDACTED]");
}

/**
 * Reads, verifies size, checks for prototype pollution, parses JSON safely,
 * and validates the request body against a strict Zod schema.
 *
 * Returns sanitized HTTP 400 / 413 responses with structured error codes
 * and zero internal stack traces or server file path leaks.
 *
 * @param req NextRequest instance
 * @param schema Zod schema to validate against
 * @param maxBytes Maximum payload size in bytes (defaults to 64KB)
 */
export async function parseAndValidateJson<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
  maxBytes: number = MAX_PAYLOAD_BYTES
): Promise<ParseValidationResult<T>> {
  // 1. Fast Content-Length pre-check
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (!Number.isNaN(length) && length > maxBytes) {
      const errorPayload: ValidationErrorResponse = {
        error: `Payload exceeds maximum allowed limit of ${Math.round(maxBytes / 1024)}KB.`,
        code: "PAYLOAD_TOO_LARGE",
      };
      return {
        success: false,
        data: null,
        error: errorPayload,
        errorResponse: NextResponse.json(errorPayload, {
          status: 413,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }),
      };
    }
  }

  // 2. Read raw text body safely
  let rawText: string;
  try {
    rawText = await req.text();
  } catch {
    const errorPayload: ValidationErrorResponse = {
      error: "Unable to read request payload.",
      code: "BODY_READ_ERROR",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  // 3. Verify actual UTF-8 byte length
  const actualByteLength =
    typeof Buffer !== "undefined"
      ? Buffer.byteLength(rawText, "utf8")
      : new TextEncoder().encode(rawText).byteLength;

  if (actualByteLength > maxBytes) {
    const errorPayload: ValidationErrorResponse = {
      error: `Payload exceeds maximum allowed limit of ${Math.round(maxBytes / 1024)}KB.`,
      code: "PAYLOAD_TOO_LARGE",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 413,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }),
    };
  }

  // 4. Reject empty body
  if (!rawText || rawText.trim().length === 0) {
    const errorPayload: ValidationErrorResponse = {
      error: "Invalid JSON payload.",
      code: "INVALID_JSON",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  // 5. Safe JSON parse with reviver for prototype pollution detection
  let pollutionKey: string | null = null;
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText, (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        pollutionKey = key;
      }
      return value;
    });
  } catch {
    if (pollutionKey) {
      const errorPayload: ValidationErrorResponse = {
        error: `Prototype pollution attempt rejected: prohibited property "${pollutionKey}".`,
        code: "PROTOTYPE_POLLUTION_DETECTED",
      };
      return {
        success: false,
        data: null,
        error: errorPayload,
        errorResponse: NextResponse.json(errorPayload, {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        }),
      };
    }
    const errorPayload: ValidationErrorResponse = {
      error: "Invalid JSON payload.",
      code: "INVALID_JSON",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  if (pollutionKey) {
    const errorPayload: ValidationErrorResponse = {
      error: `Prototype pollution attempt rejected: prohibited property "${pollutionKey}".`,
      code: "PROTOTYPE_POLLUTION_DETECTED",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  // 6. Deep recursive object check for prototype pollution
  const deepPollution = detectPrototypePollution(parsed);
  if (deepPollution) {
    const errorPayload: ValidationErrorResponse = {
      error: `Prototype pollution attempt rejected: prohibited property "${deepPollution}".`,
      code: "PROTOTYPE_POLLUTION_DETECTED",
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  // 7. Validate against Zod schema
  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    const formattedIssues = validation.error.issues.map((issue) => ({
      path: issue.path.map((p) => sanitizeValidationText(String(p))).join("."),
      message: sanitizeValidationText(issue.message),
      code: sanitizeValidationText(issue.code),
    }));

    const errorPayload: ValidationErrorResponse = {
      error: "Input validation failed.",
      code: "VALIDATION_ERROR",
      details: formattedIssues,
    };
    return {
      success: false,
      data: null,
      error: errorPayload,
      errorResponse: NextResponse.json(errorPayload, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }),
    };
  }

  return {
    success: true,
    data: validation.data,
    error: null,
    errorResponse: null,
  };
}
