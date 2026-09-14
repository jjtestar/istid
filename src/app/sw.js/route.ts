import { serviceWorkerSource } from "@/lib/pwa-service-worker";

export const dynamic = "force-static";

export function GET() {
  // Each deployed commit creates a waiting worker and its own public cache.
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? "development-v1";
  return new Response(serviceWorkerSource(version), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
