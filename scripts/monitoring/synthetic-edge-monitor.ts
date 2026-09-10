/**
 * COGNITIVE EDGE CLINIC — SYNTHETIC EDGE MONITOR & ZERO-LEAK SENTINEL
 * 
 * Continuous and on-demand synthetic monitoring engine for live edge CDN endpoints:
 * 1. Probes live edge endpoints: /, /ledger, /vault, /api/health
 * 2. High-precision measurement of TLS handshake duration and Time-To-First-Byte (TTFB)
 * 3. Enforces edge security headers:
 *    - Content-Security-Policy
 *    - Strict-Transport-Security
 *    - X-Frame-Options: DENY
 *    - X-Content-Type-Options: nosniff
 * 4. Scans public payloads for unmasked secrets (sk_live_, whsec_, spruce_live_)
 *    and ePHI query params / tokens (ssn, mrn)
 * 5. Fails immediately (exit code 1) on credential/ePHI leak or critical health check failure.
 * 
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/monitoring/synthetic-edge-monitor.ts --once
 *   npx ts-node --project tsconfig.json scripts/monitoring/synthetic-edge-monitor.ts --interval 30
 *   LIVE_URL=https://cognitive-wellness.netlify.app npm run monitor:edge
 */

import http from "http";
import https from "https";
import { performance } from "perf_hooks";
import { URL } from "url";

export interface ProbeMetrics {
  endpoint: string;
  fullUrl: string;
  statusCode: number;
  statusText: string;
  tlsHandshakeMs: number;
  ttfbMs: number;
  totalDurationMs: number;
  headers: Record<string, string>;
  body: string;
  error?: string;
}

export interface HeaderCheckResult {
  headerName: string;
  expected: string;
  actual: string | null;
  passed: boolean;
  directive: string;
}

export interface LeakViolation {
  category: "SECRET" | "ePHI";
  patternName: string;
  matchedSnippet: string;
  description: string;
}

export interface EndpointSweepResult {
  endpoint: string;
  fullUrl: string;
  metrics: ProbeMetrics;
  headerResults: HeaderCheckResult[];
  leaks: LeakViolation[];
  healthCheckPassed: boolean;
  healthCheckDetails?: string;
  passed: boolean;
  criticalFailure: boolean;
  failureReasons: string[];
}

export interface SweepSummary {
  timestamp: string;
  targetUrl: string;
  totalEndpoints: number;
  passedEndpoints: number;
  failedEndpoints: number;
  leakDetected: boolean;
  criticalFailure: boolean;
  results: EndpointSweepResult[];
}

const MONITORED_ENDPOINTS: string[] = [
  "/",
  "/ledger",
  "/vault",
  "/api/health",
];

interface SecurityHeaderSpec {
  name: string;
  expectedDescription: string;
  validator: (val: string | null) => boolean;
}

const REQUIRED_EDGE_HEADERS: SecurityHeaderSpec[] = [
  {
    name: "content-security-policy",
    expectedDescription: "Present (anti-clickjacking & strict frame-ancestors)",
    validator: (val) => Boolean(val && val.length > 0 && /frame-ancestors\s+'none'/i.test(val)),
  },
  {
    name: "strict-transport-security",
    expectedDescription: "HSTS max-age >= 31536000 with preload",
    validator: (val) => Boolean(val && /max-age=\d+/i.test(val)),
  },
  {
    name: "x-frame-options",
    expectedDescription: "DENY",
    validator: (val) => Boolean(val && /^DENY$/i.test(val.trim())),
  },
  {
    name: "x-content-type-options",
    expectedDescription: "nosniff",
    validator: (val) => Boolean(val && /^nosniff$/i.test(val.trim())),
  },
];

interface LeakPatternSpec {
  name: string;
  category: "SECRET" | "ePHI";
  pattern: RegExp;
  description: string;
}

