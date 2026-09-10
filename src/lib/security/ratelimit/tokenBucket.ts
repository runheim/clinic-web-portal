/**
 * COGNITIVE EDGE CLINIC — SECURITY ENGINE
 * Edge-Compatible In-Memory Token Bucket Rate Limiter
 *
 * Implements strict per-IP burst throttling:
 * - Webhook endpoints: Max 5 requests/min per IP
 * - Auth routes: Max 10 requests/min per IP
 * - Contact endpoints: Max 5 requests/min per IP
 * - Default routes: Max 60 requests/min per IP (configurable)
 *
 * Key features:
 * - Token bucket algorithm with continuous fractional refill
 * - Accurate Retry-After header calculations (RFC 6585 / RFC 7231)
 * - Independent per-IP and per-route bucket isolation
 * - Periodic bucket eviction for stale IPs (>1 hour) to prevent memory leaks
 * - Zero open handles: fully edge-runtime compatible, unref'd or lazy timer sweeps
 */

export type RouteCategory = "webhook" | "auth" | "contact" | "default";

export interface RateLimitConfig {
  /** Maximum burst capacity (tokens) */
  capacity: number;
  /** Refill rate in tokens per minute */
  refillRatePerMinute: number;
  /** Sliding window duration in milliseconds (default: 60,000ms) */
  windowMs?: number;
}

export interface RateLimitOptions {
  /** Route category or endpoint path (e.g. 'webhook', 'auth', '/api/webhooks/calcom') */
  route?: string;
  /** Custom bucket capacity */
  capacity?: number;
  /** Custom refill rate in tokens per minute */
  refillRatePerMinute?: number;
  /** Custom window size in milliseconds */
  windowMs?: number;
  /** Tokens to consume for this request (default: 1) */
  cost?: number;
  /** Explicit timestamp in epoch ms (for testing and simulation) */
  now?: number;
}

export interface RateLimitResult {
  /** Whether the request is permitted */
  allowed: boolean;
  /** Integer count of remaining tokens in bucket */
  remainingTokens: number;
  /** Retry-After in integer seconds when rate limited (RFC 6585 / RFC 7231) */
  retryAfterSeconds?: number;
  /** Epoch millisecond timestamp when the bucket resets to full capacity */
  resetTime: number;
}

export interface RateLimitMetrics {
  /** Total number of active tracked buckets */
  totalTrackedBuckets: number;
  /** Total number of rate limit checks performed */
  totalChecks: number;
  /** Total number of allowed requests */
  totalAllowed: number;
  /** Total number of blocked (throttled) requests */
  totalBlocked: number;
  /** Total number of stale buckets evicted */
  evictedBucketsCount: number;
  /** Breakdown of active buckets grouped by route key */
  bucketsByRoute: Record<string, number>;
}

interface BucketState {
  tokens: number;
  lastRefillTime: number;
  lastAccessTime: number;
  capacity: number;
  refillRatePerMs: number;
  routeKey: string;
  ip: string;
}

/**
 * Predefined default rate limit configurations per route category.
 */
export const DEFAULT_LIMIT_CONFIGS: Record<RouteCategory, RateLimitConfig> = {
  webhook: { capacity: 5, refillRatePerMinute: 5, windowMs: 60_000 },
  auth: { capacity: 10, refillRatePerMinute: 10, windowMs: 60_000 },
  contact: { capacity: 5, refillRatePerMinute: 5, windowMs: 60_000 },
  default: { capacity: 60, refillRatePerMinute: 60, windowMs: 60_000 },
};

/** Stale bucket threshold: 1 hour of inactivity */
export const STALE_BUCKET_TTL_MS = 60 * 60 * 1000; // 3,600,000 ms

/** Default periodic eviction interval */
export const EVICTION_INTERVAL_MS = 60 * 1000; // 60,000 ms

// Internal storage & counters
const buckets = new Map<string, BucketState>();
const customRouteConfigs = new Map<string, RateLimitConfig>();

let totalChecks = 0;
let totalAllowed = 0;
let totalBlocked = 0;
let evictedBucketsCount = 0;
let lastPeriodicEvictionTime = 0;
let backgroundTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Normalizes and categorizes a route string.
 */
