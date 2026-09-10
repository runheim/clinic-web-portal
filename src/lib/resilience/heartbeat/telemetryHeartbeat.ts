/**
 * COGNITIVE EDGE CLINIC — TELEMETRY RESILIENCE ENGINE
 * Client-Side Telemetry Dead-Man's Switch & Connection Health Monitor
 *
 * Designed for active clinical consultation and intake screener sessions:
 * - Probes edge connection using lightweight HEAD / ping requests every 30 seconds
 * - Tracks metrics: current RTT, average RTT, jitter, packet loss rate, connection status
 * - Classifies connection health: 'optimal' | 'jitter' | 'degraded' | 'offline'
 * - Dead-man's switch: Ephemeral callback / 'connection-quality-changed' event triggered
 *   when connection degrades or drops, allowing UI to pause timer or warn member before packet drop causes data loss
 * - Zero-ePHI: All probes are strictly zero-ePHI (credentials omitted, headers sanitized, query parameters stripped)
 * - Safe timer management with unref and abort controller for zero open handles
 */

export type ConnectionStatus = "optimal" | "jitter" | "degraded" | "offline";

/**
 * Individual probe sample stored in sliding window
 */
export interface ProbeSample {
  timestamp: number;
  rtt: number | null; // null if probe timed out or failed
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Real-time aggregated metrics computed across the sliding window
 */
export interface ConnectionMetrics {
  status: ConnectionStatus;
  currentRtt: number;
  averageRtt: number;
  jitter: number;
  packetLossRate: number;
  totalProbes: number;
  failedProbes: number;
  consecutiveFailures: number;
  lastProbeTime: number | null;
  lastStatusChange: number;
}

/**
 * Health classification thresholds
 */
export interface HeartbeatThresholds {
  /** RTT in ms above which connection is considered degraded (default: 300ms) */
  degradedRttMs: number;
  /** Jitter in ms above which connection is marked 'jitter' (default: 50ms) */
  jitterMs: number;
  /** Packet loss rate (0.0 - 1.0) above which connection is degraded (default: 0.15 = 15%) */
  degradedLossRate: number;
  /** Consecutive probe failures to trip offline status (default: 3) */
  offlineConsecutiveFailures: number;
}

/**
 * Event payload dispatched on quality changes or dead-man switch triggers
 */
export interface ConnectionQualityChangeEvent {
  type: "connection-quality-changed";
  previousStatus: ConnectionStatus;
  currentStatus: ConnectionStatus;
  metrics: ConnectionMetrics;
  isDeadManTriggered: boolean;
  timestamp: number;
}

export type ConnectionQualityListener = (event: ConnectionQualityChangeEvent) => void;

/**
 * Configuration options for the TelemetryHeartbeat monitor
 */
export interface HeartbeatConfig {
  /** Target edge ping URL/endpoint. Query parameters and hashes are automatically stripped. (default: '/api/health') */
  endpoint: string;
  /** Heartbeat probe interval in milliseconds (default: 30000 = 30 seconds) */
  intervalMs: number;
  /** Probe network timeout in milliseconds (default: 4000 = 4 seconds) */
  timeoutMs: number;
  /** Number of samples to retain in the sliding window (default: 10) */
  windowSize: number;
  /** Health classification thresholds */
  thresholds: HeartbeatThresholds;
  /** Optional custom fetch implementation (used for unit testing or custom transport) */
  fetchFn?: typeof fetch;
  /** Ephemeral callback invoked whenever connection quality changes */
  onQualityChange?: ConnectionQualityListener;
  /** Ephemeral dead-man's switch callback invoked specifically when status trips to 'degraded' or 'offline' */
  onDeadManTrigger?: ConnectionQualityListener;
}

export const DEFAULT_THRESHOLDS: HeartbeatThresholds = {
  degradedRttMs: 300,
  jitterMs: 50,
  degradedLossRate: 0.15,
  offlineConsecutiveFailures: 3,
};

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  endpoint: "/api/health",
  intervalMs: 30000, // 30 seconds
  timeoutMs: 4000,
  windowSize: 10,
  thresholds: DEFAULT_THRESHOLDS,
};

/**
 * Aggressively sanitizes target URL to ensure zero patient identifiers,
 * query parameters, credentials, or hashes can be transmitted during pings.
 */
export function sanitizeProbeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "/api/health";
  }

  try {
    // If absolute URL, strip userinfo and search/hash
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      const parsed = new URL(rawUrl);
      parsed.username = "";
      parsed.password = "";
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    }

    // If relative path, strip query strings and hashes directly
    const cleanPath = rawUrl.split("?")[0].split("#")[0].trim();
    return cleanPath.length > 0 ? cleanPath : "/api/health";
  } catch {
    return "/api/health";
  }
}