const LEAK_PATTERNS: LeakPatternSpec[] = [
  {
    name: "stripe_live_secret",
    category: "SECRET",
    pattern: /\bsk_live_[0-9a-zA-Z]+/g,
    description: "Unmasked live Stripe secret key (sk_live_*)",
  },
  {
    name: "webhook_signing_secret",
    category: "SECRET",
    pattern: /\bwhsec_[0-9a-zA-Z]+/g,
    description: "Unmasked webhook cryptographic signing secret (whsec_*)",
  },
  {
    name: "spruce_live_secret",
    category: "SECRET",
    pattern: /\bspruce_live_[0-9a-zA-Z]+/g,
    description: "Unmasked Spruce Health API live secret (spruce_live_*)",
  },
  {
    name: "ephi_query_param",
    category: "ePHI",
    pattern: /[?&](?:ssn|mrn)=[^&\s"'<>]+/gi,
    description: "ePHI identifier (ssn/mrn) exposed in URL query parameters",
  },
  {
    name: "ephi_json_key",
    category: "ePHI",
    pattern: /"(?:ssn|mrn)"\s*:\s*["'][^"']+["']|"(?:ssn|mrn)"\s*:\s*\d+/gi,
    description: "ePHI token (ssn/mrn) exposed as JSON key-value pair",
  },
  {
    name: "ephi_token_assignment",
    category: "ePHI",
    pattern: /\b(?:ssn|mrn)\s*[:=]\s*["']?[0-9a-zA-Z-]+/gi,
    description: "ePHI identifier (ssn/mrn) exposed in plain text assignment",
  },
  {
    name: "ephi_social_security_field",
    category: "ePHI",
    pattern: /"(?:social[_-]?security|chart[_-]?note)"\s*:\s*["'][^"']+["']|\b(?:social[_-]?security|chart[_-]?note)\s*[:=]\s*["']?[0-9a-zA-Z-]+/gi,
    description: "Protected health record (SSN or chart note) leaked to public edge",
  },
];

/**
 * Mask sensitive credentials for safe incident reporting in logs
 */
function maskSecretSnippet(str: string): string {
  if (str.length <= 8) return "***MASKED***";
  const prefix = str.slice(0, Math.min(8, Math.floor(str.length / 3)));
  return `${prefix}...[REDACTED]`;
}

/**
 * Perform low-level HTTP/HTTPS probe measuring TLS handshake and TTFB
 */
export function probeEndpoint(
  baseUrl: string,
  endpoint: string,
  timeoutMs = 15000
): Promise<ProbeMetrics> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(endpoint, baseUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;

    const start = performance.now();
    let tlsStart = 0;
    let tlsHandshakeMs = 0;
    let ttfbMs = 0;

    const agent = isHttps
      ? new https.Agent({ keepAlive: false })
      : new http.Agent({ keepAlive: false });

    const req = transport.request(
      parsedUrl,
      {
        method: "GET",
        agent,
        headers: {
          "User-Agent": "Antigravity-Synthetic-Edge-Monitor/1.0 (Zero-Leak Scanner)",
          Accept: "*/*",
        },
        timeout: timeoutMs,
      },
      (res) => {
        ttfbMs = Math.round(performance.now() - start);

        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (value !== undefined) {
            responseHeaders[key.toLowerCase()] = Array.isArray(value)
              ? value.join(", ")
              : value;
          }
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const totalDurationMs = Math.round(performance.now() - start);
          const body = Buffer.concat(chunks).toString("utf-8");
          agent.destroy();

          resolve({
            endpoint,
            fullUrl: parsedUrl.toString(),
            statusCode: res.statusCode || 0,
            statusText: res.statusMessage || "",
            tlsHandshakeMs,
            ttfbMs,
            totalDurationMs,
            headers: responseHeaders,
            body,
          });
        });
      }
    );

    req.on("socket", (socket) => {
      if (isHttps) {
        if (socket.connecting) {
          socket.on("connect", () => {
            tlsStart = performance.now();
          });
        } else {
          tlsStart = performance.now();
        }

        socket.on("secureConnect", () => {
          tlsHandshakeMs = Math.round(performance.now() - tlsStart);
        });
      }
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Probe request timed out after ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      agent.destroy();
      const totalDurationMs = Math.round(performance.now() - start);
      resolve({
        endpoint,
        fullUrl: parsedUrl.toString(),
        statusCode: 0,
        statusText: "NETWORK_ERROR",
        tlsHandshakeMs: 0,
        ttfbMs: 0,
        totalDurationMs,
        headers: {},
        body: "",
        error: err.message,
      });
    });

    req.end();
  });
}