export function resolveRouteCategory(route?: string): RouteCategory {
  if (!route) return "default";
  const lower = route.toLowerCase();
  if (lower.includes("webhook")) return "webhook";
  if (lower.includes("auth") || lower.includes("login") || lower.includes("session")) return "auth";
  if (lower.includes("contact") || lower.includes("spruce")) return "contact";
  return "default";
}

/**
 * Resolves the route key used for bucket grouping and configuration lookup.
 */
export function resolveRouteKey(route?: string): string {
  if (!route) return "default";
  if (customRouteConfigs.has(route)) return route;
  const category = resolveRouteCategory(route);
  if (category !== "default") return category;
  return route.trim() || "default";
}

/**
 * Resolves configuration for a specific route key and optional overrides.
 */
export function resolveConfig(routeKey: string, options?: RateLimitOptions): Required<RateLimitConfig> {
  const baseConfig: RateLimitConfig =
    customRouteConfigs.get(routeKey) ??
    DEFAULT_LIMIT_CONFIGS[routeKey as RouteCategory] ??
    DEFAULT_LIMIT_CONFIGS.default;

  const capacity = options?.capacity ?? baseConfig.capacity;
  const refillRatePerMinute = options?.refillRatePerMinute ?? baseConfig.refillRatePerMinute;
  const windowMs = options?.windowMs ?? baseConfig.windowMs ?? 60_000;

  return {
    capacity: Math.max(1, capacity),
    refillRatePerMinute: Math.max(0.0001, refillRatePerMinute),
    windowMs: Math.max(100, windowMs),
  };
}

/**
 * Evicts buckets that have not been accessed for longer than the specified threshold.
 *
 * @param staleThresholdMs Threshold in milliseconds (defaults to 1 hour).
 * @param now Current timestamp in epoch milliseconds.
 * @returns Number of evicted stale buckets.
 */
export function evictStaleBuckets(
  staleThresholdMs: number = STALE_BUCKET_TTL_MS,
  now: number = Date.now()
): number {
  let evicted = 0;
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastAccessTime > staleThresholdMs) {
      buckets.delete(key);
      evicted++;
    }
  }
  evictedBucketsCount += evicted;
  return evicted;
}

/**
 * Internal helper to run periodic eviction lazily on incoming requests.
 */
function runLazyEviction(now: number): void {
  if (lastPeriodicEvictionTime === 0) {
    lastPeriodicEvictionTime = now;
    return;
  }
  if (now - lastPeriodicEvictionTime >= EVICTION_INTERVAL_MS) {
    evictStaleBuckets(STALE_BUCKET_TTL_MS, now);
    lastPeriodicEvictionTime = now;
  }
}

/**
 * Starts an optional periodic background eviction timer.
 * Note: uses `timer.unref()` in Node.js environments to prevent open handle leaks.
 */
export function startPeriodicEviction(intervalMs: number = EVICTION_INTERVAL_MS): void {
  stopPeriodicEviction();
  backgroundTimer = setInterval(() => {
    evictStaleBuckets(STALE_BUCKET_TTL_MS, Date.now());
  }, intervalMs);

  if (backgroundTimer && typeof backgroundTimer.unref === "function") {
    backgroundTimer.unref();
  }
}

/**
 * Stops any active background eviction timer.
 */
export function stopPeriodicEviction(): void {
  if (backgroundTimer !== null) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;
  }
}

/**
 * Configures or overrides limits for a specific route.
 */
export function configureRouteLimit(route: string, config: Partial<RateLimitConfig>): void {
  const current = customRouteConfigs.get(route) ??
    DEFAULT_LIMIT_CONFIGS[route as RouteCategory] ??
    DEFAULT_LIMIT_CONFIGS.default;

  customRouteConfigs.set(route, {
    capacity: config.capacity ?? current.capacity,
    refillRatePerMinute: config.refillRatePerMinute ?? current.refillRatePerMinute,
    windowMs: config.windowMs ?? current.windowMs ?? 60_000,
  });
}

/**
 * Checks and evaluates the rate limit for a given IP address and route.
 *
 * @param ipOrOptions Client IP address string or options object containing `ip`.
 * @param routeOrOptions Route identifier string or RateLimitOptions.
 * @param customOptions Additional options when route is passed as second argument.
 * @returns RateLimitResult with `allowed`, `remainingTokens`, `retryAfterSeconds`, and `resetTime`.
 */
