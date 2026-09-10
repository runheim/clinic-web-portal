export {};

interface SmokeCheckResult {
  category: "ROUTE" | "SECURITY_HEADER" | "WEBHOOK_GATE";
  target: string;
  expected: string;
  actual: string;
  status: "PASSED" | "FAILED";
  latencyMs: number;
}

const TARGET_URL = (process.env.TARGET_URL || "http://localhost:3000").replace(/\/+$/, "");

const ROUTES_TO_VERIFY = [
  "/",
  "/services",
  "/ledger",
  "/briefings",
  "/membership",
  "/biographies",
  "/assessment",
  "/vault",
  "/governance",
  "/api/health",
];

const REQUIRED_HEADERS = [
  { header: "content-security-policy", expectedValueRegex: /default-src 'self'/i },
  { header: "x-frame-options", expectedValueRegex: /DENY/i },
  { header: "strict-transport-security", expectedValueRegex: /max-age=/i },
];

async function runSmokeTests(): Promise<void> {
  console.log("================================================================================");
  console.log("ANTIGRAVITY: STAGING SMOKE TEST & EDGE INTEGRITY HARNESS");
  console.log("================================================================================");
  console.log(`Target Host:       ${TARGET_URL}`);
  console.log(`Execution Time:    ${new Date().toISOString()}`);
  console.log("--------------------------------------------------------------------------------");

  const results: SmokeCheckResult[] = [];

  // 1. Route Matrix Verification
  console.log("\n[1/3] Probing Public & Member Route Matrix...");
  for (const route of ROUTES_TO_VERIFY) {
    const fullUrl = `${TARGET_URL}${route}`;
    const start = performance.now();
    try {
      const res = await fetch(fullUrl, { method: "GET" });
      const latencyMs = Math.round(performance.now() - start);

      const is200 = res.status === 200;
      results.push({
        category: "ROUTE",
        target: route,
        expected: "HTTP 200 OK",
        actual: `HTTP ${res.status}`,
        status: is200 ? "PASSED" : "FAILED",
        latencyMs,
      });

      console.log(
        `  ${is200 ? "✓" : "✗"} [ROUTE] ${route.padEnd(20)} -> ${res.status} (${latencyMs}ms)`
      );
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        category: "ROUTE",
        target: route,
        expected: "HTTP 200 OK",
        actual: `ERROR: ${msg}`,
        status: "FAILED",
        latencyMs,
      });
      console.log(`  ✗ [ROUTE] ${route.padEnd(20)} -> FAILED (${msg})`);
    }
  }

  // 2. Edge Security Headers Verification
  console.log("\n[2/3] Auditing Edge Security & Content-Security-Policy Headers...");
  const startHeaders = performance.now();
  try {
    const rootRes = await fetch(`${TARGET_URL}/`, { method: "GET" });
    const latencyMs = Math.round(performance.now() - startHeaders);

    for (const reqH of REQUIRED_HEADERS) {
      const val = rootRes.headers.get(reqH.header) || "";
      const matches = reqH.expectedValueRegex.test(val);

      results.push({
        category: "SECURITY_HEADER",
        target: reqH.header,
        expected: `Matches ${reqH.expectedValueRegex.source}`,
        actual: val ? `${val.substring(0, 40)}...` : "NOT_PRESENT",
        status: matches ? "PASSED" : "FAILED",
        latencyMs,
      });

      console.log(
        `  ${matches ? "✓" : "✗"} [HEADER] ${reqH.header.padEnd(26)} -> ${
          matches ? "CONFIGURED" : "MISSING OR INVALID"
        }`
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ [HEADER] Failed to fetch headers: ${msg}`);
  }

  // 3. Webhook Cryptographic Gate (Unsigned POST must return HTTP 401)
  console.log("\n[3/3] Probing Webhook Cryptographic Gate (Unsigned Cal.com Webhook)...");
  const webhookStart = performance.now();
  try {
    const webhookRes = await fetch(`${TARGET_URL}/api/webhooks/calcom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} }),
    });
    const webhookLatency = Math.round(performance.now() - webhookStart);

    const is401 = webhookRes.status === 401;
    results.push({
      category: "WEBHOOK_GATE",
      target: "/api/webhooks/calcom",
      expected: "HTTP 401 Unauthorized",
      actual: `HTTP ${webhookRes.status}`,
      status: is401 ? "PASSED" : "FAILED",
      latencyMs: webhookLatency,
    });

    console.log(
      `  ${is401 ? "✓" : "✗"} [WEBHOOK GATE] Unsigned POST -> HTTP ${
        webhookRes.status
      } (${webhookLatency}ms) - ${is401 ? "UNAUTHORIZED (SECURE)" : "INSECURE EXPOSURE"}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      category: "WEBHOOK_GATE",
      target: "/api/webhooks/calcom",
      expected: "HTTP 401 Unauthorized",
      actual: `ERROR: ${msg}`,
      status: "FAILED",
      latencyMs: 0,
    });
    console.log(`  ✗ [WEBHOOK GATE] Probe failed: ${msg}`);
  }

  // Summary Matrix
  console.log("\n================================================================================");
  console.log("SMOKE TEST RESULTS MATRIX:");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    `| ${"Category".padEnd(16)} | ${"Target".padEnd(26)} | ${"Expected".padEnd(24)} | ${"Actual".padEnd(20)} | ${"Status".padEnd(8)} |`
  );
  console.log(
    `|${"-".repeat(18)}|${"-".repeat(28)}|${"-".repeat(26)}|${"-".repeat(22)}|${"-".repeat(10)}|`
  );

  for (const r of results) {
    console.log(
      `| ${r.category.padEnd(16)} | ${r.target.padEnd(26)} | ${r.expected.padEnd(24)} | ${r.actual.padEnd(20)} | ${r.status.padEnd(8)} |`
    );
  }

  console.log("================================================================================");

  const failedCount = results.filter((r) => r.status === "FAILED").length;
  if (failedCount > 0) {
    console.error(`\n[CRITICAL FAILURE] ${failedCount} smoke test checks failed.`);
    process.exit(1);
  } else {
    console.log(`\n[SUCCESS] All ${results.length} staging smoke checks passed successfully.`);
    process.exit(0);
  }
}

runSmokeTests();
