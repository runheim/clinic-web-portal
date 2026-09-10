/**
 * COGNITIVE EDGE CLINIC — RESILIENCE ENGINE
 * Edge Circuit Breaker & Third-Party Fail-Safe Engine
 *
 * Tracks downstream service health ("spruce", "calcom", "stripe"):
 * - Tripping conditions: latency > 2500ms or 3 consecutive 5xx failures
 * - Auto-probe recovery: every 60 seconds (transitions to HALF_OPEN, resets to CLOSED after 2 consecutive successes)
 * - Safe execution wrapper with timeout race and automatic timer cleanup (zero open handles)
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type KnownCircuitService = "spruce" | "calcom" | "stripe";
export type CircuitService = KnownCircuitService | (string & {});

export const KNOWN_SERVICES: readonly KnownCircuitService[] = [
  "spruce",
  "calcom",
  "stripe",
] as const;

export interface CircuitConfig {
  /** Consecutive failures to open circuit (default: 3) */
  failureThreshold: number;
  /** Latency timeout in milliseconds before forced trip (default: 2500ms) */
  timeoutMs: number;
  /** Cooldown time in OPEN before attempting HALF_OPEN (default: 60000ms) */
  cooldownMs: number;
  /** Consecutive successes in HALF_OPEN to close circuit (default: 2) */
  successThreshold: number;
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

export interface SpruceCandidateInfo {
  name?: string;
  email?: string;
  phoneNumber?: string;
  startTime?: string;
  [key: string]: unknown;
}

export interface SpruceFallbackResponse {
  spruceRelayStatus: "degraded_fallback";
  priorityTeleDeskActive: true;
  emergencyHotline: string;
  directSms: string;
  notice: string;
  queuedCandidate: SpruceCandidateInfo | null;
}

export interface CircuitBreakerResult<T> {
  data: T;
  fromFallback: boolean;
  circuitState: CircuitState;
}

export const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 3,
  timeoutMs: 2500,
  cooldownMs: 60000,
  successThreshold: 2,
};

function createInitialMetrics(service: string): CircuitMetrics {
  return {
    service,
    state: "CLOSED",
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    lastFailureTime: null,
    lastSuccessTime: null,
    totalTrips: 0,
  };
}

// Global in-memory registry for edge runtime / server instances
const circuitRegistry = new Map<string, CircuitMetrics>();

// Pre-initialize known services
for (const svc of KNOWN_SERVICES) {
  circuitRegistry.set(svc, createInitialMetrics(svc));
}

function getOrCreateMetrics(service: string): CircuitMetrics {
  let metrics = circuitRegistry.get(service);
  if (!metrics) {
    metrics = createInitialMetrics(service);
    circuitRegistry.set(service, metrics);
  }
  return metrics;
}

/**
 * Returns current circuit state, transitioning from OPEN to HALF_OPEN if cooldown elapsed.
 */
export function getCircuitState(
  service: CircuitService,
  config: CircuitConfig = DEFAULT_CONFIG
): CircuitState {
  const metrics = getOrCreateMetrics(service);

  if (metrics.state === "OPEN") {
    const now = Date.now();
    if (metrics.lastFailureTime !== null && now - metrics.lastFailureTime >= config.cooldownMs) {
      metrics.state = "HALF_OPEN";
      metrics.consecutiveSuccesses = 0;
    }
  }

  return metrics.state;
}

/**
 * Record a successful execution against the service.
 * In HALF_OPEN, increments success count and resets to CLOSED after threshold is met.
 */
export function recordSuccess(
  service: CircuitService,
  config: CircuitConfig = DEFAULT_CONFIG
): void {
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
 * Helper to determine whether an error is a 5xx server-side error or timeout.
 */
export function is5xxError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "object") {
    const status =
      (error as { status?: unknown; statusCode?: unknown }).status ??
      (error as { statusCode?: unknown }).statusCode;
    if (typeof status === "number" && status >= 500 && status < 600) {
      return true;
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    /\b5\d{2}\b/.test(message) ||
    /Bad Gateway|Gateway Timeout|Internal Server Error|Service Unavailable/i.test(
      message
    )
  );
}

