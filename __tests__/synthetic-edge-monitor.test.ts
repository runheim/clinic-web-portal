import {
  scanForLeaks,
  validateHeaders,
  parseCliArgs,
} from "../scripts/monitoring/synthetic-edge-monitor";

describe("Synthetic Edge Monitor Unit Test Battery", () => {
  describe("Leak Scanner (Zero-Secret & Zero-ePHI Quarantine)", () => {
    test("detects live Stripe secret keys (sk_live_*)", () => {
      const body = "Some public payload with sk_live_51Msz9ABCD1234567890 embedded accidentally";
      const violations = scanForLeaks(body, {});
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.category === "SECRET")).toBe(true);
      expect(violations.some((v) => v.patternName === "stripe_live_secret")).toBe(true);
    });

    test("detects live webhook signing secrets (whsec_*)", () => {
      const body = "{\"config\": {\"signingSecret\": \"whsec_998877665544aabbcc\"}}";
      const violations = scanForLeaks(body, {});
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.patternName === "webhook_signing_secret")).toBe(true);
    });

    test("detects live Spruce credentials (spruce_live_*)", () => {
      const headers = { "x-api-key": "spruce_live_abcdef123456" };
      const violations = scanForLeaks("Clean body", headers);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.patternName === "spruce_live_secret")).toBe(true);
    });

    test("detects ePHI query parameters (ssn and mrn in URLs)", () => {
      const body = '<a href="/api/patient?ssn=123-45-6789&action=view">Patient Record</a>';
      const violations = scanForLeaks(body, {});
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.category === "ePHI")).toBe(true);
      expect(violations.some((v) => v.patternName === "ephi_query_param")).toBe(true);
    });

    test("detects ePHI JSON keys (mrn and ssn in response bodies)", () => {
      const body = JSON.stringify({ patientId: 101, mrn: "MRN-90210-A" });
      const violations = scanForLeaks(body, {});
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.category === "ePHI")).toBe(true);
      expect(violations.some((v) => v.patternName === "ephi_json_key")).toBe(true);
    });

    test("passes clean response payloads without false positives", () => {
      const body = `
        <!DOCTYPE html>
        <html>
          <head><title>Cognitive Edge Clinic</title></head>
          <body class="className-test">
            <h1>Arunheim Cognitive Wellness</h1>
            <p>Non-confidential public content.</p>
          </body>
        </html>
      `;
      const headers = {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600",
      };
      const violations = scanForLeaks(body, headers);
      expect(violations).toHaveLength(0);
    });
  });

  describe("Security Headers Validator", () => {
    test("validates enforced edge security headers", () => {
      const validHeaders = {
        "content-security-policy": "default-src 'self'; frame-ancestors 'none';",
        "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
        "x-frame-options": "DENY",
        "x-content-type-options": "nosniff",
      };

      const results = validateHeaders(validHeaders);
      expect(results).toHaveLength(4);
      expect(results.every((r) => r.passed)).toBe(true);
    });

    test("fails when security headers are missing or weak", () => {
      const weakHeaders = {
        "content-security-policy": "default-src 'self';", // missing frame-ancestors 'none'
        "strict-transport-security": "max-age=100", // weak age
        "x-frame-options": "SAMEORIGIN", // not DENY
        // missing x-content-type-options
      };

      const results = validateHeaders(weakHeaders);
      const passedCount = results.filter((r) => r.passed).length;
      expect(passedCount).toBeLessThan(4);
    });
  });

  describe("CLI Argument Parser", () => {
    const originalArgv = process.argv;
    const originalEnv = process.env;

    afterEach(() => {
      process.argv = originalArgv;
      process.env = originalEnv;
    });

    test("parses --once flag", () => {
      process.argv = ["node", "synthetic-edge-monitor.ts", "--once"];
      const opts = parseCliArgs();
      expect(opts.once).toBe(true);
    });

    test("parses --interval parameter", () => {
      process.argv = ["node", "synthetic-edge-monitor.ts", "--interval", "15"];
      const opts = parseCliArgs();
      expect(opts.intervalSec).toBe(15);
      expect(opts.once).toBe(false);
    });

    test("parses custom target URL from CLI and env var", () => {
      process.argv = ["node", "synthetic-edge-monitor.ts", "--url", "https://staging.example.com/"];
      const opts = parseCliArgs();
      expect(opts.targetUrl).toBe("https://staging.example.com");

      delete (process as { argv?: string[] }).argv;
      process.argv = ["node", "synthetic-edge-monitor.ts"];
      process.env.LIVE_URL = "https://preview.example.com";
      const envOpts = parseCliArgs();
      expect(envOpts.targetUrl).toBe("https://preview.example.com");
    });
  });
});
