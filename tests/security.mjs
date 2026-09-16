import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  contentSecurityPolicy,
  isPublicPath,
  requiresAdmin,
  requiresSession,
  SECURITY_HEADERS,
} from '../src/lib/route-access.ts';
import { safeCallbackUrl } from '../src/lib/safe-redirect.ts';
import { isValidPinShape, generatePin, normalizeEmail, normalizePin } from '../src/lib/invite-security.ts';

const require = createRequire(import.meta.url);
const { unstable_doesMiddlewareMatch } = require('next/experimental/testing/server');
const fs = require('node:fs');
const vm = require('node:vm');

// --- Route policy ---------------------------------------------------------
// The regression this guards: the proxy used to compute an authorization
// result and then discard it, so nothing was ever redirected.
for (const path of ['/', '/min-profil', '/statistik', '/anmalan', '/kalender', '/admin', '/admin/anvandare', '/mer/teman']) {
  assert.equal(requiresSession(path), true, `${path} must require a session`);
}
for (const path of ['/login', '/registrera', '/aterstall', '/integritet']) {
  assert.equal(requiresSession(path), false, `${path} must stay public`);
}
// A public prefix must not open up unrelated routes that merely start with it.
for (const path of ['/loginer', '/integritetsskydd', '/aterstallning']) {
  assert.equal(isPublicPath(path), false, `${path} must not be treated as public`);
}
// Route handlers answer with their own status code rather than an HTML redirect.
assert.equal(requiresSession('/api/my-data'), false);

// --- Admin routes ---------------------------------------------------------
for (const path of ['/admin', '/admin/anvandare', '/admin/lagindelning/match/abc']) {
  assert.equal(requiresAdmin(path), true, `${path} must require an admin`);
}
for (const path of ['/', '/statistik', '/administration', '/adminx', '/mer']) {
  assert.equal(requiresAdmin(path), false, `${path} must not be treated as an admin route`);
}

// --- Proxy matcher --------------------------------------------------------
const proxySource = fs.readFileSync('src/proxy.ts', 'utf8');
const config = vm.runInNewContext(`(${proxySource.split('export const config = ')[1].replace(/;\s*$/, '')})`);
const matches = (path) =>
  unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: `https://example.test${path}` });

// Public assets the service worker needs without a session.
for (const path of ['/manifest.webmanifest', '/sw.js', '/pwa/offline.html', '/pwa/icon-192.png']) {
  assert.equal(matches(path), false, path);
}
// Everything that carries security headers, including the public pages.
for (const path of ['/', '/login', '/registrera', '/aterstall', '/integritet', '/api/my-data']) {
  assert.equal(matches(path), true, path);
}

// --- Content Security Policy ---------------------------------------------
const csp = contentSecurityPolicy('test-nonce');
assert.match(csp, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/);
assert.ok(!csp.includes("'unsafe-eval'"), 'unsafe-eval must not reach production');
assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp), 'scripts must not allow unsafe-inline');
assert.match(csp, /frame-ancestors 'none'/);
assert.match(csp, /object-src 'none'/);
assert.match(csp, /base-uri 'self'/);
assert.match(csp, /form-action 'self'/);
assert.match(contentSecurityPolicy('n', { development: true }), /'unsafe-eval'/);
for (const header of ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy']) {
  assert.ok(SECURITY_HEADERS[header], `${header} must be set`);
}

// --- Open redirect --------------------------------------------------------
assert.equal(safeCallbackUrl('/lag'), '/lag');
assert.equal(safeCallbackUrl('/lag?x=1'), '/lag?x=1');
for (const hostile of ['//evil.example', 'https://evil.example', 'javascript:alert(1)', '', null, undefined, 'lag']) {
  assert.equal(safeCallbackUrl(hostile), '/', `${hostile} must not be followed`);
}

// --- PIN codes ------------------------------------------------------------
const pin = generatePin();
assert.match(pin, /^\d{8}$/, 'new codes are 8 digits');
assert.equal(isValidPinShape(pin), true);
assert.equal(isValidPinShape('123456'), true, 'codes issued before the change still redeem');
assert.equal(isValidPinShape('1234567'), false);
assert.equal(isValidPinShape('123456789'), false);
assert.notEqual(generatePin(), generatePin());
assert.equal(normalizePin(' 12 34-56 78 '), '12345678');
assert.equal(normalizeEmail('  Spelare@Example.COM '), 'spelare@example.com');

console.log('PASS: route policy; proxy matcher; CSP and security headers; open-redirect guard; PIN codes.');
