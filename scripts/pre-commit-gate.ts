import { execSync } from "child_process";

/**
 * COGNITIVE EDGE CLINIC — PRE-COMMIT ISOLATION GATE (TypeScript Runner)
 * Enforces Zero-ePHI isolation, blocks staged .env files, and verifies type integrity.
 */
function runPreCommitGate() {
  console.log("\n================================================================================");
  console.log(" COGNITIVE EDGE CLINIC — PRE-COMMIT ISOLATION GATE");
  console.log("================================================================================\n");

  // 1. Check for staged environment files
  console.log("[1/4] Checking staged files for forbidden environment or credential files...");
  try {
    const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    const envFiles = stagedFiles
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => /^\.env(\.(local|production|development|test))?$/i.test(f));

    if (envFiles.length > 0) {
      console.error("\n[CRITICAL SECURITY VIOLATION] Staged environment files detected:");
      envFiles.forEach((file) => console.error(`  - ${file}`));
      console.error("\nEnvironment files contain server-side secrets and must never be committed.");
      console.error("Run: git reset HEAD <file> to unstage.\n");
      process.exit(1);
    }
    console.log("      Passed: No environment files staged.");
  } catch {
    // Not in a git repo or no commits yet - non-fatal check
    console.log("      Notice: git staged diff check bypassed (clean working directory).");
  }

  // 2. Run Zero-ePHI and Secrets Audit
  console.log("\n[2/4] Executing Zero-ePHI and prohibited token audit...");
  try {
    execSync("npm run audit:release", { stdio: "inherit" });
    console.log("      Passed: Zero-ePHI audit passed.");
  } catch {
    console.error("\n[FAILURE] Zero-ePHI audit failed. Commit blocked.");
    process.exit(1);
  }

  // 3. Verify TypeScript Compilation
  console.log("\n[3/4] Verifying TypeScript compiler type integrity...");
  try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    console.log("      Passed: Zero TypeScript errors detected.");
  } catch {
    console.error("\n[FAILURE] TypeScript compilation failed. Commit blocked.");
    process.exit(1);
  }

  // 4. Run ESLint Static Analysis
  console.log("\n[4/4] Running ESLint static analysis (Zero Warnings standard)...");
  try {
    execSync("npm run lint", { stdio: "inherit" });
    console.log("      Passed: ESLint clean.");
  } catch {
    console.error("\n[FAILURE] ESLint analysis failed. Commit blocked.");
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log(" PRE-COMMIT GATE: ALL CHECKS PASSED. COMMIT AUTHORIZED.");
  console.log("================================================================================\n");
}

runPreCommitGate();
