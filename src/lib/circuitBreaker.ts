/**
 * COGNITIVE EDGE CLINIC — EDGE CIRCUIT BREAKER & THIRD-PARTY FAIL-SAFE ENGINE
 *
 * Protects clinical enclaves against upstream API degradations:
 * - Monitors Spruce Health, Cal.com, and Stripe telemetry.
 * - Tripping conditions: > 2,500ms latency timeout or 3 consecutive 5xx failures.
 * - Tripped state: DEGRADED_FALLBACK (OPEN) with fail-safe direct SMS/Voice dialers.
 * - Self-healing: Probes upstream every 60s (HALF_OPEN) and resets to CLOSED upon 2 consecutive successes.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitConfig {
  failureThreshold: number; // consecutive failures to open circuit (default: 3)
  timeoutMs: number; // latency timeout before forced trip (default: 2500ms)
  cooldownMs: number; // time to wait in OPEN before attempting HALF_OPEN (default: 60000ms)
  successThreshold: number; // consecutive successes in HALF_OPEN to close circuit (default: 2)
}

export interface CircuitMetrics {
  service: string;
  state: CircuitState;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalTrips: number;
  lastErrorSnippet?: string;
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  timeoutMs: 2500,
  cooldownMs: 60000,
  successThreshold: 2,
};

// Global in-memory registry for edge runtime / server instances
const circuitRegistry = new Map<string, CircuitMetrics>();

function getOrCreateMetrics(service: string): CircuitMetrics {
  let metrics = circuitRegistry.get(service);
  if (!metrics) {
    metrics = {
      service,
      state: "CLOSED",
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      totalTrips: 0,
    };
    circuitRegistry.set(service, metrics);
  }
  return metrics;
}

/**
 * Returns current circuit state, updating from OPEN to HALF_OPEN if cooldown elapsed.
 */
export function getCircuitState(service: string, config: CircuitConfig = DEFAULT_CONFIG): CircuitState {
  const metrics = getOrCreateMetrics(service);

  if (metrics.state === "OPEN") {
    const now = Date.now();
    if (metrics.lastFailureTime && now - metrics.lastFailureTime >= config.cooldownMs) {
      metrics.state = "HALF_OPEN";
      metrics.consecutiveSuccesses = 0;
    }
  }

  return metrics.state;
}

/**
 * Record a successful execution against the service.
 */
export function recordSuccess(service: string, config: CircuitConfig = DEFAULT_CONFIG): void {
  const metrics = getOrCreateMetrics(service);
  metrics.lastSuccessTime = Date.now();
  metrics.consecutiveFailures = 0;

  if (metrics.state === "HALF_OPEN") {
    metrics.consecutiveSuccesses += 1;
    if (metrics.consecutiveSuccesses >= config.successThreshold) {
      metrics.state = "CLOSED";
      metrics.consecutiveSuccesses = 0;
    }
  }
}

/**
 * Record a failure or timeout against the service.
 */
export function recordFailure(service: string, error?: Error | string, config: CircuitConfig = DEFAULT_CONFIG): void {
  const metrics = getOrCreateMetrics(service);
  metrics.lastFailureTime = Date.now();
  metrics.consecutiveFailures += 1;
  metrics.consecutiveSuccesses = 0;
  if (error) {
    metrics.lastErrorSnippet = error instanceof Error ? error.message : String(error);
  }

  if (metrics.state === "CLOSED" && metrics.consecutiveFailures >= config.failureThreshold) {
    metrics.state = "OPEN";
    metrics.totalTrips += 1;
  } else if (metrics.state === "HALF_OPEN") {
    // If a probe in HALF_OPEN fails, immediately reopen
    metrics.state = "OPEN";
    metrics.totalTrips += 1;
  }
}

/**
 * Force trip a circuit into OPEN state (useful for failover simulations).
 */
export function tripCircuit(service: string, reason?: string): void {
  const metrics = getOrCreateMetrics(service);
  metrics.state = "OPEN";
  metrics.lastFailureTime = Date.now();
  metrics.consecutiveFailures = 3;
  metrics.totalTrips += 1;
  metrics.lastErrorSnippet = reason || "Forced trip by operational control";
}

/**
 * Force reset a circuit into CLOSED state.
 */
export function resetCircuit(service: string): void {
  const metrics = getOrCreateMetrics(service);
  metrics.state = "CLOSED";
  metrics.consecutiveFailures = 0;
  metrics.consecutiveSuccesses = 0;
  metrics.lastFailureTime = null;
  metrics.lastErrorSnippet = undefined;
}

/**
 * Reset all registered circuits.
 */
export function resetAllCircuits(): void {
  circuitRegistry.clear();
}

/**
 * Get snapshot of all active circuit breakers.
 */
export function getCircuitMetrics(service?: string): CircuitMetrics | Record<string, CircuitMetrics> {
  if (service) {
    return { ...getOrCreateMetrics(service) };
  }
  const snapshot: Record<string, CircuitMetrics> = {};
  for (const [key, val] of circuitRegistry.entries()) {
    snapshot[key] = { ...val };
  }
  return snapshot;
}

/**
 * Primary Execution Wrapper:
 * Executes the upstream action within timeout constraints; seamlessly triggers fallback on error or open circuit.
 */
export async function executeWithCircuitBreaker<T>(
  service: string,
  actionFn: () => Promise<T>,
  fallbackFn: (err?: Error) => Promise<T> | T,
  customConfig?: Partial<CircuitConfig>
): Promise<{ data: T; fromFallback: boolean; circuitState: CircuitState }> {
  const config: CircuitConfig = { ...DEFAULT_CONFIG, ...customConfig };
  const currentState = getCircuitState(service, config);

  // If OPEN, bypass upstream call completely to protect edge latency
  if (currentState === "OPEN") {
    const fallbackData = await fallbackFn(
      new Error(`Circuit breaker for '${service}' is OPEN (Degraded Fallback Active)`)
    );
    return {
      data: fallbackData,
      fromFallback: true,
      circuitState: "OPEN",
    };
  }

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Upstream timeout for '${service}' exceeded ${config.timeoutMs}ms`)),
      config.timeoutMs
    );
  });

  try {
    const result = await Promise.race([actionFn(), timeoutPromise]);
    if (timer) clearTimeout(timer);

    recordSuccess(service, config);
    return {
      data: result,
      fromFallback: false,
      circuitState: getCircuitState(service, config),
    };
  } catch (err: unknown) {
    if (timer) clearTimeout(timer);
    const errorObj = err instanceof Error ? err : new Error(String(err));
    recordFailure(service, errorObj, config);

    const fallbackData = await fallbackFn(errorObj);
    return {
      data: fallbackData,
      fromFallback: true,
      circuitState: getCircuitState(service, config),
    };
  }
}

/**
 * Fail-Safe Spruce Health Fallback Payload Generator
 */
export function getSpruceFallbackResponse(candidateInfo?: { name?: string; email?: string }) {
  return {
    spruceRelayStatus: "degraded_fallback",
    priorityTeleDeskActive: true,
    emergencyHotline: "+1 (800) 555-0199",
    directSms: "sms:+18005550199",
    notice: "Priority Tele-Desk Active: Upstream bridge degraded. Immediate triage routed to direct concierge line.",
    queuedCandidate: candidateInfo || null,
  };
}