/**
 * Calculates interarrival jitter based on Mean Absolute Deviation between consecutive successful RTTs.
 */
export function calculateJitter(samples: readonly ProbeSample[]): number {
  const successfulRtts = samples
    .filter((s): s is ProbeSample & { rtt: number } => s.success && typeof s.rtt === "number" && s.rtt >= 0)
    .map((s) => s.rtt);

  if (successfulRtts.length < 2) {
    return 0;
  }

  let totalDiff = 0;
  for (let i = 1; i < successfulRtts.length; i++) {
    totalDiff += Math.abs(successfulRtts[i] - successfulRtts[i - 1]);
  }

  return Math.round(totalDiff / (successfulRtts.length - 1));
}

/**
 * TelemetryHeartbeat
 * Client-Side Telemetry Dead-Man's Switch & Connection Health Monitor
 */
export class TelemetryHeartbeat {
  private readonly config: HeartbeatConfig;
  private readonly sanitizedEndpoint: string;
  private readonly samples: ProbeSample[] = [];
  private readonly listeners: Set<ConnectionQualityListener> = new Set();
  private readonly deadManListeners: Set<ConnectionQualityListener> = new Set();

  private status: ConnectionStatus = "optimal";
  private currentRtt: number = 0;
  private consecutiveFailures: number = 0;
  private totalProbes: number = 0;
  private failedProbes: number = 0;
  private lastProbeTime: number | null = null;
  private lastStatusChange: number = Date.now();

  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private activeAbortController: AbortController | null = null;
  private isMonitoring: boolean = false;

  constructor(config?: Partial<HeartbeatConfig>) {
    this.config = {
      ...DEFAULT_HEARTBEAT_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_THRESHOLDS,
        ...(config?.thresholds || {}),
      },
    };

    this.sanitizedEndpoint = sanitizeProbeUrl(this.config.endpoint);

