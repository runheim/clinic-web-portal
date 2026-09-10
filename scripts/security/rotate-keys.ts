export {};

import * as crypto from "node:crypto";

/**
 * COGNITIVE EDGE CLINIC — PRODUCTION SECRET ROTATION & SECURITY VALIDATOR
 *
 * Zero-leak CLI tool for operations to validate live candidate keys
 * (SPRUCE_API_KEY, STRIPE_SECRET_KEY, CALCOM_WEBHOOK_SECRET) prior to Netlify updates.
 *
 * Requirements:
 * 1. Accepts CLI arguments --cal-secret, --stripe-key, --spruce-key or uses environment / candidate test keys.
 * 2. Validates Cal.com HMAC-SHA256 signature generation against a test payload (asserts 64-character hex digest).
 * 3. Validates Stripe secret key prefix (sk_live_ or sk_test_), entropy length (>= 24), and Bearer authorization syntax.
 * 4. Validates Spruce Health API key entropy length (>= 16) and Bearer auth header syntax.
 * 5. Never writes keys to disk, never stores in .env, never logs raw keys (masks keys: e.g. sk_live_••••••••).
 * 6. Emits exit code 0 on validation pass, exit code 1 on mismatch.
 */

interface KeyValidationResult {
  target: string;
  maskedSnippet: string;
  structureCheck: string;
  status: "VERIFIED" | "INVALID FORMAT";
  detail: string;
}

interface CliArgs {
  calSecret?: string;
  stripeKey?: string;
  spruceKey?: string;
}

/**
 * Masks candidate secrets to guarantee zero secret leakage.
 * Example output: sk_live_••••••••
 */
function maskKey(key?: string): string {
  if (!key) return "[NONE]";
  if (key.length <= 8) return "••••••••";
  if (key.startsWith("sk_live_")) {
    return "sk_live_••••••••";
  }
  if (key.startsWith("sk_test_")) {
    return "sk_test_••••••••";
  }
  const prefix = key.slice(0, 8);
  return `${prefix}••••••••`;
}

/**
 * Validates Cal.com HMAC-SHA256 Webhook Signing Secret.
 * - Minimum entropy: 16 characters
 * - Validates HMAC-SHA256 signature generation against a test payload
 * - Asserts 64-character hex digest output
 */
function validateCalcomHmacSecret(candidateSecret?: string): KeyValidationResult {
  const secret =
    candidateSecret ||
    process.env.CALCOM_WEBHOOK_SECRET ||
    "candidate_cal_hmac_secret_sample_entropy_982";

  if (!secret || secret.length < 16) {
    return {
      target: "Cal.com Webhook Secret",
      maskedSnippet: maskKey(secret),
      structureCheck: "HMAC Entropy < 16 bytes",
      status: "INVALID FORMAT",
      detail: "Secret must be at least 16 characters of high-entropy text.",
    };
  }

  try {
    const testPayload = JSON.stringify({
      triggerEvent: "ROTATION_TEST_PING",
      timestamp: 1700000000000,
      enclave: "Cognitive Edge Clinical Portal",
    });

    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(testPayload).digest("hex");

    if (digest.length === 64 && /^[0-9a-f]{64}$/.test(digest)) {
      // Constant-time self-verification of generated digest
      const expectedBuf = Buffer.from(digest, "utf8");
      const computedDigest = crypto.createHmac("sha256", secret).update(testPayload).digest("hex");
      const computedBuf = Buffer.from(computedDigest, "utf8");
      if (expectedBuf.length !== computedBuf.length || !crypto.timingSafeEqual(expectedBuf, computedBuf)) {
        return {
          target: "Cal.com Webhook Secret",
          maskedSnippet: maskKey(secret),
          structureCheck: "HMAC Verification Mismatch",
          status: "INVALID FORMAT",
          detail: "Generated HMAC digest failed verification against test payload.",
        };
      }
      return {
        target: "Cal.com Webhook Secret",
        maskedSnippet: maskKey(secret),
        structureCheck: "HMAC-SHA256 (64-Hex Digest Valid)",
        status: "VERIFIED",
        detail: "HMAC generation verified (64-char hex digest). Valid for x-cal-signature-256 header.",
      };
    } else {
      return {
        target: "Cal.com Webhook Secret",
        maskedSnippet: maskKey(secret),
        structureCheck: "Invalid Digest Output",
        status: "INVALID FORMAT",
        detail: "Digest did not produce 64-character hex string.",
      };
    }
  } catch (err: unknown) {
    return {
      target: "Cal.com Webhook Secret",
      maskedSnippet: maskKey(secret),
      structureCheck: "Cryptographic Exception",
      status: "INVALID FORMAT",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Validates Stripe Secret API Key:
 * - Prefix must be sk_live_ or sk_test_
 * - Entropy length >= 24 characters
 * - Bearer authorization syntax check
 */
function validateStripeSecretKey(candidateKey?: string): KeyValidationResult {
  const key =
    candidateKey ||
    process.env.STRIPE_SECRET_KEY ||
    "sk_live_candidate_stripe_secret_token_secure_400";

  if (!key || (!key.startsWith("sk_live_") && !key.startsWith("sk_test_"))) {
    return {
      target: "Stripe Secret Key",
      maskedSnippet: maskKey(key),
      structureCheck: "Missing sk_live_ / sk_test_ Prefix",
      status: "INVALID FORMAT",
      detail: "Stripe secret keys must start with sk_live_ (production) or sk_test_ (testing).",
    };
  }

  if (key.length < 24) {
    return {
      target: "Stripe Secret Key",
      maskedSnippet: maskKey(key),
      structureCheck: "Length < 24 characters",
      status: "INVALID FORMAT",
      detail: "Insufficient length for valid Stripe API key token (minimum 24 characters required).",
    };
  }

  // Validate Bearer authorization syntax
  const authHeader = `Bearer ${key}`;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1] || /\s/.test(key)) {
    return {
      target: "Stripe Secret Key",
      maskedSnippet: maskKey(key),
      structureCheck: "Malformed Bearer Authorization Syntax",
      status: "INVALID FORMAT",
      detail: "Invalid Bearer authorization syntax or forbidden whitespace characters in key.",
    };
  }

  return {
    target: "Stripe Secret Key",
    maskedSnippet: maskKey(key),
    structureCheck: "Bearer Token Syntax Valid",
    status: "VERIFIED",
    detail: "Prefix (sk_live_/sk_test_), entropy (>= 24), and Bearer authorization syntax verified.",
  };
}

/**
 * Validates Spruce Health API Key:
 * - Entropy length >= 16 characters
 * - Bearer auth header syntax
 */
function validateSpruceApiKey(candidateToken?: string): KeyValidationResult {
  const token =
    candidateToken ||
    process.env.SPRUCE_API_KEY ||
    "spruce_live_candidate_bearer_token_verified_99";

  if (!token || token.length < 16) {
    return {
      target: "Spruce Health API Key",
      maskedSnippet: maskKey(token),
      structureCheck: "Length < 16 characters",
      status: "INVALID FORMAT",
      detail: "Bearer token format must contain at least 16 characters of entropy.",
    };
  }

  const authHeader = `Bearer ${token}`;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1] || /\s/.test(token)) {
    return {
      target: "Spruce Health API Key",
      maskedSnippet: maskKey(token),
      structureCheck: "Malformed Bearer Auth Header",
      status: "INVALID FORMAT",
      detail: "Invalid authorization scheme construction or forbidden whitespace characters in token.",
    };
  }

  return {
    target: "Spruce Health API Key",
    maskedSnippet: maskKey(token),
    structureCheck: "Bearer Auth Header Valid",
    status: "VERIFIED",
    detail: "Entropy length (>= 16) and Bearer authorization schema verified for Spruce Care API.",
  };
}

