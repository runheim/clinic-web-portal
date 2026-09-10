import {
  executeWithCircuitBreaker,
  getCircuitState,
  getCircuitMetrics,
  tripCircuit,
  resetCircuit,
  resetAllCircuits,
  getSpruceFallbackResponse,
  CircuitConfig,
} from "@/lib/circuitBreaker";

describe("Phase 18: Edge Circuit Breaker & Third-Party Fail-Safe Engine", () => {
  const testConfig: CircuitConfig = {
    failureThreshold: 3,
    timeoutMs: 100, // Reduced for fast unit testing
    cooldownMs: 200, // Reduced for fast cooldown testing
    successThreshold: 2,
  };

  beforeEach(() => {
    resetAllCircuits();
  });

  // TEST 1: Initial state is CLOSED and successful calls maintain CLOSED
  test("Test Case 1: Initial state is CLOSED and healthy calls execute successfully", async () => {
    const service = "test-healthy-service";
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");

    const result = await executeWithCircuitBreaker(
      service,
      async () => "upstream_success_data",
      () => "fallback_data",
      testConfig
    );

    expect(result.data).toBe("upstream_success_data");
    expect(result.fromFallback).toBe(false);
    expect(result.circuitState).toBe("CLOSED");
  });

  // TEST 2: Circuit trips from CLOSED to OPEN after 3 consecutive failures / timeouts
  test("Test Case 2: Circuit trips from CLOSED to OPEN after 3 consecutive timeouts/failures", async () => {
    const service = "test-failing-service";
    const fallbackMessage = "degraded_fallback_active";

    // Failure 1
    const res1 = await executeWithCircuitBreaker(
      service,
      async () => {
        throw new Error("HTTP 502 Bad Gateway");
      },
      () => fallbackMessage,
      testConfig
    );
    expect(res1.fromFallback).toBe(true);
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");

    // Failure 2 (Simulated timeout > timeoutMs)
    const res2 = await executeWithCircuitBreaker(
      service,
      () => new Promise((resolve) => setTimeout(resolve, 300)),
      () => fallbackMessage,
      testConfig
    );
    expect(res2.fromFallback).toBe(true);
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");

    // Failure 3 (Threshold reached -> trips to OPEN)
    const res3 = await executeWithCircuitBreaker(
      service,
      async () => {
        throw new Error("HTTP 504 Gateway Timeout");
      },
      () => fallbackMessage,
      testConfig
    );
    expect(res3.fromFallback).toBe(true);
    expect(getCircuitState(service, testConfig)).toBe("OPEN");
    expect(res3.circuitState).toBe("OPEN");
  });

  // TEST 3: When OPEN, upstream action is immediately bypassed without execution
  test("Test Case 3: When circuit is OPEN, upstream action is completely bypassed", async () => {
    const service = "test-open-bypass";
    tripCircuit(service, "Simulated third-party total degradation");
    expect(getCircuitState(service, testConfig)).toBe("OPEN");

    const upstreamMock = jest.fn().mockResolvedValue("upstream_never_called");

    const result = await executeWithCircuitBreaker(
      service,
      upstreamMock,
      () => "instant_fallback_response",
      testConfig
    );

    expect(upstreamMock).not.toHaveBeenCalled();
    expect(result.data).toBe("instant_fallback_response");
    expect(result.fromFallback).toBe(true);
    expect(result.circuitState).toBe("OPEN");
  });

  // TEST 4: Cooldown transitions to HALF_OPEN and 2 successes recover to CLOSED
  test("Test Case 4: Cooldown transitions to HALF_OPEN and recovery threshold resets to CLOSED", async () => {
    const service = "test-recovery-service";
    tripCircuit(service);
    expect(getCircuitState(service, testConfig)).toBe("OPEN");

    // Wait for cooldown (200ms)
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(getCircuitState(service, testConfig)).toBe("HALF_OPEN");

    // Probe 1: Success in HALF_OPEN (needs 2 to close)
    const probe1 = await executeWithCircuitBreaker(
      service,
      async () => "probe_1_ok",
      () => "fallback",
      testConfig
    );
    expect(probe1.fromFallback).toBe(false);
    expect(getCircuitState(service, testConfig)).toBe("HALF_OPEN");

    // Probe 2: Success in HALF_OPEN (meets threshold of 2 -> CLOSED)
    const probe2 = await executeWithCircuitBreaker(
      service,
      async () => "probe_2_ok",
      () => "fallback",
      testConfig
    );
    expect(probe2.fromFallback).toBe(false);
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");
  });

  // TEST 5: Spruce Health fallback generator produces compliant fail-safe telemetry
  test("Test Case 5: Spruce Health fallback generator produces compliant fail-safe telemetry", () => {
    const fallback = getSpruceFallbackResponse({
      name: "Richard Roe",
      email: "richard.roe@example.com",
    });

    expect(fallback.spruceRelayStatus).toBe("degraded_fallback");
    expect(fallback.priorityTeleDeskActive).toBe(true);
    expect(fallback.emergencyHotline).toBe("+1 (800) 555-0199");
    expect(fallback.directSms).toBe("sms:+18005550199");
    expect(fallback.queuedCandidate?.name).toBe("Richard Roe");
  });

  // TEST 6: Manual trip and reset overrides function correctly
  test("Test Case 6: Manual trip and reset operational controls work predictably", () => {
    const service = "test-ops-control";
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");

    tripCircuit(service, "Maintenance Drill");
    expect(getCircuitState(service, testConfig)).toBe("OPEN");
    const metrics = getCircuitMetrics(service) as { state: string };
    expect(metrics.state).toBe("OPEN");

    resetCircuit(service);
    expect(getCircuitState(service, testConfig)).toBe("CLOSED");
  });
});
