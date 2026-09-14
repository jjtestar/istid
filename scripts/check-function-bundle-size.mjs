#!/usr/bin/env node
// Fails the build if a Prisma query engine binary or a non-Postgres query
// compiler sneaks back into any route's traced function bundle, and warns
// if any single route's bundle grows unexpectedly large. This is the exact
// regression that once made Vercel Function Storage balloon to ~1.8GB per
// deployment (22 routes x ~82MB) before the driver-adapter migration.
import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = ".next/server";
const PER_ROUTE_BUDGET_BYTES = 20 * 1024 * 1024; // 20MB
const FORBIDDEN_PATTERNS = [
  /libquery_engine-/,
  /query_engine_bg\./,
  /query_compiler_bg\.(cockroachdb|mysql|sqlite|sqlserver)\./,
];

async function fileSize(p) {
  try {
    return (await import("node:fs")).statSync(p).size;
  } catch {
    return 0;
  }
}

async function main() {
  const traceFiles = [];
  for await (const f of glob(`${DIST_DIR}/app/**/*.nft.json`)) traceFiles.push(f);

  if (traceFiles.length === 0) {
    console.error(`No .nft.json trace files found under ${DIST_DIR}/app. Did \`next build\` run first?`);
    process.exit(1);
  }

  let failed = false;
  const rows = [];

  for (const traceFile of traceFiles) {
    const base = path.dirname(traceFile);
    const { files } = JSON.parse(await readFile(traceFile, "utf8"));

    const violations = files.filter((f) => FORBIDDEN_PATTERNS.some((re) => re.test(f)));
    let size = await fileSize(traceFile.replace(/\.nft\.json$/, ""));
    for (const f of files) size += await fileSize(path.normalize(path.join(base, f)));

    const route = traceFile.replace(`${DIST_DIR}/app/`, "").replace(/\/(page|route)\.js\.nft\.json$/, "");
    rows.push({ route, size, violations });

    if (violations.length > 0) {
      failed = true;
      console.error(`\n✗ ${route}: forbidden files present in bundle trace:`);
      for (const v of violations) console.error(`    ${v}`);
    }
    if (size > PER_ROUTE_BUDGET_BYTES) {
      failed = true;
      console.error(`\n✗ ${route}: bundle is ${(size / 1e6).toFixed(1)}MB, over the ${PER_ROUTE_BUDGET_BYTES / 1e6}MB budget`);
    }
  }

  rows.sort((a, b) => b.size - a.size);
  console.log("\nRoute bundle sizes (largest first):");
  for (const { route, size } of rows) {
    console.log(`  ${(size / 1e6).toFixed(1).padStart(6)}MB  ${route}`);
  }

  if (failed) {
    console.error(
      "\nBuild bundle check FAILED. This usually means the Prisma client is loading its native/WASM " +
        "query engine again (e.g. the @prisma/adapter-neon wiring in src/lib/prisma.ts was reverted, or " +
        "outputFileTracingExcludes in next.config.ts was removed), or a new dependency added a lot of " +
        "weight to a route that's replicated across every function bundle.",
    );
    process.exit(1);
  }

  console.log("\nBuild bundle check passed.");
}

main();
