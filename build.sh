#!/usr/bin/env bash
set -euo pipefail

SAGE='\033[0;32m'
CHAMPAGNE='\033[0;33m'
CRIMSON='\033[0;31m'
NC='\033[0m'

echo -e "${CHAMPAGNE}================================================================================"
echo -e "   COGNITIVE WELLNESS CLINICAL ECOSYSTEM — BUILD HARNESS (WSL SAFE)"
echo -e "================================================================================${NC}\n"

# GATE 1: Pre-flight
echo -e "${CHAMPAGNE}[GATE 1/5] Pre-flight toolchain check...${NC}"
for cmd in node npx sha256sum grep find; do
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "${CRIMSON}ERROR: '$cmd' missing.${NC}"
    exit 1
  fi
done
echo -e "${SAGE}✓ Gate 1 passed.${NC}\n"

# GATE 2: Zero-ePHI Quarantine Check
echo -e "${CHAMPAGNE}[GATE 2/5] Checking Zero-ePHI Quarantine...${NC}"
if grep -rEi "(prisma|sqlite3|@types/sqlite3|patient_vitals|hrv_telemetry|sleep_architecture)" src/ components/ app/ lib/ 2>/dev/null; then
  echo -e "${CRIMSON}COMPLIANCE BREACH: Forbidden local telemetry or database models detected!${NC}"
  exit 1
fi
echo -e "${SAGE}✓ Gate 2 passed: Zero-ePHI boundary verified.${NC}\n"

# GATE 3: TypeScript Type-Check
echo -e "${CHAMPAGNE}[GATE 3/5] Running TypeScript compilation (tsc --noEmit)...${NC}"
if ! npx tsc --noEmit; then
  echo -e "${CRIMSON}ERROR: TypeScript type mismatch detected.${NC}"
  exit 1
fi
echo -e "${SAGE}✓ Gate 3 passed: Types verified.${NC}\n"

# GATE 4: ESLint Scan
echo -e "${CHAMPAGNE}[GATE 4/5] Executing ESLint check...${NC}"
if ! npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0; then
  echo -e "${CRIMSON}ERROR: ESLint warnings or syntax errors found.${NC}"
  exit 1
fi
echo -e "${SAGE}✓ Gate 4 passed: Linting clean.${NC}\n"

# GATE 5: Next.js Production Build
echo -e "${CHAMPAGNE}[GATE 5/5] Building Next.js production bundle...${NC}"
export NODE_ENV=production
if ! npx next build; then
  echo -e "${CRIMSON}ERROR: Production build failed.${NC}"
  exit 1
fi
echo -e "${SAGE}✓ Gate 5 passed: Production bundle compiled successfully.${NC}\n"

# Cryptographic Checksum
BUILD_CHECKSUM=$(find .next/ -type f ! -name "release-manifest.json" -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
echo -e "{\n  \"status\": \"COMPILED\",\n  \"sha256\": \"$BUILD_CHECKSUM\",\n  \"builtAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"\n}" > .next/release-manifest.json

echo -e "${SAGE}================================================================================"
echo -e "   BUILD COMPLETE AND VERIFIED (Release: $BUILD_CHECKSUM)"
echo -e "================================================================================${NC}"
