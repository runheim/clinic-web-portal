import {
  scrubPII,
  sanitizeError,
  captureClientError,
  initGlobalErrorInterceptor,
  cleanRoute,
  SanitizedErrorEnvelope,
} from "@/lib/observability/errorSanitizer";

describe("Zero-ePHI Error Sanitizer & Scrubbed Client Telemetry", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("scrubPII - Deterministic Scrubbing Engine", () => {
    it("strips email addresses in diverse formats and casings", () => {
      const input =
        "Failed to dispatch report to patient.doe+oncology@clinic-sub.org and DR.SMITH@HOSPITAL.COM";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("patient.doe+oncology@clinic-sub.org");
      expect(scrubbed).not.toContain("DR.SMITH@HOSPITAL.COM");
      expect(scrubbed).toBe(
        "Failed to dispatch report to [REDACTED] and [REDACTED]"
      );
    });

    it("strips formatted and unformatted phone numbers", () => {
      const input =
        "Candidate contact numbers: (555) 123-4567, 555-867-5309, 555.999.8888, +1 (555) 444-3333, and +44 20 7123 4567";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("(555) 123-4567");
      expect(scrubbed).not.toContain("555-867-5309");
      expect(scrubbed).not.toContain("555.999.8888");
      expect(scrubbed).not.toContain("+1 (555) 444-3333");
      expect(scrubbed).not.toContain("+44 20 7123 4567");
      expect(scrubbed).toBe(
        "Candidate contact numbers: [REDACTED], [REDACTED], [REDACTED], [REDACTED], and [REDACTED]"
      );
    });

    it("strips Social Security Numbers (SSNs)", () => {
      const input = "Validation failed for SSN 000-12-3456 and SSN 987 65 4321";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("000-12-3456");
      expect(scrubbed).not.toContain("987 65 4321");
      expect(scrubbed).toBe("Validation failed for SSN [REDACTED] and SSN [REDACTED]");
    });

    it("strips numerical strings resembling MRNs (6-10 digits) and prefixed MRNs", () => {
      const input =
        "Records inspected: MRN: 882194, patient_id=9821457, and chart_number: 1234567890. Raw MRN 7654321.";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("882194");
      expect(scrubbed).not.toContain("9821457");
      expect(scrubbed).not.toContain("1234567890");
      expect(scrubbed).not.toContain("7654321");
      expect(scrubbed).toBe(
        "Records inspected: MRN: [REDACTED], patient_id=[REDACTED], and chart_number: [REDACTED]. Raw MRN [REDACTED]."
      );
    });

    it("preserves non-ePHI numbers such as HTTP status codes, years, and small numbers", () => {
      const input = "HTTP 404 Not Found at 2026-09-10T04:00:00Z with retry count 3";
      const scrubbed = scrubPII(input);

      expect(scrubbed).toContain("404");
      expect(scrubbed).toContain("2026");
      expect(scrubbed).toContain("3");
    });

    it("strips auth tokens, Bearer tokens, JWTs, and API keys", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const input = `Authorization: Bearer ${jwt}, apiKey=whsec_99887766554433, secret: 'topsecretkey123', password: pass12345`;
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain(jwt);
      expect(scrubbed).not.toContain("whsec_99887766554433");
      expect(scrubbed).not.toContain("topsecretkey123");
      expect(scrubbed).not.toContain("pass12345");
      expect(scrubbed).toContain("Authorization: Bearer [REDACTED]");
      expect(scrubbed).toContain("apiKey=[REDACTED]");
      expect(scrubbed).toContain("secret:[REDACTED]");
      expect(scrubbed).toContain("password:[REDACTED]");
    });

    it("strips URL query parameters and hash fragments from absolute and relative URLs", () => {
      const input =
        "Failed fetch to https://portal.clinic.com/patients?mrn=12345678&token=bearer99#clinical-notes and /api/v1/intake?patientId=987654#review";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("?mrn=12345678");
      expect(scrubbed).not.toContain("&token=bearer99");
      expect(scrubbed).not.toContain("#clinical-notes");
      expect(scrubbed).not.toContain("?patientId=987654");
      expect(scrubbed).not.toContain("#review");
      expect(scrubbed).toBe(
        "Failed fetch to https://portal.clinic.com/patients and /api/v1/intake"
      );
    });

    it("strips standalone query parameters and hash fragments", () => {
      const input = "Query failed with ?token=xyz123&code=456 and hash #access_token=secret";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("xyz123");
      expect(scrubbed).not.toContain("access_token=secret");
      expect(scrubbed).toBe(
        "Query failed with [REDACTED] and hash [REDACTED]"
      );
    });

    it("strips credit card numbers in standard, spaced, and dashed formats", () => {
      const input =
        "Card charges: 4111 2222 3333 4444, 4111-2222-3333-5555, and 3782 822463 10005";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("4111");
      expect(scrubbed).not.toContain("3782");
      expect(scrubbed).toBe(
        "Card charges: [REDACTED], [REDACTED], and [REDACTED]"
      );
    });

    it("strips patient names, candidate names, and medical honorifics", () => {
      const input =
        "Reviewing patient_name: John Doe with candidate_name='Alice Smith' by Dr. Gregory House and Doctor Jane Foster";
      const scrubbed = scrubPII(input);

      expect(scrubbed).not.toContain("John Doe");
      expect(scrubbed).not.toContain("Alice Smith");
      expect(scrubbed).not.toContain("Dr. Gregory House");
      expect(scrubbed).not.toContain("Doctor Jane Foster");
      expect(scrubbed).toBe(
        "Reviewing patient_name:[REDACTED] with candidate_name=[REDACTED] by [REDACTED] and [REDACTED]"
      );
    });

    it("is strictly idempotent", () => {
      const input =
        "Error for patient_name: Alice Bob at alice@example.com with phone (555) 123-4567 and url https://clinic.com/path?param=123#hash";
      const firstPass = scrubPII(input);
      const secondPass = scrubPII(firstPass);
      const thirdPass = scrubPII(secondPass);

      expect(firstPass).toBe(secondPass);
      expect(secondPass).toBe(thirdPass);
    });

    it("handles null, undefined, empty string, and non-string inputs safely", () => {
      expect(scrubPII("")).toBe("");
      expect(scrubPII(null as unknown as string)).toBe("");
      expect(scrubPII(undefined as unknown as string)).toBe("");
      expect(scrubPII(12345 as unknown as string)).toBe("");
    });
  });

  describe("cleanRoute - Route Sanitizer", () => {
    it("strips query parameters and hash fragments from route strings", () => {
      expect(cleanRoute("/assessment?patient=123456&step=2#section")).toBe("/assessment");
      expect(cleanRoute("https://clinic.com/vip-portal?token=abc#overview")).toBe("/vip-portal");
      expect(cleanRoute("/ledger#diagnostics")).toBe("/ledger");
    });

    it("defaults to / when route is empty or omitted", () => {
      expect(cleanRoute("")).toBe("/");
      expect(cleanRoute(undefined)).toBe("/");
    });
  });

  describe("sanitizeError - Anonymized Envelope Generator", () => {
    it("returns expected envelope structure with required properties", () => {
      const error = new Error("Network timeout while querying service");
      const envelope = sanitizeError(error, "/ledger");

      expect(envelope).toMatchObject<SanitizedErrorEnvelope>({
        correlationId: expect.any(String),
        route: "/ledger",
        code: "Error",
        message: "Network timeout while querying service",
        stackSignature: expect.any(String),
        timestamp: expect.any(String),
      });

      expect(envelope.correlationId).toMatch(/^ENC-[A-Za-z0-9-]+$/);
      expect(new Date(envelope.timestamp).toISOString()).toBe(envelope.timestamp);
      expect(envelope.stackSignature).not.toBe("NO_STACK");
    });

    it("scrubs PII from Error message and stack traces", () => {
      const error = new Error(
        "Failed to load patient record for user.test@clinic.org with SSN 000-12-3456"
      );
      error.stack = `Error: Failed to load patient record for user.test@clinic.org with SSN 000-12-3456
    at loadPatient (C:\\Users\\clinician\\project\\src\\patient.ts:42:15)
    at async fetch (https://clinic.com/api?patientId=987654321#token:10:5)`;

      const envelope = sanitizeError(error, "/patients?mrn=987654321#diagnostics");

      expect(envelope.route).toBe("/patients");
      expect(envelope.message).not.toContain("user.test@clinic.org");
      expect(envelope.message).not.toContain("000-12-3456");
      expect(envelope.message).toContain("[REDACTED]");

      // Stack signature must not leak username or local user paths
      expect(envelope.stackSignature).not.toContain("C:\\Users\\clinician\\");
      expect(envelope.stackSignature).not.toContain("user.test@clinic.org");
      expect(envelope.stackSignature).not.toContain("000-12-3456");
      expect(envelope.stackSignature).not.toContain("?patientId=987654321");
      expect(envelope.stackSignature).toContain("[LOCAL_PATH]\\");
    });

    it("preserves Next.js error digest as correlationId when present", () => {
      const error = new Error("Encounter component failed to mount") as Error & {
        digest?: string;
      };
      error.digest = "NEXTJS_DIGEST_882194_PROD";

      const envelope = sanitizeError(error, "/assessment");
      expect(envelope.correlationId).toBe("NEXTJS_DIGEST_882194_PROD");
    });

    it("extracts custom error codes or HTTP status from Error objects", () => {
      const error = new Error("Gateway timeout") as Error & {
        code?: string;
        status?: number;
      };
      error.code = "ECONNREFUSED";

      const envelope = sanitizeError(error);
      expect(envelope.code).toBe("ECONNREFUSED");

      const httpError = new Error("Internal failure") as Error & { status?: number };
      httpError.status = 503;

      const httpEnvelope = sanitizeError(httpError);
      expect(httpEnvelope.code).toBe("HTTP_503");
    });

    it("handles custom error classes", () => {
      class ClinicalProtocolViolationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "ClinicalProtocolViolationError";
        }
      }

      const error = new ClinicalProtocolViolationError(
        "Protocol failed for MRN 882194"
      );
      const envelope = sanitizeError(error, "/protocol");

      expect(envelope.code).toBe("ClinicalProtocolViolationError");
      expect(envelope.message).not.toContain("882194");
      expect(envelope.message).toBe("Protocol failed for MRN [REDACTED]");
    });

    it("handles edge case: Custom plain objects", () => {
      const customObj = {
        message: "Failed candidate sync for test@example.com",
        code: "SYNC_FAILURE",
        status: 500,
        correlationId: "ENC-CUSTOM-ID-442",
      };

      const envelope = sanitizeError(customObj, "/api/sync");

      expect(envelope.correlationId).toBe("ENC-CUSTOM-ID-442");
      expect(envelope.code).toBe("SYNC_FAILURE");
      expect(envelope.message).not.toContain("test@example.com");
      expect(envelope.message).toBe("Failed candidate sync for [REDACTED]");
      expect(envelope.stackSignature).toBe("NO_STACK");
    });

    it("handles edge case: Plain objects without message (JSON stringification)", () => {
      const customObj = {
        patientId: 1234567,
        status: 403,
      };

      const envelope = sanitizeError(customObj);

      expect(envelope.code).toBe("HTTP_403");
      expect(envelope.message).not.toContain("1234567");
      expect(envelope.message).toContain("[REDACTED]");
      expect(envelope.stackSignature).toBe("NO_STACK");
    });

    it("handles edge case: Circular reference plain objects safely", () => {
      const circularObj: Record<string, unknown> = { error: "Circular reference test" };
      circularObj.self = circularObj;

      const envelope = sanitizeError(circularObj);
      expect(envelope.code).toBe("CUSTOM_OBJECT_ERROR");
      expect(envelope.message).toBe("Circular reference test");
    });

    it("handles edge case: String errors", () => {
      const rawStringError =
        "NetworkError: Failed to fetch https://clinic.com/api?token=secret123#details";
      const envelope = sanitizeError(rawStringError, "/ledger");

      expect(envelope.code).toBe("STRING_ERROR");
      expect(envelope.message).not.toContain("?token=secret123");
      expect(envelope.message).not.toContain("#details");
      expect(envelope.message).toBe(
        "NetworkError: Failed to fetch https://clinic.com/api"
      );
      expect(envelope.stackSignature).toBe("NO_STACK");
      expect(envelope.correlationId).toMatch(/^ENC-/);
    });

    it("handles edge case: null", () => {
      const envelope = sanitizeError(null, "/intake");

      expect(envelope.code).toBe("NULL_EXCEPTION");
      expect(envelope.message).toBe("Null exception intercepted");
      expect(envelope.stackSignature).toBe("NO_STACK");
      expect(envelope.route).toBe("/intake");
      expect(envelope.correlationId).toMatch(/^ENC-/);
    });

    it("handles edge case: undefined", () => {
      const envelope = sanitizeError(undefined);

      expect(envelope.code).toBe("UNDEFINED_EXCEPTION");
      expect(envelope.message).toBe("Undefined exception intercepted");
      expect(envelope.stackSignature).toBe("NO_STACK");
      expect(envelope.route).toBe("/");
      expect(envelope.correlationId).toMatch(/^ENC-/);
    });

    it("handles edge case: primitives (number, boolean, symbol)", () => {
      const numEnvelope = sanitizeError(503);
      expect(numEnvelope.code).toBe("PRIMITIVE_ERROR");
      expect(numEnvelope.message).toBe("503");

      const boolEnvelope = sanitizeError(false);
      expect(boolEnvelope.code).toBe("PRIMITIVE_ERROR");
      expect(boolEnvelope.message).toBe("false");
    });
  });

  describe("captureClientError - Client Telemetry Dispatcher", () => {
    it("captures client error, logs scrubbed message, and returns envelope", () => {
      const error = new Error("Payment failed for card 4111 2222 3333 4444");
      const envelope = captureClientError(error, "/checkout?session=secret123");

      expect(envelope.route).toBe("/checkout");
      expect(envelope.message).not.toContain("4111");
      expect(envelope.message).toBe("Payment failed for card [REDACTED]");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Zero-ePHI Telemetry Intercept]")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[REDACTED]")
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("4111")
      );
    });

    it("dispatches custom DOM event when window is available", () => {
      const dispatchEventMock = jest.fn();
      const originalWindow = global.window;

      // Mock window environment
      global.window = {
        dispatchEvent: dispatchEventMock,
        location: { pathname: "/vip-portal" },
      } as unknown as Window & typeof globalThis;

      try {
        const error = new Error("Simulated client exception");
        const envelope = captureClientError(error);

        expect(dispatchEventMock).toHaveBeenCalledTimes(1);
        const eventArg = dispatchEventMock.mock.calls[0][0];
        expect(eventArg.type).toBe("zero-ephi-telemetry-error");
        expect(eventArg.detail).toEqual(envelope);
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe("initGlobalErrorInterceptor - Global Interception", () => {
    it("safely executes in server/Node environment where window is undefined", () => {
      const cleanup = initGlobalErrorInterceptor();
      expect(typeof cleanup).toBe("function");
      expect(() => cleanup()).not.toThrow();
    });

    it("attaches error, unhandledrejection, and fetch listeners in window environment", async () => {
      const addEventListenerMock = jest.fn();
      const removeEventListenerMock = jest.fn();
      const dispatchEventMock = jest.fn();

      const originalFetch = jest.fn().mockRejectedValue(new Error("Network connection dropped"));
      const originalWindow = global.window;

      const mockWindow = {
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: dispatchEventMock,
        fetch: originalFetch,
        location: { pathname: "/briefing" },
      } as unknown as Window & typeof globalThis;

      global.window = mockWindow;

      try {
        const cleanup = initGlobalErrorInterceptor();

        // 1. Verify listeners registered
        expect(addEventListenerMock).toHaveBeenCalledWith(
          "error",
          expect.any(Function)
        );
        expect(addEventListenerMock).toHaveBeenCalledWith(
          "unhandledrejection",
          expect.any(Function)
        );

        // 2. Simulate window 'error' event
        const errorHandler = addEventListenerMock.mock.calls.find(
          (call) => call[0] === "error"
        )?.[1];
        expect(errorHandler).toBeDefined();

        const mockErrorEvent = {
          error: new Error("Uncaught runtime error with token=xyz987"),
          message: "Uncaught runtime error with token=xyz987",
        } as unknown as ErrorEvent;

        errorHandler(mockErrorEvent);
        expect(dispatchEventMock).toHaveBeenCalled();
        const firstEvent = dispatchEventMock.mock.calls[0][0];
        expect(firstEvent.detail.message).not.toContain("xyz987");
        expect(firstEvent.detail.message).toContain("[REDACTED]");

        // 3. Simulate window 'unhandledrejection' event
        dispatchEventMock.mockClear();
        const rejectionHandler = addEventListenerMock.mock.calls.find(
          (call) => call[0] === "unhandledrejection"
        )?.[1];
        expect(rejectionHandler).toBeDefined();

        const mockRejectionEvent = {
          reason: new Error("Unhandled promise rejection for email: user@test.com"),
        } as unknown as PromiseRejectionEvent;

        rejectionHandler(mockRejectionEvent);
        expect(dispatchEventMock).toHaveBeenCalled();
        const secondEvent = dispatchEventMock.mock.calls[0][0];
        expect(secondEvent.detail.message).not.toContain("user@test.com");
        expect(secondEvent.detail.message).toContain("[REDACTED]");

        // 4. Test fetch network interception
        dispatchEventMock.mockClear();
        await expect(window.fetch("https://api.clinic.com/data")).rejects.toThrow(
          "Network connection dropped"
        );
        expect(dispatchEventMock).toHaveBeenCalled();

        // 5. Verify cleanup restores native fetch and removes listeners
        cleanup();
        expect(removeEventListenerMock).toHaveBeenCalledWith(
          "error",
          expect.any(Function)
        );
        expect(removeEventListenerMock).toHaveBeenCalledWith(
          "unhandledrejection",
          expect.any(Function)
        );
        expect(window.fetch).toBe(originalFetch);
      } finally {
        global.window = originalWindow;
      }
    });
  });
});
