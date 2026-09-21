<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Product identity

The public app name is **Femtekedjan**. Use this name in the UI, page metadata, PWA manifest, installation help, exports, and documentation. The selected app icon is the white hockey skate with a red boot panel on navy blue. The repository name `istid` and existing `istid-*` cookie/cache identifiers are legacy technical identifiers; keep them stable for compatibility.

# What this app is

A Swedish-language hockey team app: RSVP for trainings, matches and cups;
player and team statistics; and an admin area for teams, activities, payments,
announcements, highlights and lineups. Mobile-first with a full desktop
layout. `README.md` holds the full architectural walkthrough — read it before
a non-trivial change.

# Language

All user-facing text is **Swedish**. Page titles, labels, buttons, validation
messages, empty states and error text included. Code identifiers are English;
domain nouns that only exist in Swedish (`lag`, `anmalan`, `valkommen`,
`betalningar`) stay Swedish in routes and form fields.

Comments are written in either language — match the file you are editing.
Comments explain *why*, not *what*; keep that habit.

# Architecture rules

- **Server Actions for every write.** There is no REST API and none should be
  added. The only non-Auth.js route is `/api/my-data` (GDPR export).
- **Server Components for every read.** Client components are for interaction
  only (`"use client"` on RSVP controls, pickers, the PWA provider).
- `src/lib/player.ts`, `src/lib/rsvp.ts` and `src/lib/lineup.ts` are imported
  by client components. **Keep Prisma and other server-only imports out of
  them.**
- Read data through `src/lib/queries.ts` rather than reaching for `prisma`
  directly in a page, unless the page is admin-only (those query directly by
  convention).

# Access control — the one rule that is easy to break

`src/proxy.ts` only checks that a session token exists. It makes **no database
query**, so it cannot see a blocked or unapproved account.

Every new route, Server Action and API route must therefore do its own check,
via one of:

- `getSessionUser()` — identity only
- `getCurrentUserWithTeam()` — identity plus cookie-selected team/season
- `requireAdmin()` / `requireSuperAdmin()` (`src/lib/admin.ts`)
- or an explicit scope on the write itself (see `setTheme` for the pattern)

All of them reject `isActive: false` and `accessApproved: false`. Do not
"simplify" this by moving the check back into the proxy — that was removed on
purpose (see the comment in `src/lib/auth.ts`).

Other invariants:

- Admins see all non-archived teams; players see only their own memberships.
- An admin may not block or demote another admin — only a super admin may.
  Super admins are capped at 2, enforced in a serializable transaction.
- Every admin action calls `audit(...)`.

# Season and history

- `DEFAULT_SEASON` and `DEFAULT_TEAM_SLUG` live in `src/lib/current-user.ts`
  and are hardcoded. Changing season is a code change.
- Only **current-season, non-archived** teams may receive new players, new
  activities, new announcements or new highlights. Past seasons are read-only
  history — keep that guard in any new admin action.
- Series deletion removes **upcoming** occurrences only; played activities stay.

# Dates and time

All activity times are Swedish local time stored as UTC.

- Parse admin input with `stockholmDateTime()`; format inputs with
  `stockholmDateTimeInput()` / `stockholmDateInput()`.
- Never construct activity dates with `new Date(y, m, d)` or hardcoded
  offsets. `weeklyOccurrences()` steps dates at UTC noon specifically so DST
  transitions cannot skip or duplicate a day.
- Touching `src/lib/schedule.ts` means running `npm run test:schedule`.

# Concurrency

There is **no unique constraint on (team, jersey number)**. The check lives in
`Serializable` transactions in `completeOnboarding` and `updatePlayerDetails`.
Any third path that assigns a jersey number must follow the same pattern, or
add the constraint and a migration.

# Security invariants

- PIN invites and password reset codes are stored as HMAC-SHA256
  (`src/lib/invite-security.ts`), never in plaintext. `AUTH_SECRET` is
  required and must not fall back to anything.
- Passwords are bcrypt with cost 12.
- Login and registration are rate limited per (email + IP) via
  `RegistrationAttempt` — keep new auth entry points behind the same limiter.
- Validate anything a client sends that indexes into team data: lineups
  against the roster (`isValidLineupData`), highlight URLs against
  http/https, enum-like fields against an allowlist.
- The `overrides` entry pinning `deepmerge-ts` to `^8.0.2` is deliberate — it
  patches a transitive advisory the Prisma CLI has not fixed upstream. Keep it
  until Prisma ships its own bump, and never run `npm audit fix --force` here:
  it proposes downgrading `prisma` seven minor versions. See README,
  "Beroendeöversyn".

# PWA

- The service worker caches **public files and the offline page only**. Never
  cache writes, API responses, RSC payloads, private pages, login responses or
  third-party video.
- The SW is versioned on `VERCEL_GIT_COMMIT_SHA`; an update waits rather than
  claiming clients immediately.
- Changing `src/proxy.ts`'s matcher or the SW means running
  `npm run test:pwa` — it asserts exactly which paths are exempt.

# Bundle size

`next.config.ts` excludes Prisma's query engine and non-Postgres query
compilers from every function bundle, and `scripts/check-function-bundle-size.mjs`
fails CI if one returns or a route exceeds 20 MB. Do not add a dependency that
pulls the Prisma engine back in, and do not relax the budget to make a build
pass.

# Styling

Tailwind v4 with CSS variables. Two themes (`classic`, `mint`) defined in
`src/app/globals.css` and selected per account. Use the semantic tokens
(`text-ink`, `bg-surface`, `text-signal`, `border-divider`, `rink-*`), not raw
hex values — a hardcoded colour breaks one of the two themes. Reuse `Card`,
`Eyebrow`, `StatusLabel`, `PageHeader`, `AdminHeader`, `AdminForm` and
`ExpandableList` rather than rebuilding them. Keep touch targets at 44 px or
more and keep `focus-visible` outlines.

# Before you finish

```bash
npm run lint
npm run test:schedule   # if you touched dates, series or activities
npm run test:pwa        # if you touched the proxy, manifest or service worker
```

Schema changes need a migration (`npm run db:migrate`) committed alongside the
code — production runs `prisma migrate deploy` on every deploy.
