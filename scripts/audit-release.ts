import fs from "fs";
import path from "path";

interface Violation {
  type: "ZERO_EPHI_LEAK" | "CLIENT_SECRET_LEAK" | "SECURITY_HEADER_MISSING";
  file: string;
  line?: number;
  snippet?: string;
  detail: string;
}

interface AuditReport {
  timestamp: string;
  status: "PASSED" | "FAILED";
  scannedFilesCount: number;
  violationsCount: number;
  violations: Violation[];
  checks: {
    zeroEphi: {
      passed: boolean;
      scannedFiles: number;
      violations: Violation[];
    };
    secretsHygiene: {
      passed: boolean;
      scannedFiles: number;
      violations: Violation[];
    };
    securityHeaders: {
      passed: boolean;
      headersFound: string[];
      missingHeaders: string[];
    };
  };
}

const ROOT_DIR = process.cwd();

// Prohibited PHI Patterns
const PHI_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Social Security Number (SSN)", regex: /\bssn\b|\bsocial[_-]?security\b/i },
  { name: "Medical Record Number (MRN)", regex: /\bmedical[_-]?record[_-]?number\b|\bmrn\b/i },
  { name: "Chart Note Text", regex: /\bchart[_-]?note[_-]?text\b/i },
  { name: "Raw Lab Value", regex: /\braw[_-]?lab[_-]?value\b/i },
];

// Sensitive Server Secrets that must never leak into client code or public assets
const SENSITIVE_SECRETS = [
  "SPRUCE_API_KEY",
  "STRIPE_SECRET_KEY",
  "CALCOM_WEBHOOK_SECRET",
];

// High-entropy secret literals that must never be hardcoded
const SECRET_VALUE_PATTERNS = [
  /\bsk_live_[a-zA-Z0-9]{24,}\b/,
  /\bwhsec_[a-zA-Z0-9]{24,}\b/,
  /\bspruce_live_[a-zA-Z0-9]{16,}\b/,
];

// Required Security Headers in next.config.ts
const REQUIRED_SECURITY_HEADERS = [
  "Content-Security-Policy",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".git" &&
        entry.name !== ".next"
      ) {
        getAllFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function getBuiltClientChunks(): string[] {
  const chunksDir = path.join(ROOT_DIR, ".next", "static", "chunks");
  if (!fs.existsSync(chunksDir)) return [];
  const list: string[] = [];
  const walk = (d: string) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && p.endsWith(".js")) list.push(p);
    }
  };
  walk(chunksDir);
  return list;
}

