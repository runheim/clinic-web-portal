import {
  executeWithCircuitBreaker,
  getCircuitState,
  getCircuitMetrics,
  tripCircuit,
  resetCircuit,
  resetAllCircuits,
  getSpruceFallbackResponse,
  recordSuccess,
  recordFailure,
  is5xxError,
  CircuitConfig,
  CircuitMetrics,
  KNOWN_SERVICES,
} from "@/lib/resilience/circuitBreaker";

describe("Subagent Alpha: Resilience Engine — Circuit Breaker & Fail-Safe Battery", () => {
  const testConfig: CircuitConfig = {
    failureThreshold: 3,
    timeoutMs: 50, // Shortened for responsive test execution
    cooldownMs: 100, // Shortened for responsive recovery testing
    successThreshold: 2,
  };

  beforeEach(() => {
    resetAllCircuits();
  });

  describe("Downstream Service State Tracking", () => {
    test("Pre-initializes downstream services 'spruce', 'calcom', and 'stripe' in CLOSED state", () => {
      for (const service of KNOWN_SERVICES) {
        expect(getCircuitState(service)).toBe("CLOSED");
        const metrics: CircuitMetrics = getCircuitMetrics(service);
        expect(metrics.state).toBe("CLOSED");
        expect(metrics.consecutiveFailures).toBe(0);
        expect(metrics.consecutiveSuccesses).toBe(0);
        expect(metrics.totalTrips).toBe(0);
      }
    });

    test("Initial state is CLOSED and healthy upstream calls execute successfully", async () => {
      const service = "spruce";
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      const result = await executeWithCircuitBreaker<{
        status: number;
        contactId?: string;
        fallback?: boolean;
      }>(
        service,
        async () => ({ status: 200, contactId: "spruce_123" }),
        () => ({ status: 500, fallback: true }),
        testConfig
      );

      expect(result.data).toEqual({ status: 200, contactId: "spruce_123" });
      expect(result.fromFallback).toBe(false);
      expect(result.circuitState).toBe("CLOSED");
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");
    });
  });

  describe("State Transitions: CLOSED -> OPEN", () => {
    test("Trips to OPEN on 3 consecutive 5xx failures", async () => {
      const service = "calcom";
      const fallbackPayload = { status: "fallback_dispatched" };

      // 1st 5xx failure (e.g. 502 Bad Gateway)
      const res1 = await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 502 Bad Gateway");
        },
        () => fallbackPayload,
        testConfig
      );
      expect(res1.fromFallback).toBe(true);
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      // 2nd 5xx failure (e.g. 503 Service Unavailable)
      const res2 = await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 503 Service Unavailable");
        },
        () => fallbackPayload,
        testConfig
      );
      expect(res2.fromFallback).toBe(true);
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      // 3rd 5xx failure (e.g. 504 Gateway Timeout -> trips circuit to OPEN)
      const res3 = await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 504 Gateway Timeout");
        },
        () => fallbackPayload,
        testConfig
      );
      expect(res3.fromFallback).toBe(true);
      expect(res3.circuitState).toBe("OPEN");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");

      const metrics = getCircuitMetrics(service);
      expect(metrics.consecutiveFailures).toBe(3);
      expect(metrics.totalTrips).toBe(1);
    });

    test("Trips to OPEN on 3 consecutive latency timeouts", async () => {
      const service = "stripe";
      const fallbackPayload = { chargeId: "fallback_receipt" };

      // Helper creating an abort-aware delayed promise to ensure zero open handles
      const delayedAction = (signal?: AbortSignal) =>
        new Promise<never>((_, reject) => {
          const t = setTimeout(() => {
            reject(new Error("Should have been aborted by timeout"));
          }, 200);
          (t as unknown as { unref?: () => void }).unref?.();
          signal?.addEventListener("abort", () => clearTimeout(t));
        });

      // 3 consecutive timeout failures
      for (let i = 1; i <= 2; i++) {
        const res = await executeWithCircuitBreaker(
          service,
          delayedAction,
          () => fallbackPayload,
          testConfig
        );
        expect(res.fromFallback).toBe(true);
        expect(getCircuitState(service, testConfig)).toBe("CLOSED");
      }

      // 3rd timeout trips to OPEN
      const res3 = await executeWithCircuitBreaker(
        service,
        delayedAction,
        () => fallbackPayload,
        testConfig
      );
      expect(res3.fromFallback).toBe(true);
      expect(res3.circuitState).toBe("OPEN");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");
    });

    test("Trips to OPEN on mixed 5xx and timeout failures reaching threshold", async () => {
      const service = "spruce";
      const fallbackPayload = { fallback: true };

      // 1. Latency timeout
      await executeWithCircuitBreaker(
        service,
        (signal) =>
          new Promise((resolve) => {
            const t = setTimeout(resolve, 200);
            (t as unknown as { unref?: () => void }).unref?.();
            signal?.addEventListener("abort", () => clearTimeout(t));
          }),
        () => fallbackPayload,
        testConfig
      );
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      // 2. HTTP 500
      await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 500 Internal Server Error");
        },
        () => fallbackPayload,
        testConfig
      );
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      // 3. HTTP 502 -> trips
      const finalRes = await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 502 Bad Gateway");
        },
        () => fallbackPayload,
        testConfig
      );
      expect(finalRes.circuitState).toBe("OPEN");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");
    });
  });

  describe("Upstream Bypass when OPEN", () => {
    test("When OPEN, upstream action is immediately bypassed without execution", async () => {
      const service = "stripe";
      tripCircuit(service, "Simulated upstream Stripe outage");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");

      const mockUpstream = jest.fn().mockResolvedValue({ processed: true });
      const mockFallback = jest.fn().mockReturnValue({ processed: false, offlineQueued: true });

      const result = await executeWithCircuitBreaker(
        service,
        mockUpstream,
        mockFallback,
        testConfig
      );

      // Verify upstream action was NEVER invoked
      expect(mockUpstream).not.toHaveBeenCalled();
      // Verify fallback was invoked
      expect(mockFallback).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual({ processed: false, offlineQueued: true });
      expect(result.fromFallback).toBe(true);
      expect(result.circuitState).toBe("OPEN");
    });
  });

  describe("Auto-Probe Recovery: OPEN -> HALF_OPEN -> CLOSED", () => {
    test("Transitions to HALF_OPEN after cooldown and recovers to CLOSED after 2 successes", async () => {
      const service = "calcom";
      tripCircuit(service, "Simulated transient outage");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");

      // Before cooldown elapsed: still OPEN
      expect(getCircuitState(service, testConfig)).toBe("OPEN");

      // Wait for cooldown (100ms + margin)
      await new Promise((resolve) => setTimeout(resolve, 130));

      // Cooldown elapsed: transitions to HALF_OPEN
      expect(getCircuitState(service, testConfig)).toBe("HALF_OPEN");

      // Probe 1: First success in HALF_OPEN (needs 2 to close)
      const probe1 = await executeWithCircuitBreaker<{
        probed?: number;
        fallback?: boolean;
      }>(
        service,
        async () => ({ probed: 1 }),
        () => ({ fallback: true }),
        testConfig
      );
      expect(probe1.fromFallback).toBe(false);
      expect(probe1.circuitState).toBe("HALF_OPEN");
      expect(getCircuitState(service, testConfig)).toBe("HALF_OPEN");

      const metricsAfterProbe1 = getCircuitMetrics(service);
      expect(metricsAfterProbe1.consecutiveSuccesses).toBe(1);

      // Probe 2: Second consecutive success -> closes circuit
      const probe2 = await executeWithCircuitBreaker<{
        probed?: number;
        fallback?: boolean;
      }>(
        service,
        async () => ({ probed: 2 }),
        () => ({ fallback: true }),
        testConfig
      );
      expect(probe2.fromFallback).toBe(false);
      expect(probe2.circuitState).toBe("CLOSED");
      expect(getCircuitState(service, testConfig)).toBe("CLOSED");

      const metricsAfterProbe2 = getCircuitMetrics(service);
      expect(metricsAfterProbe2.state).toBe("CLOSED");
      expect(metricsAfterProbe2.consecutiveSuccesses).toBe(0);
      expect(metricsAfterProbe2.consecutiveFailures).toBe(0);
    });

    test("Re-trips immediately to OPEN if a probe fails while in HALF_OPEN", async () => {
      const service = "spruce";
      tripCircuit(service, "Trip before probe test");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 130));
      expect(getCircuitState(service, testConfig)).toBe("HALF_OPEN");

      // Probe fails with 5xx
      const failedProbe = await executeWithCircuitBreaker(
        service,
        async () => {
          throw new Error("HTTP 503 Upstream Still Unstable");
        },
        () => ({ fallback: true }),
        testConfig
      );

      expect(failedProbe.fromFallback).toBe(true);
      expect(failedProbe.circuitState).toBe("OPEN");
      expect(getCircuitState(service, testConfig)).toBe("OPEN");
    });
  });

  describe("Spruce Health Fail-Safe Fallback Generator", () => {
    test("Generates compliant fail-safe payload with emergency dialers and queue", () => {
      const candidate = {
        name: "Eleanor Vance",
        email: "eleanor.vance@example.com",
        phoneNumber: "+1 (555) 012-3456",
        startTime: "2026-09-10T14:00:00Z",
      };

      const fallback = getSpruceFallbackResponse(candidate);

      expect(fallback.spruceRelayStatus).toBe("degraded_fallback");
      expect(fallback.priorityTeleDeskActive).toBe(true);
      expect(fallback.emergencyHotline).toBe("+1 (800) 555-0199");
      expect(fallback.directSms).toBe("sms:+18005550199");
      expect(fallback.notice).toBe(
        "Priority Tele-Desk Active: Upstream bridge degraded. Immediate triage routed to direct concierge line."
      );
      expect(fallback.queuedCandidate).toEqual(candidate);
    });

    test("Handles null or undefined candidate gracefully", () => {
      const fallbackNull = getSpruceFallbackResponse(null);
      expect(fallbackNull.queuedCandidate).toBeNull();
      expect(fallbackNull.spruceRelayStatus).toBe("degraded_fallback");

      const fallbackUndef = getSpruceFallbackResponse();
      expect(fallbackUndef.queuedCandidate).toBeNull();
      expect(fallbackUndef.priorityTeleDeskActive).toBe(true);
    });
  });

  describe("Operational Controls & Telemetry", () => {
    test("tripCircuit and resetCircuit manually manipulate state", () => {
      const service = "spruce";
      expect(getCircuitState(service)).toBe("CLOSED");

      tripCircuit(service, "Emergency failover drill");
      expect(getCircuitState(service)).toBe("OPEN");
      const metrics = getCircuitMetrics(service);
      expect(metrics.state).toBe("OPEN");
      expect(metrics.lastErrorSnippet).toBe("Emergency failover drill");

      resetCircuit(service);
      expect(getCircuitState(service)).toBe("CLOSED");
      const resetMetrics = getCircuitMetrics(service);
      expect(resetMetrics.state).toBe("CLOSED");
      expect(resetMetrics.consecutiveFailures).toBe(0);
    });

    test("resetAllCircuits resets all tracked services", () => {
      tripCircuit("spruce", "Spruce down");
      tripCircuit("calcom", "Calcom down");
      tripCircuit("stripe", "Stripe down");

      expect(getCircuitState("spruce")).toBe("OPEN");
      expect(getCircuitState("calcom")).toBe("OPEN");
      expect(getCircuitState("stripe")).toBe("OPEN");

      resetAllCircuits();

      expect(getCircuitState("spruce")).toBe("CLOSED");
      expect(getCircuitState("calcom")).toBe("CLOSED");
      expect(getCircuitState("stripe")).toBe("CLOSED");
    });

    test("getCircuitMetrics returns global snapshot map when called with no arguments", () => {
      tripCircuit("spruce", "Down");
      const allMetrics = getCircuitMetrics();

      expect(allMetrics["spruce"]).toBeDefined();
      expect(allMetrics["spruce"].state).toBe("OPEN");
      expect(allMetrics["calcom"]).toBeDefined();
      expect(allMetrics["calcom"].state).toBe("CLOSED");
      expect(allMetrics["stripe"]).toBeDefined();
      expect(allMetrics["stripe"].state).toBe("CLOSED");
    });

    test("recordSuccess and recordFailure work directly", () => {
      const service = "custom-test-svc";
      recordFailure(service, "Test error", testConfig);
      expect(getCircuitMetrics(service).consecutiveFailures).toBe(1);

      recordSuccess(service, testConfig);
      expect(getCircuitMetrics(service).consecutiveFailures).toBe(0);
      expect(getCircuitMetrics(service).consecutiveSuccesses).toBe(0);
    });

    test("is5xxError identifies 5xx HTTP status codes and error messages", () => {
      expect(is5xxError(new Error("HTTP 502 Bad Gateway"))).toBe(true);
      expect(is5xxError(new Error("500 Internal Server Error"))).toBe(true);
      expect(is5xxError(new Error("Service Unavailable"))).toBe(true);
      expect(is5xxError({ status: 503 })).toBe(true);
      expect(is5xxError({ statusCode: 504 })).toBe(true);
      expect(is5xxError(new Error("404 Not Found"))).toBe(false);
      expect(is5xxError({ status: 400 })).toBe(false);
      expect(is5xxError(null)).toBe(false);
    });
  });
});
