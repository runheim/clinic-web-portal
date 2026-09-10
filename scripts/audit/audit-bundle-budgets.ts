export {};

import fs from "fs";
import path from "path";
import zlib from "zlib";

export interface ChunkBudgetResult {
  file: string;
  name: string;
  rawBytes: number;
  gzipBytes: number;
  rawKb: number;
  gzipKb: number;
  budgetKb: number;
  passed: boolean;
  type: string;
}

export interface BundleAuditReport {
  timestamp: string;
  chunksDirectory: string;
  totalChunks: number;
  passedCount: number;
  failedCount: number;
  maxBudgetGzipKb: number;
  peakGzipChunk: {
    name: string;
    gzipKb: number;
  };
  chunks: ChunkBudgetResult[];
  allPassed: boolean;
}

const MAX_ROUTE_CHUNK_GZIP_KB = 160;
const ROOT_DIR = process.cwd();
const STATIC_CHUNKS_DIR = path.join(ROOT_DIR, ".next", "static", "chunks");

function getAllJsChunks(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllJsChunks(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function classifyChunk(fileName: string, relativePath: string): string {
  if (fileName.startsWith("turbopack-")) return "Turbopack Runtime";
  if (relativePath.includes("pages")) return "Pages Route";
  if (relativePath.includes("app")) return "App Route";
  if (/^[0-9a-f_]+-/.test(fileName) || fileName.includes("framework")) return "Shared Framework";
  return "Client Route Chunk";
}

export function auditBundleBudgets(): BundleAuditReport {
  if (!fs.existsSync(STATIC_CHUNKS_DIR)) {
    console.error(`\n[CRITICAL ERROR] Chunks directory does not exist: ${STATIC_CHUNKS_DIR}`);
    console.error("Please run 'npm run build' before running bundle audits.\n");
    process.exit(1);
  }

  const chunkPaths = getAllJsChunks(STATIC_CHUNKS_DIR);

  if (chunkPaths.length === 0) {
    console.error(`\n[CRITICAL ERROR] No client chunks found in: ${STATIC_CHUNKS_DIR}`);
    console.error("Please run 'npm run build' to generate client bundles before auditing.\n");
    process.exit(1);
  }

  const chunkResults: ChunkBudgetResult[] = [];
  let allPassed = true;
  let peakGzipKb = 0;
  let peakGzipName = "";

  for (const filePath of chunkPaths) {
    const content = fs.readFileSync(filePath);
    const gzipped = zlib.gzipSync(content);
    const rawBytes = content.length;
    const gzipBytes = gzipped.length;
    const rawKb = parseFloat((rawBytes / 1024).toFixed(2));
    const gzipKb = parseFloat((gzipBytes / 1024).toFixed(2));
    const passed = gzipKb <= MAX_ROUTE_CHUNK_GZIP_KB;

    if (!passed) {
      allPassed = false;
    }

    if (gzipKb > peakGzipKb) {
      peakGzipKb = gzipKb;
      peakGzipName = path.basename(filePath);
    }

    const fileName = path.basename(filePath);
    const relativePath = path.relative(STATIC_CHUNKS_DIR, filePath).replace(/\\/g, "/");

    chunkResults.push({
      file: relativePath,
      name: fileName,
      rawBytes,
      gzipBytes,
      rawKb,
      gzipKb,
      budgetKb: MAX_ROUTE_CHUNK_GZIP_KB,
      passed,
      type: classifyChunk(fileName, relativePath),
    });
  }

  // Sort descending by gzipKb for clear visibility of heaviest bundles
  chunkResults.sort((a, b) => b.gzipKb - a.gzipKb);

  const passedCount = chunkResults.filter((c) => c.passed).length;
  const failedCount = chunkResults.filter((c) => !c.passed).length;

  return {
    timestamp: new Date().toISOString(),
    chunksDirectory: path.relative(ROOT_DIR, STATIC_CHUNKS_DIR).replace(/\\/g, "/"),
    totalChunks: chunkResults.length,
    passedCount,
    failedCount,
    maxBudgetGzipKb: MAX_ROUTE_CHUNK_GZIP_KB,
    peakGzipChunk: {
      name: peakGzipName,
      gzipKb: peakGzipKb,
    },
    chunks: chunkResults,
    allPassed,
  };
}

export function runBundleBudgetReport(): void {
  console.log("\n" + "=".repeat(86));
  console.log(" COGNITIVE EDGE CLINIC — CLIENT ROUTE BUNDLE BUDGET AUDITOR");
  console.log("=".repeat(86));
  console.log(` Target Directory:   .next/static/chunks`);
  console.log(` Budget Threshold:   ≤ ${MAX_ROUTE_CHUNK_GZIP_KB}.0 kB gzip per chunk`);
  console.log(` Execution Time:     ${new Date().toISOString()}`);
  console.log("-".repeat(86));

  const report = auditBundleBudgets();

  // Print Clean Terminal Table
  console.log(
    `| ${"Status".padEnd(8)} | ${"Chunk File".padEnd(30)} | ${"Raw Size".padStart(10)} | ${"Gzip Size".padStart(10)} | ${"Budget".padStart(9)} | ${"Margin".padStart(10)} |`
  );
  console.log(
    `|${"-".repeat(10)}|${"-".repeat(32)}|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(11)}|${"-".repeat(12)}|`
  );

  for (const chunk of report.chunks) {
    const statusText = chunk.passed ? "✓ PASS" : "✗ FAIL";
    const margin = chunk.gzipKb - MAX_ROUTE_CHUNK_GZIP_KB;
    const marginText =
      margin <= 0 ? `${margin.toFixed(1)} kB` : `+${margin.toFixed(1)} kB`;

    console.log(
      `| ${statusText.padEnd(8)} | ${chunk.name.padEnd(30)} | ${`${chunk.rawKb.toFixed(1)} kB`.padStart(10)} | ${`${chunk.gzipKb.toFixed(1)} kB`.padStart(10)} | ${`${MAX_ROUTE_CHUNK_GZIP_KB}.0 kB`.padStart(9)} | ${marginText.padStart(10)} |`
    );
  }

  console.log("=".repeat(86));
  console.log(
    ` Summary: Scanned ${report.totalChunks} client chunks | ${report.passedCount} Passed | ${report.failedCount} Failed`
  );
  console.log(
    ` Peak Bundle: ${report.peakGzipChunk.name} (${report.peakGzipChunk.gzipKb.toFixed(1)} kB gzip, ${((report.peakGzipChunk.gzipKb / MAX_ROUTE_CHUNK_GZIP_KB) * 100).toFixed(1)}% of budget)`
  );
  console.log("=".repeat(86));

  if (report.allPassed) {
    console.log(
      `\n[SUCCESS] All ${report.totalChunks} client route chunks are within the ${MAX_ROUTE_CHUNK_GZIP_KB}.0 kB gzip budget threshold.\n`
    );
    process.exit(0);
  } else {
    console.error(
      `\n[CRITICAL FAILURE] ${report.failedCount} chunk(s) exceeded the ${MAX_ROUTE_CHUNK_GZIP_KB}.0 kB gzip budget threshold:`
    );
    for (const failed of report.chunks.filter((c) => !c.passed)) {
      console.error(
        `  - ${failed.name}: ${failed.gzipKb.toFixed(1)} kB gzip (exceeded by +${(failed.gzipKb - MAX_ROUTE_CHUNK_GZIP_KB).toFixed(1)} kB)`
      );
    }
    console.error("\nBundle budget verification FAILED.\n");
    process.exit(1);
  }
}

// Auto-run if executed directly via CLI
if (!process.env.JEST_WORKER_ID) {
  runBundleBudgetReport();
}
