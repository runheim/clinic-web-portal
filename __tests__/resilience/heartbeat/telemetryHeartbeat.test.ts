import {
  TelemetryHeartbeat,
  startHeartbeatMonitor,
  stopHeartbeatMonitor,
  getConnectionMetrics,
  resetGlobalHeartbeatMonitor,
  sanitizeProbeUrl,
  calculateJitter,
  ProbeSample,
  ConnectionQualityChangeEvent,
} from "@/lib/resilience/heartbeat/telemetryHeartbeat";

describe("Agent 13: Client-Side Telemetry Dead-Man's Switch & Connection Health Battery", () => {
  beforeEach(() => {
    resetGlobalHeartbeatMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetGlobalHeartbeatMonitor();
    jest.useRealTimers();
  });

  describe("Zero-ePHI Endpoint Sanitization & Jitter Math", () => {
    test("sanitizeProbeUrl aggressively strips query strings, auth credentials, and fragments", () => {
      // Strips query parameters containing mock ePHI
      expect(
        sanitizeProbeUrl("/api/health?patient_id=PT-98765&mrn=12345&token=secret")
      ).toBe("/api/health");

      // Strips hash fragments
      expect(sanitizeProbeUrl("/api/ping#section-summary")).toBe("/api/ping");

      // Strips credentials and query from absolute URLs
      expect(
        sanitizeProbeUrl("https://admin:supersecret@edge.clinic.internal/api/telemetry?patient=jane")
      ).toBe("https://edge.clinic.internal/api/telemetry");

      // Default fallback for empty or non-string inputs
      expect(sanitizeProbeUrl("")).toBe("/api/health");
      expect(sanitizeProbeUrl("   ")).toBe("/api/health");
    });

    test("calculateJitter accurately computes Mean Absolute Deviation across consecutive RTT samples", () => {
      // 0 or 1 sample returns 0
      expect(calculateJitter([])).toBe(0);
      expect(calculateJitter([{ timestamp: 1, rtt: 45, success: true }])).toBe(0);

      // Failed samples (rtt: null) are excluded from jitter calculation
      const samplesWithFailures: ProbeSample[] = [
        { timestamp: 1, rtt: 100, success: true },
        { timestamp: 2, rtt: null, success: false },
        { timestamp: 3, rtt: 150, success: true },
        { timestamp: 4, rtt: 120, success: true },
      ];
      // Consecutive successful RTTs: 100, 150, 120
      // Diff 1: |150 - 100| = 50
      // Diff 2: |120 - 150| = 30
      // Mean difference: (50 + 30) / 2 = 40
      expect(calculateJitter(samplesWithFailures)).toBe(40);

      // Constant latency has 0 jitter
      const constantSamples: ProbeSample[] = [
        { timestamp: 1, rtt: 35, success: true },
        { timestamp: 2, rtt: 35, success: true },
        { timestamp: 3, rtt: 35, success: true },
      ];
      expect(calculateJitter(constantSamples)).toBe(0);
    });
  });

  describe("Lightweight HEAD Probe & Zero-ePHI Transmission", () => {
    test("Executes lightweight HEAD request with credentials omitted and no-store headers", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        status: 200,
        headers: new Headers(),
      });

      const heartbeat = new TelemetryHeartbeat({
        endpoint: "/api/health?patientId=confidential",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const sample = await heartbeat.probeNow();

      expect(sample.success).toBe(true);
      expect(typeof sample.rtt).toBe("number");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
      // URL must be sanitized with zero query params
      expect(calledUrl).toBe("/api/health");
      expect(calledOptions.method).toBe("HEAD");
      expect(calledOptions.credentials).toBe("omit");
      expect(calledOptions.cache).toBe("no-store");
      expect(calledOptions.mode).toBe("cors");
      expect(calledOptions.referrerPolicy).toBe("no-referrer");

      // Headers must not contain credentials or authorization
      const headers = calledOptions.headers;
      expect(headers["Cache-Control"]).toBe("no-cache, no-store, must-revalidate");
      expect(headers["Authorization"]).toBeUndefined();
      expect(headers["Cookie"]).toBeUndefined();
    });

    test("Handles HTTP 405 Method Not Allowed as reachable edge host", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        status: 405,
      });

      const heartbeat = new TelemetryHeartbeat({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const sample = await heartbeat.probeNow();
      expect(sample.success).toBe(true);
      expect(sample.statusCode).toBe(405);
    });

    test("Records network error or timeout as failed probe sample", async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error("Failed to fetch"));

      const heartbeat = new TelemetryHeartbeat({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const sample = await heartbeat.probeNow();
      expect(sample.success).toBe(false);
      expect(sample.rtt).toBeNull();
      expect(sample.error).toContain("Failed to fetch");

      const metrics = heartbeat.getMetrics();
      expect(metrics.totalProbes).toBe(1);
      expect(metrics.failedProbes).toBe(1);
      expect(metrics.consecutiveFailures).toBe(1);
    });
  });

  describe("Jitter Tracking & State Transitions", () => {
    test("Transitions to 'jitter' state when variance exceeds threshold without degraded latency", () => {
      const heartbeat = new TelemetryHeartbeat({
        windowSize: 5,
        thresholds: {
          degradedRttMs: 300,
          jitterMs: 40,
          degradedLossRate: 0.2,
          offlineConsecutiveFailures: 3,
        },
      });

      // Sample 1: 50ms
      heartbeat.recordSample({ timestamp: 1, rtt: 50, success: true });
      expect(heartbeat.getMetrics().status).toBe("optimal");

      // Sample 2: 120ms (diff: 70ms > 40ms jitter threshold, avg = 85ms < 300ms)
      heartbeat.recordSample({ timestamp: 2, rtt: 120, success: true });
      const metrics = heartbeat.getMetrics();
      expect(metrics.jitter).toBe(70);
      expect(metrics.averageRtt).toBe(85);
      expect(metrics.status).toBe("jitter");
    });
  });

  describe("Degraded Connection & Dead-Man's Switch Trigger", () => {
    test("Trips to 'degraded' when average RTT exceeds threshold", () => {
      const heartbeat = new TelemetryHeartbeat({
        windowSize: 3,
        thresholds: {
          degradedRttMs: 250,
          jitterMs: 100,
          degradedLossRate: 0.5,
          offlineConsecutiveFailures: 3,
        },
      });

      heartbeat.recordSample({ timestamp: 1, rtt: 280, success: true });
      heartbeat.recordSample({ timestamp: 2, rtt: 310, success: true });

      const metrics = heartbeat.getMetrics();
      expect(metrics.averageRtt).toBe(295);
      expect(metrics.status).toBe("degraded");
      expect(heartbeat.isDegradedOrOffline()).toBe(true);
    });

    test("Trips to 'degraded' when packet loss rate exceeds threshold", () => {
      const heartbeat = new TelemetryHeartbeat({
        windowSize: 4,
        thresholds: {
          degradedRttMs: 500,
          jitterMs: 100,
          degradedLossRate: 0.25, // 25%
          offlineConsecutiveFailures: 3,
        },
      });

      heartbeat.recordSample({ timestamp: 1, rtt: 40, success: true });
      heartbeat.recordSample({ timestamp: 2, rtt: null, success: false }); // 1 failure out of 2 = 50% loss

      const metrics = heartbeat.getMetrics();
      expect(metrics.packetLossRate).toBe(0.5);
      expect(metrics.status).toBe("degraded");
    });

    test("Dead-man's switch: fires 'connection-quality-changed' and ephemeral callback on degradation", () => {
      const eventsDispatched: ConnectionQualityChangeEvent[] = [];
      const deadManAlerts: ConnectionQualityChangeEvent[] = [];

      const heartbeat = new TelemetryHeartbeat({
        windowSize: 5,
        thresholds: {
          degradedRttMs: 200,
          jitterMs: 50,
          degradedLossRate: 0.2,
          offlineConsecutiveFailures: 3,
        },
        onQualityChange: (e) => eventsDispatched.push(e),
        onDeadManTrigger: (e) => deadManAlerts.push(e),
      });

      // Subscription via .on()
      const customListener = jest.fn();
      const unsubscribe = heartbeat.on("connection-quality-changed", customListener);

      // Start with optimal
      heartbeat.recordSample({ timestamp: 1, rtt: 50, success: true });
      expect(eventsDispatched).toHaveLength(0); // Initial status was already optimal

      // Inject high latency causing 'degraded'
      heartbeat.recordSample({ timestamp: 2, rtt: 400, success: true });

      expect(eventsDispatched).toHaveLength(1);
      expect(eventsDispatched[0].currentStatus).toBe("degraded");
      expect(eventsDispatched[0].previousStatus).toBe("optimal");
      expect(eventsDispatched[0].isDeadManTriggered).toBe(true);

      // Dedicated dead-man callback was also triggered
      expect(deadManAlerts).toHaveLength(1);
      expect(deadManAlerts[0].isDeadManTriggered).toBe(true);
      expect(customListener).toHaveBeenCalledWith(eventsDispatched[0]);

      // Unsubscribe test
      unsubscribe();
      heartbeat.recordSample({ timestamp: 3, rtt: 450, success: true });
      // Status didn't change (still degraded), customListener not called again
      expect(customListener).toHaveBeenCalledTimes(1);
    });

    test("Dispatches DOM window CustomEvent if window environment is active", () => {
      const windowEventSpy = jest.fn();
      const originalWindow = global.window;

      // Mock window dispatchEvent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {
        dispatchEvent: windowEventSpy,
      };

      try {
        const heartbeat = new TelemetryHeartbeat({
          thresholds: {
            degradedRttMs: 100,
            jitterMs: 50,
            degradedLossRate: 0.2,
            offlineConsecutiveFailures: 3,
          },
        });

        heartbeat.recordSample({ timestamp: 1, rtt: 250, success: true });

        expect(windowEventSpy).toHaveBeenCalledTimes(1);
        const dispatchedEvent = windowEventSpy.mock.calls[0][0];
        expect(dispatchedEvent.type).toBe("connection-quality-changed");
        expect(dispatchedEvent.detail.currentStatus).toBe("degraded");
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).window = originalWindow;
      }
    });
  });

  describe("Offline Event Firing & Recovery", () => {
    test("Transitions to 'offline' on consecutive failures and recovers to 'optimal'", () => {
      const qualityEvents: ConnectionQualityChangeEvent[] = [];
      const heartbeat = new TelemetryHeartbeat({
        windowSize: 5,
        thresholds: {
          degradedRttMs: 300,
          jitterMs: 50,
          degradedLossRate: 0.2,
          offlineConsecutiveFailures: 3,
        },
        onQualityChange: (e) => qualityEvents.push(e),
      });

      // 1st failure -> degraded due to loss rate (1/1 = 100%)
      heartbeat.recordSample({ timestamp: 1, rtt: null, success: false });
      expect(heartbeat.getMetrics().status).toBe("degraded");

      // 2nd failure -> still degraded (2/2 = 100%)
      heartbeat.recordSample({ timestamp: 2, rtt: null, success: false });
      expect(heartbeat.getMetrics().status).toBe("degraded");

      // 3rd consecutive failure -> trips offline!
      heartbeat.recordSample({ timestamp: 3, rtt: null, success: false });
      expect(heartbeat.getMetrics().status).toBe("offline");
      expect(heartbeat.getMetrics().consecutiveFailures).toBe(3);

      const latestEvent = qualityEvents[qualityEvents.length - 1];
      expect(latestEvent.currentStatus).toBe("offline");
      expect(latestEvent.isDeadManTriggered).toBe(true);

      // Recovery: Flush sliding window (size 5) with consecutive healthy pings
      for (let i = 4; i <= 9; i++) {
        heartbeat.recordSample({ timestamp: i, rtt: 40, success: true });
      }

      expect(heartbeat.getMetrics().status).toBe("optimal");
      expect(heartbeat.getMetrics().consecutiveFailures).toBe(0);
      expect(heartbeat.getMetrics().packetLossRate).toBe(0);
      expect(heartbeat.isDegradedOrOffline()).toBe(false);
    });
  });

  describe("Timer Cleanup & Zero Open Handles", () => {
    test("Timer cleans up properly and stops heartbeat", () => {
      jest.useFakeTimers();
      const mockFetch = jest.fn().mockResolvedValue({ status: 200 });

      const heartbeat = new TelemetryHeartbeat({
        intervalMs: 30000,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      heartbeat.start();
      expect(heartbeat.isRunning()).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Immediate probe

      // Advance 30 seconds
      jest.advanceTimersByTime(30000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Stop monitor
      heartbeat.stop();
      expect(heartbeat.isRunning()).toBe(false);

      // Advance another 30 seconds, no new calls should happen
      jest.advanceTimersByTime(30000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test("Global startHeartbeatMonitor, stopHeartbeatMonitor, and getConnectionMetrics manage singleton", async () => {
      jest.useFakeTimers();
      const mockFetch = jest.fn().mockResolvedValue({ status: 200 });

      const initialMetrics = getConnectionMetrics();
      expect(initialMetrics.status).toBe("optimal");
      expect(initialMetrics.totalProbes).toBe(0);

      const monitor = startHeartbeatMonitor({
        intervalMs: 15000,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(monitor.isRunning()).toBe(true);

      // Allow immediate probe promise to resolve
      await Promise.resolve();
      await Promise.resolve();

      const runningMetrics = getConnectionMetrics();
      expect(runningMetrics.totalProbes).toBe(1);

      stopHeartbeatMonitor();
      expect(monitor.isRunning()).toBe(false);
    });

    test("Subscribing to onDeadMan works specifically for degraded states and unregisters cleanly", () => {
      const deadManSpy = jest.fn();
      const heartbeat = new TelemetryHeartbeat({
        thresholds: {
          degradedRttMs: 200,
          jitterMs: 50,
          degradedLossRate: 0.2,
          offlineConsecutiveFailures: 3,
        },
      });

      const unsub = heartbeat.onDeadMan(deadManSpy);

      // Normal ping
      heartbeat.recordSample({ timestamp: 1, rtt: 30, success: true });
      expect(deadManSpy).not.toHaveBeenCalled();

      // Trip degraded via high latency
      heartbeat.recordSample({ timestamp: 2, rtt: 400, success: true });
      expect(deadManSpy).toHaveBeenCalledTimes(1);
      expect(deadManSpy.mock.calls[0][0].currentStatus).toBe("degraded");

      // Unsubscribe
      unsub();
      heartbeat.recordSample({ timestamp: 3, rtt: null, success: false });
      heartbeat.recordSample({ timestamp: 4, rtt: null, success: false });
      heartbeat.recordSample({ timestamp: 5, rtt: null, success: false });

      // No new calls received after unsubscribe
      expect(deadManSpy).toHaveBeenCalledTimes(1);
    });

    test("Escalating from degraded to offline triggers onDeadMan on each transition", () => {
      const deadManSpy = jest.fn();
      const heartbeat = new TelemetryHeartbeat({
        thresholds: {
          degradedRttMs: 200,
          jitterMs: 50,
          degradedLossRate: 0.2,
          offlineConsecutiveFailures: 2,
        },
      });
      heartbeat.onDeadMan(deadManSpy);

      // Healthy
      heartbeat.recordSample({ timestamp: 1, rtt: 30, success: true });
      expect(deadManSpy).not.toHaveBeenCalled();

      // First failure trips degraded
      heartbeat.recordSample({ timestamp: 2, rtt: null, success: false });
      expect(deadManSpy).toHaveBeenCalledTimes(1);
      expect(deadManSpy.mock.calls[0][0].currentStatus).toBe("degraded");

      // Second failure trips offline
      heartbeat.recordSample({ timestamp: 3, rtt: null, success: false });
      expect(deadManSpy).toHaveBeenCalledTimes(2);
      expect(deadManSpy.mock.calls[1][0].currentStatus).toBe("offline");
    });

    test("Reset clears all state and sample buffers", () => {
      const heartbeat = new TelemetryHeartbeat();
      heartbeat.recordSample({ timestamp: 1, rtt: 50, success: true });
      expect(heartbeat.getMetrics().totalProbes).toBe(1);

      heartbeat.reset();
      const metrics = heartbeat.getMetrics();
      expect(metrics.totalProbes).toBe(0);
      expect(metrics.status).toBe("optimal");
      expect(heartbeat.isRunning()).toBe(false);
    });
  });
});