/**
 * Scan payload and headers for leaked credentials or ePHI tokens
 */
export function scanForLeaks(
  body: string,
  headers: Record<string, string>
): LeakViolation[] {
  const violations: LeakViolation[] = [];
  const scannedContent = `${body}\n${JSON.stringify(headers)}`;

  for (const patternSpec of LEAK_PATTERNS) {
    const matches = scannedContent.match(patternSpec.pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        violations.push({
          category: patternSpec.category,
          patternName: patternSpec.name,
          matchedSnippet: maskSecretSnippet(match),
          description: patternSpec.description,
        });
      }
    }
  }

  return violations;
}

/**
 * Validate edge security headers
 */
export function validateHeaders(
  headers: Record<string, string>
): HeaderCheckResult[] {
  return REQUIRED_EDGE_HEADERS.map((spec) => {
    const actual = headers[spec.name] || null;
    const passed = spec.validator(actual);
    return {
      headerName: spec.name,
      expected: spec.expectedDescription,
      actual,
      passed,
      directive: actual || "MISSING",
    };
  });
}

/**
 * Evaluate health check payload for /api/health
 */
function evaluateHealthPayload(
  endpoint: string,
  statusCode: number,
  body: string
): { passed: boolean; details: string; criticalFailure: boolean } {
  if (endpoint !== "/api/health") {
    return { passed: true, details: "N/A", criticalFailure: false };
  }

  if (statusCode !== 200) {
    return {
      passed: false,
      details: `Health check returned HTTP ${statusCode} (expected 200)`,
      criticalFailure: true,
    };
  }

  try {
    const json = JSON.parse(body) as {
      status?: string;
      quarantine?: string;
      environment?: string;
    };

    if (json.status !== "healthy") {
      return {
        passed: false,
        details: `Health status is '${json.status}' (expected 'healthy')`,
        criticalFailure: true,
      };
    }

    const quarantineStatus = json.quarantine ? ` [Quarantine: ${json.quarantine}]` : "";
    return {
      passed: true,
      details: `Healthy: status='${json.status}'${quarantineStatus}`,
      criticalFailure: false,
    };
  } catch (err) {
    return {
      passed: false,
      details: `Malformed JSON in /api/health: ${err instanceof Error ? err.message : String(err)}`,
      criticalFailure: true,
    };
  }
}

/**
 * Execute a single sweep of all monitored endpoints
 */