    if (this.config.onQualityChange) {
      this.listeners.add(this.config.onQualityChange);
    }
    if (this.config.onDeadManTrigger) {
      this.deadManListeners.add(this.config.onDeadManTrigger);
    }
  }

  /**
   * Starts the 30-second interval telemetry probe.
   * Cleans up any prior timer to prevent resource leaks.
   */
  public start(): this {
    if (this.isMonitoring) {
      return this;
    }

    this.isMonitoring = true;

    // Execute first probe immediately asynchronously
    void this.probeNow();

    // Schedule regular probes every intervalMs (default 30 seconds)
    this.intervalTimer = setInterval(() => {
      void this.probeNow();
    }, this.config.intervalMs);

    // Support Node.js unref to ensure zero open handles in automated testing
    if (
      this.intervalTimer &&
      typeof this.intervalTimer === "object" &&
      "unref" in this.intervalTimer &&
      typeof (this.intervalTimer as { unref: () => void }).unref === "function"
    ) {
      (this.intervalTimer as { unref: () => void }).unref();
    }

    return this;
  }

  /**
   * Stops the monitor, clears timers, and aborts any active in-flight probe.
   * Guarantees zero open handles.
   */
  public stop(): void {
    this.isMonitoring = false;

    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    if (this.activeAbortController !== null) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  /**
   * Returns whether the telemetry heartbeat is actively running.
   */
  public isRunning(): boolean {
    return this.isMonitoring;
  }

  /**
   * Executes a lightweight HEAD ping to probe edge connection health.
   * Enforces zero-ePHI (credentials omitted, headers sanitized, query parameters stripped).
   */
  public async probeNow(): Promise<ProbeSample> {
    const fetchImplementation = this.config.fetchFn || (typeof fetch !== "undefined" ? fetch : null);

    if (!fetchImplementation) {
      // In non-fetch environment without mock, record as simulated local failure
      return this.recordSample({
        timestamp: Date.now(),
        rtt: null,
        success: false,
        error: "Fetch implementation unavailable",
      });
    }

    const abortController = new AbortController();
    this.activeAbortController = abortController;

    let timeoutHandle: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      abortController.abort(new Error("Probe network timeout exceeded"));
    }, this.config.timeoutMs);

    if (
      timeoutHandle &&
      typeof timeoutHandle === "object" &&
      "unref" in timeoutHandle &&
      typeof (timeoutHandle as { unref: () => void }).unref === "function"
    ) {
      (timeoutHandle as { unref: () => void }).unref();
    }

    const startTime = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    try {
      // ZERO-ePHI HTTP probe:
      // - method: HEAD (lightweight header-only payload, no response body)
      // - credentials: omit (guarantees zero cookies, session IDs, or auth tokens are transmitted)
      // - cache: no-store (prevents browser/edge caching of probe round trips)
      // - headers: minimal cache control, strictly omitting Authorization or custom headers
      const response = await fetchImplementation(this.sanitizedEndpoint, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
        mode: "cors",
        referrerPolicy: "no-referrer",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        signal: abortController.signal,
      });

      const endTime = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
      const rtt = Math.max(0, Math.round(endTime - startTime));

      // 2xx, 3xx, and 405 (method not allowed if HEAD not explicitly mapped on edge) indicate network reachability
      const isReachable = (response.status >= 200 && response.status < 400) || response.status === 405;

      return this.recordSample({
        timestamp: Date.now(),
        rtt: isReachable ? rtt : null,
        success: isReachable,
        statusCode: response.status,
        error: isReachable ? undefined : `HTTP status ${response.status}`,
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && (err.name === "AbortError" || err.message.includes("timeout"));
      return this.recordSample({
        timestamp: Date.now(),
        rtt: null,
        success: false,
        error: isAbort ? "Probe timeout" : err instanceof Error ? err.message : "Network probe failed",
      });
    } finally {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null;
      }
    }
  }

  /**
   * Records a probe sample, computes sliding window metrics, and triggers dead-man switch if quality drops.
   */
  public recordSample(sample: ProbeSample): ProbeSample {
    this.totalProbes++;
    this.lastProbeTime = sample.timestamp || Date.now();

    this.samples.push(sample);
    if (this.samples.length > this.config.windowSize) {
      this.samples.shift();
    }

    if (sample.success && sample.rtt !== null) {
      this.consecutiveFailures = 0;
      this.currentRtt = sample.rtt;
    } else {
      this.failedProbes++;
      this.consecutiveFailures++;
      this.currentRtt = 0;
    }

    this.evaluateQualityState();
    return sample;
  }

  /**
   * Evaluates health metrics against thresholds and emits dead-man switch events when state transitions occur.
   */
  private evaluateQualityState(): void {
    const previousStatus = this.status;
    const newStatus = this.computeStatus();

    if (newStatus !== previousStatus) {
      this.status = newStatus;
      this.lastStatusChange = Date.now();

      const metrics = this.getMetrics();
      const isDeadManTriggered = newStatus === "degraded" || newStatus === "offline";

      const event: ConnectionQualityChangeEvent = {
        type: "connection-quality-changed",
        previousStatus,
        currentStatus: newStatus,
        metrics,
        isDeadManTriggered,
        timestamp: this.lastStatusChange,
      };

      // 1. Notify generic quality change subscribers
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch {
          // Swallow listener errors to protect heartbeat loop
        }
      }

      // 2. Dead-Man's Switch: Notify dedicated warning callbacks
      if (isDeadManTriggered) {
        for (const deadManListener of this.deadManListeners) {
          try {
            deadManListener(event);
          } catch {
            // Swallow listener errors
          }
        }
      }

      // 3. Dispatch browser CustomEvent for global component subscription if DOM is active
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function" &&
        typeof CustomEvent === "function"
      ) {
        try {
          window.dispatchEvent(new CustomEvent("connection-quality-changed", { detail: event }));
        } catch {
          // Ignore DOM dispatch issues in hybrid/test environments
        }
      }
    }
  }

  /**
   * Computes the connection status based on recent sliding window samples.
   */
  private computeStatus(): ConnectionStatus {
    // Check for offline: consecutive failed probes reaching threshold
    if (this.consecutiveFailures >= this.config.thresholds.offlineConsecutiveFailures) {
      return "offline";
    }

    // If no samples recorded yet, remain optimal
    if (this.samples.length === 0) {
      return "optimal";
    }

    const failedInWindow = this.samples.filter((s) => !s.success).length;
    const packetLossRate = failedInWindow / this.samples.length;

    const successfulSamples = this.samples.filter(
      (s): s is ProbeSample & { rtt: number } => s.success && typeof s.rtt === "number"
    );

    const averageRtt =
      successfulSamples.length > 0
        ? Math.round(successfulSamples.reduce((acc, s) => acc + s.rtt, 0) / successfulSamples.length)
        : 0;

    // Check degraded: high packet loss or high average RTT
    if (
      packetLossRate >= this.config.thresholds.degradedLossRate ||
      (successfulSamples.length > 0 && averageRtt >= this.config.thresholds.degradedRttMs)
    ) {
      return "degraded";
    }

    // Check jitter: high variance between consecutive pings
    const jitter = calculateJitter(this.samples);
    if (successfulSamples.length >= 2 && jitter >= this.config.thresholds.jitterMs) {
      return "jitter";
    }

    return "optimal";
  }

  /**
   * Retrieves a snapshot of current connection metrics.
   */
  public getMetrics(): ConnectionMetrics {
    const failedInWindow = this.samples.filter((s) => !s.success).length;
    const packetLossRate = this.samples.length > 0 ? failedInWindow / this.samples.length : 0;

    const successfulSamples = this.samples.filter(
      (s): s is ProbeSample & { rtt: number } => s.success && typeof s.rtt === "number"
    );

    const averageRtt =
      successfulSamples.length > 0
        ? Math.round(successfulSamples.reduce((acc, s) => acc + s.rtt, 0) / successfulSamples.length)
        : 0;

    const jitter = calculateJitter(this.samples);

    return {
      status: this.status,
      currentRtt: this.currentRtt,
      averageRtt,
      jitter,
      packetLossRate,
      totalProbes: this.totalProbes,
      failedProbes: this.failedProbes,
      consecutiveFailures: this.consecutiveFailures,
      lastProbeTime: this.lastProbeTime,
      lastStatusChange: this.lastStatusChange,
    };
  }

  /**
   * Returns true if connection is degraded or offline (dead-man switch condition).
   */
  public isDegradedOrOffline(): boolean {
    return this.status === "degraded" || this.status === "offline";
  }

  /**
   * Subscribes a listener to 'connection-quality-changed' events.
   * Returns an unsubscribe function.
   */
  public on(event: "connection-quality-changed", listener: ConnectionQualityListener): () => void {
    if (event === "connection-quality-changed") {
      this.listeners.add(listener);
    }
    return () => this.off(event, listener);
  }

  /**
   * Removes a subscribed listener.
   */
  public off(event: "connection-quality-changed", listener: ConnectionQualityListener): void {
    if (event === "connection-quality-changed") {
      this.listeners.delete(listener);
    }
  }

  /**
   * Subscribes specifically to dead-man switch warning events (degraded or offline).
   * Returns an unsubscribe function.
   */
  public onDeadMan(listener: ConnectionQualityListener): () => void {
    this.deadManListeners.add(listener);
    return () => {
      this.deadManListeners.delete(listener);
    };
  }

  /**
   * Resets all internal state and sliding window buffers.
   */
  public reset(): void {
    this.stop();
    this.samples.length = 0;
    this.listeners.clear();
    this.deadManListeners.clear();
    this.status = "optimal";
    this.currentRtt = 0;
    this.consecutiveFailures = 0;
    this.totalProbes = 0;
    this.failedProbes = 0;
    this.lastProbeTime = null;
    this.lastStatusChange = Date.now();
  }
}

