#!/usr/bin/env bash
# ==============================================================================
# COGNITIVE EDGE CLINIC — GIT PRE-COMMIT ISOLATION GATE
# ==============================================================================
# Fails commits if unencrypted secrets, ePHI tokens, or lint/type errors exist.
# ==============================================================================

set -e

echo ""
echo "================================================================================"
echo " COGNITIVE EDGE CLINIC — PRE-COMMIT ISOLATION GATE"
echo "================================================================================"

# 1. CHECK FOR ACCIDENTALLY STAGED SECRETS OR ENV FILES
echo "[1/4] Checking staged files for forbidden environment or credential files..."
STAGED_ENV_FILES=$(git diff --cached --name-only | grep -E '\.env(\.local|\.production|\.development)?$' || true)

if [ -n "$STAGED_ENV_FILES" ]; then
  echo ""
  echo "::error::CRITICAL SECURITY VIOLATION: Staged environment file detected!"
  echo "$STAGED_ENV_FILES"
  echo "Environment files contain server-side secrets and must never be committed."
  echo "Run: git reset HEAD <file> to unstage."
  exit 1
fi
echo "      Passed: No environment files staged."

# 2. RUN ZERO-ePHI & PRODUCTION SECRETS AUDIT
echo "[2/4] Executing Zero-ePHI and prohibited token audit..."
npm run audit:release

# 3. VERIFY TYPESCRIPT COMPILATION
echo "[3/4] Verifying TypeScript compiler type integrity..."
npx tsc --noEmit
echo "      Passed: Zero TypeScript type errors detected."

# 4. RUN ESLINT STATIC ANALYSIS
echo "[4/4] Running ESLint static analysis (Zero Warnings standard)..."
npm run lint
echo "      Passed: ESLint clean."

echo "================================================================================"
echo " PRE-COMMIT GATE: ALL CHECKS PASSED. COMMIT AUTHORIZED."
echo "================================================================================"
echo ""