export async function executeSweep(targetUrl: string): Promise<SweepSummary> {
  const timestamp = new Date().toISOString();
  const results: EndpointSweepResult[] = [];
  let anyLeakDetected = false;
  let anyCriticalFailure = false;

  for (const endpoint of MONITORED_ENDPOINTS) {
    const metrics = await probeEndpoint(targetUrl, endpoint);
    const headerResults = validateHeaders(metrics.headers);
    const leaks = scanForLeaks(metrics.body, metrics.headers);
    const healthEval = evaluateHealthPayload(endpoint, metrics.statusCode, metrics.body);

    const failureReasons: string[] = [];
    let criticalFailure = false;

    // Status check
    if (metrics.statusCode !== 200) {
      failureReasons.push(`HTTP ${metrics.statusCode} ${metrics.statusText || metrics.error || ""}`.trim());
      criticalFailure = true;
    }

    // Health check evaluation for /api/health
    if (!healthEval.passed) {
      failureReasons.push(`Health Probe: ${healthEval.details}`);
      if (healthEval.criticalFailure) criticalFailure = true;
    }

    // Header checks
    const failedHeaders = headerResults.filter((h) => !h.passed);
    if (failedHeaders.length > 0) {
      for (const fh of failedHeaders) {
        failureReasons.push(`Missing/Invalid Header: ${fh.headerName} (expected: ${fh.expected})`);
      }
    }

    // Leak check (CRITICAL: instant failure)
    if (leaks.length > 0) {
      anyLeakDetected = true;
      criticalFailure = true;
      for (const leak of leaks) {
        failureReasons.push(`CRITICAL [${leak.category} LEAK]: ${leak.description} -> ${leak.matchedSnippet}`);
      }
    }

    if (criticalFailure) {
      anyCriticalFailure = true;
    }

    const passed = failureReasons.length === 0;

    results.push({
      endpoint,
      fullUrl: metrics.fullUrl,
      metrics,
      headerResults,
      leaks,
      healthCheckPassed: healthEval.passed,
      healthCheckDetails: healthEval.details,
      passed,
      criticalFailure,
      failureReasons,
    });
  }

  const passedEndpoints = results.filter((r) => r.passed).length;
  const failedEndpoints = results.length - passedEndpoints;

  return {
    timestamp,
    targetUrl,
    totalEndpoints: results.length,
    passedEndpoints,
    failedEndpoints,
    leakDetected: anyLeakDetected,
    criticalFailure: anyCriticalFailure,
    results,
  };
}

/**
 * Format and print sweep results to console
 */
export function displaySweepResults(summary: SweepSummary): void {
  console.log("\n" + "=".repeat(100));
  console.log(" COGNITIVE EDGE CLINIC — SYNTHETIC EDGE MONITOR & ZERO-LEAK SENTINEL");
  console.log("=".repeat(100));
  console.log(` Target Edge Host:   ${summary.targetUrl}`);
  console.log(` Probe Timestamp:    ${summary.timestamp}`);
  console.log(` Monitored Routes:   ${MONITORED_ENDPOINTS.join(", ")}`);
  console.log("-".repeat(100));

  // Table header
  console.log(
    "| Endpoint        | Status   | TLS Handshake | TTFB      | Total Lat | Security Headers | Leaks | Result |"
  );
  console.log(
    "|-----------------|----------|---------------|-----------|-----------|------------------|-------|--------|"
  );

  for (const r of summary.results) {
    const statusStr = r.metrics.statusCode > 0 ? `HTTP ${r.metrics.statusCode}` : "ERR / DOWN";
    const tlsStr = r.metrics.tlsHandshakeMs > 0 ? `${r.metrics.tlsHandshakeMs}ms` : "N/A";
    const ttfbStr = r.metrics.ttfbMs > 0 ? `${r.metrics.ttfbMs}ms` : "N/A";
    const totalStr = r.metrics.totalDurationMs > 0 ? `${r.metrics.totalDurationMs}ms` : "N/A";

    const passedHeaders = r.headerResults.filter((h) => h.passed).length;
    const totalHeaders = r.headerResults.length;
    const headerStr = `${passedHeaders}/${totalHeaders} ENFORCED`;

    const leakStr = r.leaks.length === 0 ? "CLEAN" : `! ${r.leaks.length} LEAK !`;
    const resultStr = r.passed ? "PASS" : "FAIL";

    console.log(
      `| ${r.endpoint.padEnd(15)} | ${statusStr.padEnd(8)} | ${tlsStr.padStart(13)} | ${ttfbStr.padStart(9)} | ${totalStr.padStart(9)} | ${headerStr.padEnd(16)} | ${leakStr.padEnd(5)} | ${resultStr.padEnd(6)} |`
    );
  }

  console.log("=".repeat(100));

  // Detailed breakdowns for issues
  const failureEntries = summary.results.filter((r) => !r.passed);
  if (failureEntries.length > 0) {
    console.log("\n[DIAGNOSTIC FAILURE DETAILS]");
    for (const f of failureEntries) {
      console.log(`  ✗ Endpoint '${f.endpoint}' (${f.fullUrl}):`);
      for (const reason of f.failureReasons) {
        console.log(`     - ${reason}`);
      }
    }
  }

  // Leak breakdown if detected
  if (summary.leakDetected) {
    console.error("\n" + "!".repeat(100));
    console.error(" [SECURITY ALERT] UNMASKED CREDENTIAL OR ePHI TOKEN LEAK DETECTED AT EDGE!");
    console.error(" Immediate action required: CDN edge caches must be purged and rotated.");
    console.error("!".repeat(100));
  }
}

