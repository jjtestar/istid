import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    // The app only ever talks to Postgres through @prisma/adapter-neon, so the
    // native/WASM query engine and the query compilers for every other SQL
    // dialect are dead weight Next's tracer would otherwise copy into every
    // function bundle.
    "*": [
      "./node_modules/.prisma/client/libquery_engine-*",
      "./node_modules/.prisma/client/query_engine-*",
      "./node_modules/.prisma/client/query_engine_bg.*",
      "./node_modules/@prisma/client/runtime/query_engine_bg.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.mysql.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.*",
      "./node_modules/@prisma/engines/**",
    ],
  },
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    }];
  },
};

export default nextConfig;
