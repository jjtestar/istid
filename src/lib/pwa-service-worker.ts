export function serviceWorkerSource(version: string) {
  return `const CACHE = ${JSON.stringify(`istid-public-${version}`)};
const OFFLINE = "/pwa/offline.html";
const PUBLIC_FILES = [OFFLINE, "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png", "/pwa/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_FILES)));
  // An update waits until the user chooses to reload or closes all old tabs.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("istid-public-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Never cache or queue writes, API requests, RSC payloads, private pages,
  // login responses or third-party videos.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      return (await caches.match(OFFLINE)) ?? new Response("Istid behöver internetanslutning.", {
        status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }));
  } else if (PUBLIC_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
});
`;
}