// Global active monitor reference
let globalHeartbeatInstance: TelemetryHeartbeat | null = null;

/**
 * Starts the global client-side telemetry heartbeat monitor.
 */
export function startHeartbeatMonitor(config?: Partial<HeartbeatConfig>): TelemetryHeartbeat {
  if (globalHeartbeatInstance) {
    globalHeartbeatInstance.stop();
  }
  globalHeartbeatInstance = new TelemetryHeartbeat(config);
  globalHeartbeatInstance.start();
  return globalHeartbeatInstance;
}

/**
 * Stops the global client-side telemetry heartbeat monitor and cleans up timers.
 */
export function stopHeartbeatMonitor(): void {
  if (globalHeartbeatInstance) {
    globalHeartbeatInstance.stop();
    globalHeartbeatInstance = null;
  }
}

/**
 * Retrieves connection metrics from the active global monitor.
 * Returns default optimal metrics if no monitor is running.
 */
export function getConnectionMetrics(): ConnectionMetrics {
  if (globalHeartbeatInstance) {
    return globalHeartbeatInstance.getMetrics();
  }

  return {
    status: "optimal",
    currentRtt: 0,
    averageRtt: 0,
    jitter: 0,
    packetLossRate: 0,
    totalProbes: 0,
    failedProbes: 0,
    consecutiveFailures: 0,
    lastProbeTime: null,
    lastStatusChange: Date.now(),
  };
}

/**
 * Helper to reset global instance between tests.
 */
export function resetGlobalHeartbeatMonitor(): void {
  if (globalHeartbeatInstance) {
    globalHeartbeatInstance.reset();
    globalHeartbeatInstance = null;
  }
}