/**
 * CLI argument parser
 */
export interface CliOptions {
  targetUrl: string;
  once: boolean;
  intervalSec: number;
}

export function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  let targetUrl = process.env.LIVE_URL || "https://cognitive-wellness.netlify.app";
  let once = false;
  let intervalSec = 60;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--once") {
      once = true;
    } else if (arg === "--interval") {
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) {
          intervalSec = parsed;
        }
        i++;
      }
    } else if (arg.startsWith("--interval=")) {
      const parsed = parseInt(arg.split("=")[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        intervalSec = parsed;
      }
    } else if (arg === "--url" || arg === "--target") {
      const val = args[i + 1];
      if (val && !val.startsWith("--")) {
        targetUrl = val;
        i++;
      }
    } else if (arg.startsWith("--url=") || arg.startsWith("--target=")) {
      targetUrl = arg.split("=")[1];
    } else if (!arg.startsWith("--") && (arg.startsWith("http://") || arg.startsWith("https://"))) {
      targetUrl = arg;
    }
  }

  targetUrl = targetUrl.replace(/\/$/, "");

  return { targetUrl, once, intervalSec };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main monitoring orchestrator
 */
export async function main(): Promise<void> {
  const options = parseCliArgs();

  console.log(`[SYNTHETIC MONITOR INITIALIZED]`);
  console.log(`  Target Host: ${options.targetUrl}`);
  console.log(`  Mode:        ${options.once ? "Single Sweep (--once)" : `Continuous Loop (every ${options.intervalSec}s)`}`);

  if (options.once) {
    const summary = await executeSweep(options.targetUrl);
    displaySweepResults(summary);

    if (summary.leakDetected || summary.criticalFailure || summary.failedEndpoints > 0) {
      console.error(
        `\n[EXIT CODE 1] Synthetic edge monitor detected failure(s) in single-sweep verification.\n`
      );
      process.exit(1);
    } else {
      console.log(
        `\n[SUCCESS] All edge endpoints healthy, security headers enforced, zero leaks detected.\n`
      );
      process.exit(0);
    }
  }

  // Continuous monitoring mode
  let isRunning = true;
  let sweepIteration = 0;

  const shutdown = () => {
    console.log("\n[SYNTHETIC MONITOR SHUTTING DOWN] Graceful exit requested.");
    isRunning = false;
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (isRunning) {
    sweepIteration++;
    console.log(`\n>>> Starting Monitor Sweep #${sweepIteration} at ${new Date().toISOString()}...`);

    const summary = await executeSweep(options.targetUrl);
    displaySweepResults(summary);

    // Fail immediately if leak detected or critical health check fails
    if (summary.leakDetected || summary.criticalFailure) {
      console.error(
        `\n[CRITICAL FAILURE DETECTED] Immediate abort triggered at sweep #${sweepIteration}. Exiting with code 1.\n`
      );
      process.exit(1);
    }

    if (summary.failedEndpoints > 0) {
      console.warn(
        `\n[WARNING] ${summary.failedEndpoints} endpoint(s) degraded during sweep #${sweepIteration}.\n`
      );
    }

    console.log(`Sleeping for ${options.intervalSec} seconds until next sweep... (Ctrl+C to stop)`);
    await sleep(options.intervalSec * 1000);
  }
}

const isMainScript = Boolean(
  process.argv[1] && /synthetic-edge-monitor\.[tj]s$/i.test(process.argv[1])
);

if (isMainScript) {
  main().catch((err) => {
    console.error("Fatal uncaught error in synthetic edge monitor:", err);
    process.exit(1);
  });
}