/**
 * Record a failure or timeout against the service.
 * In CLOSED, trips to OPEN when failureThreshold is reached.
 * In HALF_OPEN, immediately re-trips to OPEN.
 */
export function recordFailure(
  service: CircuitService,
  error?: Error | string,
  config: CircuitConfig = DEFAULT_CONFIG
): void {
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
    metrics.state = "OPEN";
    metrics.totalTrips += 1;
  }
}

/**
 * Force trip a circuit into OPEN state (useful for failover simulations / maintenance).
 */
export function tripCircuit(service: CircuitService, reason?: string): void {
  const metrics = getOrCreateMetrics(service);
  metrics.state = "OPEN";
  metrics.lastFailureTime = Date.now();
  metrics.consecutiveFailures = 3;
  metrics.consecutiveSuccesses = 0;
  metrics.totalTrips += 1;
  metrics.lastErrorSnippet = reason || "Forced trip by operational control";
}

/**
 * Force reset a circuit into CLOSED state.
 */
export function resetCircuit(service: CircuitService): void {
  const metrics = getOrCreateMetrics(service);
  metrics.state = "CLOSED";
  metrics.consecutiveFailures = 0;
  metrics.consecutiveSuccesses = 0;
  metrics.lastFailureTime = null;
  metrics.lastErrorSnippet = undefined;
}

/**
 * Reset all registered circuits and re-populate default services.
 */
export function resetAllCircuits(): void {
  circuitRegistry.clear();
  for (const svc of KNOWN_SERVICES) {
    circuitRegistry.set(svc, createInitialMetrics(svc));
  }
}

/**
 * Get snapshot metrics for a specific service, or all registered services.
 */
export function getCircuitMetrics(service: CircuitService): CircuitMetrics;
export function getCircuitMetrics(): Record<string, CircuitMetrics>;
export function getCircuitMetrics(
  service?: CircuitService
): CircuitMetrics | Record<string, CircuitMetrics> {
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
 * Guaranteed timeout cleanup prevents open handles in edge/server runtimes.
 */
export async function executeWithCircuitBreaker<T, R = T>(
  service: CircuitService,
  actionFn: (signal?: AbortSignal) => Promise<T>,
  fallbackFn: (err?: Error) => Promise<R> | R,
  customConfig?: Partial<CircuitConfig>
): Promise<CircuitBreakerResult<T | R>> {
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

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timer: NodeJS.Timeout | undefined;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        if (controller) {
          controller.abort();
        }
        reject(
          new Error(`Upstream timeout for '${service}' exceeded ${config.timeoutMs}ms`)
        );
      }, config.timeoutMs);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    });

    const result = await Promise.race([actionFn(controller?.signal), timeoutPromise]);

    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    recordSuccess(service, config);
    return {
      data: result,
      fromFallback: false,
      circuitState: getCircuitState(service, config),
    };
  } catch (err: unknown) {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    recordFailure(service, errorObj, config);

    const fallbackData = await fallbackFn(errorObj);
    return {
      data: fallbackData,
      fromFallback: true,
      circuitState: getCircuitState(service, config),
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  }
}

/**
 * Fail-Safe Spruce Health Fallback Payload Generator
 */
export function getSpruceFallbackResponse(
  candidateInfo?: SpruceCandidateInfo | null
): SpruceFallbackResponse {
  return {
    spruceRelayStatus: "degraded_fallback",
    priorityTeleDeskActive: true,
    emergencyHotline: "+1 (800) 555-0199",
    directSms: "sms:+18005550199",
    notice:
      "Priority Tele-Desk Active: Upstream bridge degraded. Immediate triage routed to direct concierge line.",
    queuedCandidate: candidateInfo || null,
  };
}