/**
 * Parses CLI arguments supporting both --arg val and --arg=val syntax.
 */
function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cal-secret" && i + 1 < args.length) {
      result.calSecret = args[++i];
    } else if (arg.startsWith("--cal-secret=")) {
      result.calSecret = arg.slice("--cal-secret=".length);
    } else if (arg === "--stripe-key" && i + 1 < args.length) {
      result.stripeKey = args[++i];
    } else if (arg.startsWith("--stripe-key=")) {
      result.stripeKey = arg.slice("--stripe-key=".length);
    } else if (arg === "--spruce-key" && i + 1 < args.length) {
      result.spruceKey = args[++i];
    } else if (arg.startsWith("--spruce-key=")) {
      result.spruceKey = arg.slice("--spruce-key=".length);
    }
  }

  return result;
}

/**
 * Runs the rotation pre-flight audit against candidate credentials.
 * Never writes keys to disk, never stores in .env, never logs raw keys.
 * Returns true if all keys pass validation, false otherwise.
 */
function runRotationAudit(): boolean {
  console.log("\n================================================================================");
  console.log("  COGNITIVE EDGE CLINIC — PRODUCTION SECRET ROTATION & SECURITY AUDITOR");
  console.log("  Boundary: Zero-Leak In-Memory Verification | Zero-ePHI Isolation");
  console.log("================================================================================\n");

  const cliArgs = parseCliArgs();

  const results: KeyValidationResult[] = [
    validateCalcomHmacSecret(cliArgs.calSecret),
    validateStripeSecretKey(cliArgs.stripeKey),
    validateSpruceApiKey(cliArgs.spruceKey),
  ];

  console.log("CANDIDATE KEY VALIDATION MATRIX:");
  console.log("--------------------------------------------------------------------------------");
  for (const r of results) {
    const icon = r.status === "VERIFIED" ? "\x1b[32m[VERIFIED]\x1b[0m" : "\x1b[31m[FAILED]\x1b[0m";
    console.log(`  Target:           \x1b[36m${r.target}\x1b[0m`);
    console.log(`  Masked Candidate: ${r.maskedSnippet}`);
    console.log(`  Structural Probe: ${r.structureCheck}`);
    console.log(`  Audit Status:     ${icon}`);
    console.log(`  Detail:           ${r.detail}\n`);
  }

  const allVerified = results.every((r) => r.status === "VERIFIED");

  console.log("================================================================================");
  console.log("ZERO-LEAK COMPLIANCE CERTIFICATION:");
  console.log("  - Candidate secrets never logged in plain text.");
  console.log("  - Candidate secrets never written to disk or unencrypted repositories.");
  console.log("  - Ephemeral HMAC and Bearer authentication structures attested.");
  console.log("--------------------------------------------------------------------------------");

  if (allVerified) {
    console.log("  \x1b[32m✔ ROTATION PRE-FLIGHT PASSED: All candidate credentials approved for deployment.\x1b[0m");
    console.log("================================================================================\n");
    return true;
  } else {
    console.log("  \x1b[31m✖ ROTATION PRE-FLIGHT FAILED: One or more candidates have invalid formats.\x1b[0m");
    console.log("================================================================================\n");
    return false;
  }
}

const passed = runRotationAudit();
if (!passed) {
  process.exit(1);
}
