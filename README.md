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
- `Training` + `TrainingRegistration` (anmälan till träning)
- `Match` + `MatchRegistration` (anmälan till match)
- `MatchStat` (mål, assist, utvisningsminuter per spelare och match)

Utöka schemat och kör `npm run db:migrate` för att skapa en ny migration.

## Scripts

- `npm run dev` — utvecklingsserver
- `npm run build` — produktionsbygge (kör `prisma generate` först)
- `npm run db:migrate` — skapa/uppdatera lokal databas + migrationsfil
- `npm run db:deploy` — kör befintliga migrationer mot en databas (t.ex. prod)
- `npm run db:studio` — Prisma Studio, GUI mot databasen
