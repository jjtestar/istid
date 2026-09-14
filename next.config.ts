import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    // prisma/schema.prisma sets generator.engineType = "client": this build
    // never touches the classic query engine at runtime (no native binary,
    // no engine WASM — Prisma's own generated config sets engineWasm to
    // undefined for this mode). The only file it loads is the query
    // *compiler* WASM/JS pair Prisma generates specifically for this
    // schema's single datasource into node_modules/.prisma/client/
    // query_compiler_bg.{js,wasm} (see src/lib/prisma.ts). Everything under
    // @prisma/client/runtime/ is the package's generic per-dialect/per-
    // engine-type template set that's never required at runtime — safe to
    // drop from every function bundle.
    "*": [
      "./node_modules/@prisma/client/runtime/query_engine_bg.*",
      "./node_modules/@prisma/client/runtime/query_compiler_bg.*",
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