function runAudit(): void {
  console.log("================================================================================");
  console.log("ANTIGRAVITY: ZERO-ePHI & PRODUCTION SECRETS AUDIT ENGINE");
  console.log("================================================================================");
  console.log(`Working Directory: ${ROOT_DIR}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log("--------------------------------------------------------------------------------");

  const violations: Violation[] = [];
  let scannedFilesCount = 0;

  // 1. Gather files to inspect for Zero-ePHI
  const scanDirs = [
    path.join(ROOT_DIR, "src"),
    path.join(ROOT_DIR, "data"),
    path.join(ROOT_DIR, "public"),
  ];

  const sourceFiles: string[] = [];
  for (const d of scanDirs) {
    getAllFiles(d, sourceFiles);
  }

  // Filter out non-text or binary files if any
  const textExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".mjs", ".css", ".svg", ".html", ".md"];
  const targetSourceFiles = sourceFiles.filter((f) =>
    textExtensions.includes(path.extname(f).toLowerCase())
  );

  scannedFilesCount += targetSourceFiles.length;

  console.log(`[1/3] Scanning ${targetSourceFiles.length} source & data files for prohibited ePHI tokens...`);

  for (const file of targetSourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of PHI_PATTERNS) {
        if (pattern.regex.test(line)) {
          // Special exception: skip this audit script if scanning itself, and skip audit-report.json
          if (relativePath.includes("scripts/audit-release.ts") || relativePath.includes("audit-report.json")) {
            continue;
          }

          violations.push({
            type: "ZERO_EPHI_LEAK",
            file: relativePath,
            line: i + 1,
            snippet: line.trim().slice(0, 100),
            detail: `Prohibited ePHI token detected: ${pattern.name}`,
          });
        }
      }
    }
  }

  // 2. Secret Key Hygiene & Client Bundle Sanitization
  console.log("[2/3] Verifying secret key isolation (Client vs Server boundary)...");

  // Client source files are everything in `src/` EXCEPT `src/app/api/`
  const clientSourceFiles = targetSourceFiles.filter((f) => {
    const rel = path.relative(ROOT_DIR, f).replace(/\\/g, "/");
    return !rel.startsWith("src/app/api/");
  });

  for (const file of clientSourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
    const lines = content.split(/\r?\n/);

    // Check for sensitive environment variable references
    for (const secret of SENSITIVE_SECRETS) {
      if (content.includes(secret)) {
        violations.push({
          type: "CLIENT_SECRET_LEAK",
          file: relativePath,
          detail: `Server secret '${secret}' referenced in client-facing code. Server secrets must only reside in 'src/app/api/' handlers.`,
        });
      }
    }

    // Check for accidental hardcoded secret literals
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const valPattern of SECRET_VALUE_PATTERNS) {
        if (valPattern.test(line)) {
          violations.push({
            type: "CLIENT_SECRET_LEAK",
            file: relativePath,
            line: i + 1,
            snippet: line.trim().slice(0, 50),
            detail: "High-entropy secret key literal detected in source code.",
          });
        }
      }
    }
  }

  // Scan compiled client JS bundles if .next exists
  const clientChunks = getBuiltClientChunks();
  if (clientChunks.length > 0) {
    console.log(`      Inspecting ${clientChunks.length} compiled client bundles in .next/static/chunks...`);
    scannedFilesCount += clientChunks.length;

    for (const chunk of clientChunks) {
      const content = fs.readFileSync(chunk, "utf8");
      const relativePath = path.relative(ROOT_DIR, chunk).replace(/\\/g, "/");

      for (const secret of SENSITIVE_SECRETS) {
        if (content.includes(secret)) {
          violations.push({
            type: "CLIENT_SECRET_LEAK",
            file: relativePath,
            detail: `Server secret '${secret}' found baked into compiled client bundle!`,
          });
        }
      }

      for (const pattern of PHI_PATTERNS) {
        if (pattern.regex.test(content)) {
          violations.push({
            type: "ZERO_EPHI_LEAK",
            file: relativePath,
            detail: `Prohibited ePHI token (${pattern.name}) found in compiled client bundle!`,
          });
        }
      }
    }
  } else {
    console.log("      (Notice: .next/static/chunks not yet compiled; run 'npm run build' for bundle audit)");
  }

  // 3. Security Headers Validation
  console.log("[3/3] Auditing Next.js Edge Security Headers and Content-Security-Policy...");
  const nextConfigPath = path.join(ROOT_DIR, "next.config.ts");
  const headersFound: string[] = [];
  const missingHeaders: string[] = [];

  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, "utf8");
    for (const header of REQUIRED_SECURITY_HEADERS) {
      if (configContent.includes(header)) {
        headersFound.push(header);
      } else {
        missingHeaders.push(header);
        violations.push({
          type: "SECURITY_HEADER_MISSING",
          file: "next.config.ts",
          detail: `Mandatory security header '${header}' is missing from next.config.ts.`,
        });
      }
    }
  } else {
    violations.push({
      type: "SECURITY_HEADER_MISSING",
      file: "next.config.ts",
      detail: "next.config.ts does not exist in project root.",
    });
  }

  // Build Report
  const passed = violations.length === 0;
  const zeroEphiViolations = violations.filter((v) => v.type === "ZERO_EPHI_LEAK");
  const secretViolations = violations.filter((v) => v.type === "CLIENT_SECRET_LEAK");

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    status: passed ? "PASSED" : "FAILED",
    scannedFilesCount,
    violationsCount: violations.length,
    violations,
    checks: {
      zeroEphi: {
        passed: zeroEphiViolations.length === 0,
        scannedFiles: targetSourceFiles.length,
        violations: zeroEphiViolations,
      },
      secretsHygiene: {
        passed: secretViolations.length === 0,
        scannedFiles: clientSourceFiles.length,
        violations: secretViolations,
      },
      securityHeaders: {
        passed: missingHeaders.length === 0,
        headersFound,
        missingHeaders,
      },
    },
  };

  const reportPath = path.join(ROOT_DIR, "audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nAudit Manifest generated at: ${reportPath}`);

  console.log("--------------------------------------------------------------------------------");
  console.log("AUDIT SUMMARY:");
  console.log(`- Status:               ${passed ? "PASSED (0 Violations)" : "FAILED (" + violations.length + " Violations)"}`);
  console.log(`- Scanned Files:        ${scannedFilesCount}`);
  console.log(`- Zero-ePHI Isolation:  ${zeroEphiViolations.length === 0 ? "100% CLEAN" : zeroEphiViolations.length + " LEAKS DETECTED"}`);
  console.log(`- Secret Key Hygiene:   ${secretViolations.length === 0 ? "100% SECURE" : secretViolations.length + " EXPOSURES DETECTED"}`);
  console.log(`- Edge Headers Audit:   ${missingHeaders.length === 0 ? "6/6 HEADERS CONFIGURED" : missingHeaders.length + " MISSING"}`);
  console.log("================================================================================");

  if (!passed) {
    console.error("\n[CRITICAL FAILURE] Violations detected during Zero-ePHI release preflight:");
    violations.forEach((v, idx) => {
      console.error(`  ${idx + 1}. [${v.type}] ${v.file}${v.line ? ":" + v.line : ""}`);
      console.error(`     ${v.detail}`);
      if (v.snippet) console.error(`     Snippet: "${v.snippet}"`);
    });
    process.exit(1);
  } else {
    console.log("\n[SUCCESS] Pre-flight Zero-ePHI & Security Verification PASSED.");
    process.exit(0);
  }
}

runAudit();
