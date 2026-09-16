# Femtekedjan

Hockeyapp för anmälan till träningar och matcher, samt statistik. Byggt med
Next.js (App Router), Prisma och Auth.js. Fristående app, separat från övriga
projekt (schema, herrgris) — egen databas, eget deploy.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Prisma** (v6) mot Postgres — tänkt att köra mot **Vercel Postgres (Neon)**
- **Auth.js (NextAuth v5)** med Credentials-provider (e-post + lösenord)
- **Vercel** för hosting/deploy

## Kom igång lokalt

1. Installera beroenden:

   ```bash
   npm install
   ```

2. Kopiera `.env.example` till `.env` och fyll i:
   - `DATABASE_URL` — anslutningssträng till en Postgres-databas
   - `AUTH_SECRET` — generera med `npx auth secret`

3. Skapa databastabellerna:

   ```bash
   npm run db:migrate
   ```

4. Starta dev-servern:

   ```bash
   npm run dev
   ```

   Öppna [http://localhost:3000](http://localhost:3000).

## Koppla till Vercel Postgres (Neon)

1. Vercel-projektet är kopplat till detta repo.
2. I projektet på vercel.com: **Storage → Create Database → Postgres**
   (drivs av Neon). Detta lägger automatiskt till `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED` m.fl. env-variabler på projektet.
3. Klart. `npm run build` kör `prisma migrate deploy` automatiskt innan
   appen byggs, så varje deploy på Vercel skapar/uppdaterar tabellerna i
   Neon-databasen — inget manuellt migrationssteg behövs i produktion.

För lokal utveckling: dra ner env-variablerna med `vercel env pull .env`
(kräver att du är inloggad med `vercel login`), och kör sedan
`npm run db:migrate` för att skapa/uppdatera din egen migration.

## Databas­schema

Grundmodellen finns i `prisma/schema.prisma`:

- `User` / `Team` / `TeamMember`
- `InviteCode` / `PasswordResetCode` (engångs-PIN, lagrade som HMAC)
- `RegistrationAttempt` (räknare för inloggnings- och PIN-spärr)
- `Training` + `TrainingRegistration` (anmälan till träning)
- `Match` + `MatchRegistration` (anmälan till match)
- `MatchStat` (mål, assist, utvisningsminuter per spelare och match)

Utöka schemat och kör `npm run db:migrate` för att skapa en ny migration.

## Säkerhetsmodell

- **Proxy** (`src/proxy.ts`) gör en optimistisk kontroll av sessionskakan och
  sätter säkerhetsheaders inklusive en nonce-baserad CSP. Den slår aldrig mot
  databasen — det är medvetet, enligt Next.js rekommendation.
- **Den auktoritativa kontrollen** sitter nära datan: `requireActiveUser()` och
  `requireAdmin()` läser kontot från databasen på varje sida och varje server
  action, så ett spärrat konto stoppas även om dess JWT fortfarande är giltig.
  Rotlayouten anropar `enforceRouteAccess()` så att avvisningen hinner bli en
  riktig 307 i stället för en meta-refresh.
- **Rate limiting** (`src/lib/rate-limit.ts`) har två hinkar: fem försök per
  (konto, IP) och tjugo per IP oavsett konto — den andra stoppar password
  spraying över många konton.
- **Lösenord**: nya konton skapas med en 8-siffrig engångs-PIN från en
  administratör. Glömt lösenord återställs med en ny PIN som administratören
  utfärdar under **Admin → Användare**, och som spelaren löser in på
  `/aterstall`. Inloggade byter lösenord under **Min profil**.

## Scripts

- `npm run dev` — utvecklingsserver
- `npm run build` — produktionsbygge (kör `prisma generate` först)
- `npm run db:migrate` — skapa/uppdatera lokal databas + migrationsfil
- `npm run db:deploy` — kör befintliga migrationer mot en databas (t.ex. prod)
- `npm run db:studio` — Prisma Studio, GUI mot databasen
- `npm run lint` / `npm run typecheck` — ESLint respektive TypeScript
- `npm test` — PWA- och säkerhetstester (körs i CI)