export function checkRateLimit(
  ipOrOptions: string | ({ ip: string } & RateLimitOptions),
  routeOrOptions?: string | RateLimitOptions,
  customOptions?: RateLimitOptions
): RateLimitResult {
  let ip: string;
  let options: RateLimitOptions = {};

  if (typeof ipOrOptions === "object" && ipOrOptions !== null) {
    ip = ipOrOptions.ip;
    options = { ...ipOrOptions };
  } else {
    ip = ipOrOptions;
    if (typeof routeOrOptions === "string") {
      options = { route: routeOrOptions, ...customOptions };
    } else if (typeof routeOrOptions === "object" && routeOrOptions !== null) {
      options = { ...routeOrOptions, ...customOptions };
    } else if (customOptions) {
      options = { ...customOptions };
    }
  }

  const cleanIp = (ip || "unknown").trim();
  const now = options.now ?? Date.now();

  // Lazy eviction check for stale entries
  runLazyEviction(now);

  const routeKey = resolveRouteKey(options.route);
  const config = resolveConfig(routeKey, options);
  const refillRatePerMs = config.refillRatePerMinute / config.windowMs;
  const cost = Math.max(1, options.cost ?? 1);

  const bucketKey = `${routeKey}:${cleanIp}`;
  let bucket = buckets.get(bucketKey);

  if (!bucket) {
    // Initialize new bucket with full capacity
    bucket = {
      tokens: config.capacity,
      lastRefillTime: now,
      lastAccessTime: now,
      capacity: config.capacity,
      refillRatePerMs,
      routeKey,
      ip: cleanIp,
    };
    buckets.set(bucketKey, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsedMs = Math.max(0, now - bucket.lastRefillTime);
    if (elapsedMs > 0) {
      const tokensToAdd = elapsedMs * bucket.refillRatePerMs;
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefillTime = now;
    }
    bucket.lastAccessTime = now;
    // Synchronize capacity & rate if updated
    bucket.capacity = config.capacity;
    bucket.refillRatePerMs = refillRatePerMs;
  }

  totalChecks++;

  if (bucket.tokens >= cost) {
    // Request allowed
    bucket.tokens -= cost;
    totalAllowed++;

    const remainingTokens = Math.floor(bucket.tokens);
    const timeToFullMs = bucket.tokens >= bucket.capacity
      ? 0
      : (bucket.capacity - bucket.tokens) / bucket.refillRatePerMs;
    const resetTime = now + Math.ceil(timeToFullMs);

    return {
      allowed: true,
      remainingTokens,
      resetTime,
    };
  } else {
    // Request blocked / throttled
    totalBlocked++;

    const remainingTokens = Math.max(0, Math.floor(bucket.tokens));
    const tokensNeeded = cost - bucket.tokens;
    const msNeeded = tokensNeeded / bucket.refillRatePerMs;
    const retryAfterSeconds = Math.max(1, Math.ceil(msNeeded / 1000));

    const timeToFullMs = (bucket.capacity - bucket.tokens) / bucket.refillRatePerMs;
    const resetTime = now + Math.ceil(timeToFullMs);

    return {
      allowed: false,
      remainingTokens,
      retryAfterSeconds,
      resetTime,
    };
  }
}

/**
 * Resets rate limit tracking.
 * If an IP is provided, only buckets belonging to that IP are deleted.
 * If omitted, all buckets and metrics are reset.
 *
 * @param ip Optional IP address to target for reset.
 */
export function resetRateLimits(ip?: string): void {
  if (!ip) {
    buckets.clear();
    customRouteConfigs.clear();
    totalChecks = 0;
    totalAllowed = 0;
    totalBlocked = 0;
    evictedBucketsCount = 0;
    lastPeriodicEvictionTime = 0;
    stopPeriodicEviction();
    return;
  }

  const targetIp = ip.trim();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.ip === targetIp || key.endsWith(`:${targetIp}`)) {
      buckets.delete(key);
    }
  }
}

/**
 * Returns diagnostic and telemetry metrics for the rate limiter.
 */
export function getRateLimitMetrics(): RateLimitMetrics {
  const bucketsByRoute: Record<string, number> = {};
  for (const bucket of buckets.values()) {
    bucketsByRoute[bucket.routeKey] = (bucketsByRoute[bucket.routeKey] ?? 0) + 1;
  }

  return {
    totalTrackedBuckets: buckets.size,
    totalChecks,
    totalAllowed,
    totalBlocked,
    evictedBucketsCount,
    bucketsByRoute,
  };
}
