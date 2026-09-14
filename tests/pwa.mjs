import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { serviceWorkerSource } from '../src/lib/pwa-service-worker.ts';
import { GET } from '../src/app/sw.js/route.ts';
const require = createRequire(import.meta.url);
const manifest = require('../src/app/manifest.ts').default;
const { unstable_doesMiddlewareMatch } = require('next/experimental/testing/server');
const proxy = fs.readFileSync('src/proxy.ts', 'utf8');
const config = vm.runInNewContext(`(${proxy.split('export const config = ')[1].replace(/;\s*$/, '')})`);
for (const path of ['/manifest.webmanifest', '/sw.js', '/pwa/offline.html', '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png', '/pwa/apple-touch-icon.png']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: `https://example.test${path}` }), false, path);
}
for (const path of ['/', '/min-profil', '/statistik', '/anmalan', '/kalender', '/api/my-data', '/manifestXwebmanifest', '/swXjs']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: `https://example.test${path}` }), true, path);
}
const handlers = new Map();
const added = [];
const deleted = [];
let skipCount = 0;
let claimed = false;
let failNetwork = false;
let onlineResponse = new Response('private fresh data');
const offlineResponse = new Response('offline fallback');
vm.runInNewContext(serviceWorkerSource('test-commit'), {
    URL, Response,
    self: {
        location: { origin: 'https://example.test' },
        addEventListener: (type, handler) => handlers.set(type, handler),
        skipWaiting: () => skipCount++,
        clients: { claim: async () => { claimed = true; } },
    },
    fetch: async () => { if (failNetwork)
        throw new TypeError('offline'); return onlineResponse; },
    caches: {
        open: async (key) => {
            assert.equal(key, 'istid-public-test-commit');
            return { addAll: async (paths) => added.push(...paths) };
        },
        keys: async () => ['istid-public-old', 'istid-public-test-commit', 'unrelated-cache'],
        delete: async (key) => deleted.push(key),
        match: async (key) => key === '/pwa/offline.html' ? offlineResponse : undefined,
    },
});
async function lifecycle(type) {
    let task;
    handlers.get(type)({ waitUntil: (promise) => { task = promise; } });
    await task;
}
await lifecycle('install');
assert.equal(skipCount, 0, 'install does not replace worker underneath open forms');
assert.ok(added.length > 0 && added.every(path => path.startsWith('/pwa/')));
await lifecycle('activate');
assert.deepEqual(deleted, ['istid-public-old']);
assert.equal(claimed, true);
function request(path, method = 'GET', mode = 'cors') {
    let result;
    handlers.get('fetch')({
        request: { url: new URL(path, 'https://example.test').href, method, mode },
        respondWith: (promise) => { result = promise; },
    });
    return result;
}
assert.equal(await request('/min-profil', 'GET', 'navigate'), onlineResponse);
onlineResponse = new Response(null, { status: 307, headers: { Location: '/login' } });
assert.equal(await request('/', 'GET', 'navigate'), onlineResponse, 'authentication response preserved');
failNetwork = true;
assert.equal(await request('/kalender', 'GET', 'navigate'), offlineResponse);
assert.equal(request('/anmalan', 'POST', 'navigate'), undefined, 'no POST interception or queue');
assert.equal(request('/api/my-data'), undefined, 'API requests remain network-only');
assert.equal(request('/statistik?_rsc=example'), undefined, 'RSC payloads remain network-only');
assert.equal(request('https://youtu.be/JveRskYHN4U'), undefined, 'external highlights untouched');
handlers.get('message')({ data: { type: 'IGNORED' } });
assert.equal(skipCount, 0);
handlers.get('message')({ data: { type: 'SKIP_WAITING' } });
assert.equal(skipCount, 1);
assert.notEqual(serviceWorkerSource('first'), serviceWorkerSource('second'));
const m = manifest();
assert.equal(m.display, 'standalone');
assert.equal(m.start_url, '/');
assert.equal(m.scope, '/');
for (const icon of m.icons ?? [])
    assert.ok(fs.existsSync(`public${icon.src}`));
const workerResponse = GET();
assert.match(workerResponse.headers.get('Cache-Control'), /no-store/);
assert.match(workerResponse.headers.get('Content-Type'), /javascript/);
assert.equal(workerResponse.headers.get('Service-Worker-Allowed'), '/');
console.log('PASS: auth exclusions; protected app routes; public-only cache; offline fallback; no queued writes; RSC/API network-only; versioned updates; manifest and worker headers.');
