# Femtekedjan

Hockeyapp för anmälan till träningar, matcher och cuper, samt statistik och
lagadministration. Byggd med Next.js (App Router), Prisma och Auth.js.
Fristående app, separat från övriga projekt (schema, herrgris) — egen databas,
eget deploy.

Publikt appnamn är **Femtekedjan**. Repot heter `istid` och cookies/cachar
heter `istid-*` — det är tekniska arv som hålls stabila för kompatibilitet.

## Innehåll

- [Vad appen gör](#vad-appen-gör)
- [Stack](#stack)
- [Kom igång lokalt](#kom-igång-lokalt)
- [Koppla till Vercel Postgres (Neon)](#koppla-till-vercel-postgres-neon)
- [Arkitektur](#arkitektur)
- [Autentisering och behörighet](#autentisering-och-behörighet)
- [Databasschema](#databasschema)
- [Funktioner per vy](#funktioner-per-vy)
- [Administration](#administration)
- [Återkommande aktiviteter och tidszon](#återkommande-aktiviteter-och-tidszon)
- [PWA och offline](#pwa-och-offline)
- [Teman](#teman)
- [Säkerhet och integritet](#säkerhet-och-integritet)
- [Prestanda och bundlestorlek](#prestanda-och-bundlestorlek)
- [Tester](#tester)
- [Scripts](#scripts)
- [Kända begränsningar](#kända-begränsningar)

## Vad appen gör

Tre saker är kärnan:

1. **Anmälan** — spelare svarar "Kommer" eller "Kommer inte" (med orsak) på
   träningar, matcher och cuper.
2. **Statistik** — mål, assist, utvisningsminuter och träningsnärvaro per
   spelare, plus lagfacit och topplistor.
3. **Administration** — lag, spelare, aktiviteter, betalningar, information,
   highlights och laguppställningar.

Appen är mobilförst (flikfält i botten) men har full desktoplayout med fast
sidomeny och tvåkolumnsrutnät. Allt gränssnitt är på svenska och alla tider
räknas i `Europe/Stockholm`.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Tailwind v4)
- **Prisma 6** mot Postgres via `@prisma/adapter-neon` (driver adapter,
  `engineType = "client"`) — körs mot **Vercel Postgres (Neon)**
- **Auth.js (NextAuth v5)** med Credentials-provider (e-post + lösenord),
  JWT-sessioner
- **Vercel** för hosting/deploy

Allt skrivande går via **Server Actions**; all läsning sker i Server
Components. Utöver Auth.js finns exakt en API-route: `/api/my-data`
(GDPR-export).

## Kom igång lokalt

1. Installera beroenden:

   ```bash
   npm install
   ```

2. Kopiera `.env.example` till `.env` och fyll i:
   - `DATABASE_URL` — pooled anslutningssträng till en Postgres-databas
   - `DATABASE_URL_UNPOOLED` — direkt anslutning, används av Prisma Migrate
   - `AUTH_SECRET` — generera med `npx auth secret`. Appen vägrar starta utan
     den, och samma hemlighet nycklar HMAC-hashningen av PIN-koder — byter du
     den blir alla utestående inbjudningar ogiltiga.

   `prisma.config.ts` läser in `.env.local` och `.env` själv. Prisma CLI
   slutar läsa in dem automatiskt så fort en konfigurationsfil finns, och
   utan den raden skulle `db:migrate` och `db:seed` sakna `DATABASE_URL`
   lokalt.

3. Skapa databastabellerna:

   ```bash
   npm run db:migrate
   ```

4. Valfritt: fyll databasen med exempeldata (tre lag, tre säsonger, spelare,
   matcher och resultat):

   ```bash
   npm run db:seed
   ```

5. Starta dev-servern:

   ```bash
   npm run dev
   ```

   Öppna [http://localhost:3000](http://localhost:3000).

## Koppla till Vercel Postgres (Neon)

1. Vercel-projektet är kopplat till detta repo.
2. I projektet på vercel.com: **Storage → Create Database → Postgres**
   (drivs av Neon). Detta lägger automatiskt till `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED` m.fl. env-variabler på projektet.
3. Klart. `npm run build` kör `prisma migrate deploy` och `prisma generate`
   innan appen byggs, så varje deploy på Vercel skapar/uppdaterar tabellerna i
   Neon-databasen — inget manuellt migrationssteg behövs i produktion.

För lokal utveckling: dra ner env-variablerna med `vercel env pull .env`
(kräver att du är inloggad med `vercel login`), och kör sedan
`npm run db:migrate` för att skapa/uppdatera din egen migration.

## Arkitektur

```
src/
  app/            Routes (Server Components) + Server Actions per område
    actions.ts      RSVP, kontextbyte, spelarprofil, säsongsdeltagande
    admin/          Adminmoduler + admin/actions.ts (alla adminåtgärder)
    api/my-data/    GDPR-export som nedladdningsbar JSON
    sw.js/          Genererad service worker, versionerad per commit
  components/     Delade UI-primitiver och klientkomponenter
  lib/            Datahämtning, behörighet, formatering, domänlogik
  proxy.ts        Next 16:s efterföljare till middleware (ren tokenkontroll)
prisma/
  schema.prisma   Datamodellen
  migrations/     En mapp per migration, körs av `prisma migrate deploy`
  seed.ts         Exempeldata
prisma.config.ts  Prisma CLI:s konfiguration (schemasökväg, seed, .env)
```

`src/lib/` är medvetet fritt från serverberoenden där klientkomponenter
importerar det — `player.ts`, `rsvp.ts` och `lineup.ts` innehåller konstanter,
typer och validering utan Prisma, så att de kan delas åt båda hållen.

Centrala moduler:

| Modul | Ansvar |
| --- | --- |
| `lib/auth.ts` | Auth.js-konfiguration, Credentials-provider, callbacks |
| `lib/current-user.ts` | Identitet, lag-/säsongskontext från cookies, `DEFAULT_SEASON` |
| `lib/admin.ts` | `requireAdmin`, `requireSuperAdmin`, `audit` |
| `lib/queries.ts` | All läsning för spelarvyerna |
| `lib/schedule.ts` | Tidszon och återkommande serier |
| `lib/onboarding.ts` | Välkomstformulärets kontext, lediga tröjnummer |
| `lib/lineup.ts` | Laguppställningens form och validering |
| `lib/invite-security.ts` | HMAC-hashning av PIN- och återställningskoder |
| `lib/pwa-service-worker.ts` | Service worker-källa |
| `lib/theme.ts` | Temaval per konto |

## Autentisering och behörighet

`src/proxy.ts` kör Auth.js, men callbacken `authorized` gör **bara** en
tokenkontroll (`Boolean(session?.user?.email)`) — ingen databasfråga. Proxyn
träffas av varje sidladdning, RSC-fetch och Server Action-POST, så en
roundtrip där kostade mer än den gav. Den riktiga kontrollen görs i stället
där användaren ändå läses:

- `getSessionUser()` — smal identitetsfråga (Anmälan, Kalender)
- `getCurrentUserWithTeam()` — identitet, medlemskap och valt lag/säsong
- `requireAdmin()` / `requireSuperAdmin()`
- samt varje RSVP-action, `setTheme` och `/api/my-data` var för sig

Alla avvisar spärrade (`isActive = false`) och oapprovade
(`accessApproved = false`) konton, så en återkallad behörighet slår igenom på
nästa request. `/login` känner igen en förlegad sessionscookie och erbjuder
utloggning i stället för att skapa en redirect-loop.

**Lägger du till en ny route eller action måste den själv göra en av dessa
kontroller.** Proxyn gör den inte åt dig.

### Roller

`PLAYER` → `ADMIN` → huvudadmin (`isSuperAdmin`, max 2 stycken). En admin kan
inte spärra eller degradera en annan admin — bara en huvudadmin kan. Admins
ser och kan hantera alla icke-arkiverade lag oavsett medlemskap.

`COACH` finns i `Role`-enumen men används inte i koden i dag.

### Lag- och säsongskontext

Cookies `istid-team` och `istid-season` styr vilket lag som visas på Hem,
Laget och Statistik. `changeAppContext` validerar valet mot de lag användaren
faktiskt får se innan cookien sätts. Anmälan och Kalender går inte via cookien
utan aggregerar **alla** lag spelaren har i den valda säsongen.

## Databasschema

Hela modellen finns i `prisma/schema.prisma`. Naven är `User`, `Team` och
kopplingstabellen `TeamMember`.

**Identitet och medlemskap**

- `User` — roll, `isActive`, `accessApproved`, `isSuperAdmin`, `theme`,
  `onboardedAt`, samt spelarfält (längd, vikt, fattning, telefon,
  anhörigkontakt).
- `Team` — namn + `season` (formatet `2026/27`), `archivedAt` för arkivering.
- `TeamMember` — tröjnummer, `position` (adminens beslut) och
  `preferredPosition` (spelarens önskemål), `playingThisSeason`,
  `participatesInMatches`, `trainingDays[]`.

**Aktiviteter**

- `Training` + `TrainingRegistration` (anmälan, `absenceReason`, `attended`)
- `Match` + `MatchRegistration`. `Match.kind` skiljer en vanlig match från en
  cup — för en cup bär `opponent` cupens namn och `endsAt` säger när den är
  slut.
- `Training.seriesId` / `Match.seriesId` binder ihop tillfällen som skapats i
  samma återkommande serie i **Admin → Aktiviteter**, så att hela serien kan
  visas och tas bort på en gång.

**Runt omkring**

- `MatchStat` — mål, assist, utvisningsminuter per spelare och match
- `Highlight` + `HighlightPlayer` — videolänkar med typ (mål, räddning,
  blooper, övrigt) och taggade spelare i roll målskytt/assist/målvakt
- `LineupPlan` — laguppställning som JSON (4 kedjor × 3, 3 backpar × 2,
  2 målvakter), unik per träning respektive match
- `PlayerRequest` — efterlysning av målvakt eller utespelare till ett tillfälle
- `Payment` — belopp i **öre**, förfallodatum, `paidAt`
- `Announcement` — information riktad till valda lag (many-to-many)
- `InviteCode`, `PasswordResetCode`, `RegistrationAttempt` — se
  [Säkerhet och integritet](#säkerhet-och-integritet)
- `AdminAuditLog` — varje adminåtgärd loggas med aktör, typ och detaljer

Utöka schemat och kör `npm run db:migrate` för att skapa en ny migration.

> Det finns medvetet **ingen unik constraint på (lag, tröjnummer)**.
> Kollisionskontrollen görs i stället i serialiserbara transaktioner i
> `completeOnboarding` och `updatePlayerDetails`. Lägger du till en tredje väg
> att sätta tröjnummer måste den följa samma mönster.

## Funktioner per vy

### Ny spelare

1. En admin skapar en **PIN-inbjudan** under Admin → Användare: sex siffror,
   bundna till e-post och lag, giltiga i 14 dagar, engångsbruk. Koden visas en
   gång för adminen och lämnas över utanför appen (ingen e-post skickas).
2. Spelaren går till `/registrera` och anger namn, e-post, lösenord (minst
   8 tecken med både bokstav och siffra), PIN och bekräftar 18-årsgränsen.
   Kontot skapas och kopplas till laget i en transaktion som "claimar"
   inbjudan, så två samtidiga försök inte kan förbruka samma kod.
3. Spelaren loggas in direkt och hamnar på **`/valkommen`**. Tills
   `onboardedAt` är satt skickar varje ingång tillbaka dit. Där fylls telefon,
   anhörigkontakt, längd, vikt, fattning, önskad position, ledigt tröjnummer
   (upptagna nummer visas med vem som bär dem) och säsongsdeltagande i.

### Spelarens flikar

- **Hem** (`/`) — information från admin, highlights grupperade per tillfälle,
  samt "Senast spelat" med resultat.
- **Anmälan** (`/anmalan`) — ett kort per kommande tillfälle, alla identiska
  oavsett om de är enstaka eller del av en serie. Näst på tur markeras, och
  öppna spelarefterlysningar visas överst. Varje kort har en segmenterad
  kontroll: *Kommer* / *Kommer inte* / *Lag*. "Kommer inte" kräver en orsak
  (Trött, Sjuk, Semester, Annat) innan något sparas. "Lag" öppnar en modal med
  hela truppens svar. Finns en sparad lagindelning visas den utfällbar.
- **Statistik** (`/statistik`) — tre vyer: *Spelarstatistik* (valbar spelare,
  poäng, matcher, träningsnärvaro i procent, senaste matcher), *Topplistor*
  (mål, assist, poäng, utvisningsminuter — topp tre, klickbara) och *Laget*
  (facit, målskillnad, poäng, spelartabell).
- **Kalender** (`/kalender`) — veckostrimma och händelser grupperade per dag
  med snabbknapp för anmälan. Säsongsväljare för historiska säsonger; där
  visas bara "Ej anmäld" i stället för knappar.
- **Laget** (`/lag`) — trupplista med nummer, position och säsongsdeltagande.
- **Betalningar** (`/betalningar`) — egna avgifter, obetalt-summa, filter per
  lag.
- **Min profil** (`/min-profil`) — kontouppgifter (namn och e-post hanteras av
  admin och går inte att ändra här), spelarprofil, säsongsdeltagande, länk
  till integritetssidan, logga ut.
- **Mer** (`/mer`) — genvägar (bara på mobil; sidomenyn täcker dem på
  desktop), teman, installera app, integritet.

Anmälan är **optimistisk**: `useOptimistic` + `useTransition` gör att
kontrollen sätter sig direkt på tryck i stället för att vänta ut en full
rundtur, och faller tillbaka med felmeddelande om servern nekar.

## Administration

Allt under `/admin` ligger bakom `requireAdmin()` och loggas i
`AdminAuditLog`.

| Modul | Vad den gör |
| --- | --- |
| **Användare** | PIN-inbjudningar, spärra/aktivera konton, roller, huvudadmin, inbjudningshistorik |
| **Information** | Publicera nyheter till valda lag i innevarande säsong (visas på Hem) |
| **Lag & spelare** | Skapa, redigera och arkivera lag; sätta medlemskap och positioner |
| **Aktiviteter** | Enstaka och återkommande träningar, matcher och cuper; spelarefterlysningar |
| **Betalningar** | Skapa och redigera avgifter, markera betald/obetald |
| **Statistik & närvaro** | Registrera matchstatistik och träningsnärvaro |
| **Highlights** | Lägga till klipp med typ och taggade spelare |
| **Lagindelning** | Editor för kedjor, backpar och målvakter mot en ritad rink |
| **Adminlogg** | Filtrerbar och paginerad revisionshistorik |

Historisk data skyddas systematiskt: **bara innevarande säsongs lag** går att
tilldela spelare, ta emot information, få nya aktiviteter eller nya
highlights. Arkiverade lag och avslutade säsonger går att läsa men inte ändra.

## Återkommande aktiviteter och tidszon

`src/lib/schedule.ts` är liten men bär appens mest subtila logik, och är den
enda modulen med egna enhetstester.

- `stockholmDateTime("YYYY-MM-DDTHH:mm")` tolkar adminens lokala inmatning som
  svensk tid och ger motsvarande UTC, via `Intl` med
  `timeZoneName: "longOffset"` — inga hårdkodade offsets.
- `weeklyOccurrences()` stegar fram datum **på UTC-middag**, så att
  sommartidsskiften aldrig kan hoppa över eller dubblera ett dygn; klockslaget
  sätts först på slutet, i svensk tid. Stödjer valfria veckodagar, varje eller
  varannan vecka, och har ett tak på 200 tillfällen per serie.
- Formulären är förifyllda med lagets grundschema: träning tisdag och torsdag
  19:00, match söndag 18:00.
- `createTrainingSeries` / `createMatchSeries` hoppar över tillfällen som redan
  finns på laget vid samma tidpunkt, så ett formulär kan skickas om utan att
  det blir dubbletter. Alla tillfällen får samma `seriesId`.
- `deleteTrainingSeries` / `deleteMatchSeries` tar bara bort **kommande**
  tillfällen — historik och spelade matcher lämnas orörda.

## PWA och offline

- `src/app/manifest.ts` genererar manifestet. Appikonen är den vita skridskon
  med röd pjäxpanel på marinblått (`public/pwa/skate-*.png`).
- `src/app/sw.js/route.ts` serverar en service worker vars källa byggs av
  `src/lib/pwa-service-worker.ts`, versionerad på `VERCEL_GIT_COMMIT_SHA`.
  Varje deploy ger en ny waiting worker och en egen cache; gamla
  `istid-public-*`-cachar städas vid aktivering.
- Service workern är avsiktligt konservativ: den cachar **bara publika filer
  och en offline-sida**. Aldrig writes, API-svar, RSC-payloads, privata sidor,
  inloggningssvar eller tredjepartsvideo. Navigeringar går nät-först med
  offline-sidan som fallback.
- `PwaProvider` läser installations- och onlinestatus, hanterar
  `beforeinstallprompt`, iOS-specifika instruktioner, uppdateringsprompt
  (`SKIP_WAITING`) och blockerar formulärsubmits när enheten vet att den är
  offline.
- Proxy-matchern i `src/proxy.ts` undantar de publika ingångarna: `/pwa/`,
  `/sw.js`, `/manifest.webmanifest`, `/registrera` och `/integritet`, utöver
  `api/auth`, `_next/static`, `_next/image`, `favicon.ico` och
  `rink-background.png`. `npm run test:pwa` kontrollerar både att de är
  undantagna och att appens egna sidor inte är det.

## Teman

Två teman, **Ljus** (`classic`: vitt, marinblått, rött) och **Mörk** (`mint`:
mörkgrönt, mint, guld), valda per konto och sparade i databasen så att valet
följer med mellan enheter. De skiljer sig i mer än färg — `mint` har markant
rundare hörn. `generateViewport()` läser temat på servern och sätter
`themeColor` därefter, och `data-theme` sätts på `<html>` under
serverrendering, så det blir ingen felfärgad första paint.

Designspråket bygger på en rinkmetafor (`--color-rink-line-blue`,
`-crease`, `-goalline`), delade primitiver (`Card`, `Eyebrow`, `StatusLabel`,
`ExpandableList`), touchmål på minst 44 px och `focus-visible`-ringar
genomgående.

## Säkerhet och integritet

- **PIN-koder och lösenordsåterställningskoder lagras som HMAC-SHA256**
  (`src/lib/invite-security.ts`), aldrig i klartext. Nycklade på
  `AUTH_SECRET`.
- **Lösenord** bcrypt-hashas med cost 12.
- **Hastighetsbegränsning** på både inloggning och registrering: fem försök per
  (e-post + IP) inom 15 minuter, spårat i `RegistrationAttempt` med hashad
  nyckel.
- **Serialiserbara transaktioner** används för de kapplöpningar som saknar
  databasconstraint: tröjnummer (två ställen) och gränsen på två huvudadmins.
- **Revisionslogg** på varje adminåtgärd.
- **Validering av inskickad data**: laguppställningar kontrolleras mot truppen
  (`isValidLineupData`) så att JSON inte kan referera spelare utanför laget,
  och highlight-länkar måste vara http eller https.
- **GDPR**: `/integritet` beskriver ändamål, rättslig grund, lagring och
  rättigheter. `/api/my-data` exporterar allt appen vet om kontot som
  nedladdningsbar JSON, med egen behörighetskontroll eftersom proxyn inte gör
  någon. Åldersgränsen 18 år bekräftas vid registrering.

### Beroendeöversyn

`package.json` har en `overrides` som tvingar upp **`deepmerge-ts` till
`^8.0.2`**. Anledningen: `prisma` (devDependency) drar in `@prisma/config`,
som pinnar `deepmerge-ts@7.1.5` — sårbart för stack exhaustion enligt
[GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).

Ingen Prisma-release löser det i dag; även 7.10.0 pinnar samma version, och
`npm audit fix --force` föreslår en *nedgradering* till `prisma@6.12.0`.
Kör inte den. Overriden ger `npm audit` noll varningar och `prisma validate`
och `prisma generate` fungerar oförändrat.

Exponeringen ligger inte i produktion: `@prisma/client` har noll
runtime-beroenden (`prisma` är en optional peer), så CLI:t körs bara lokalt
och i bygget. Den enda `deepmerge`-användningen i `@prisma/config` ligger i
inläsningen av `prisma.config.ts` — vår egen fil, inte något utomstående kan
mata in. Overriden finns för att en framtida, verklig varning inte ska drunkna
i brus; ta bort den när Prisma själv uppgraderar.

## Prestanda och bundlestorlek

Några val är medvetna och bör inte rullas tillbaka utan att mäta:

- **Ingen databasfråga i proxyn** — se
  [Autentisering och behörighet](#autentisering-och-behörighet).
- **Två ingångar för identitet** — `getSessionUser` hoppar över `teams`-include
  och laguppslaget som `getCurrentUserWithTeam` behöver, för sidor som ändå
  väljer lag från databasen.
- **Smala `select` i `getUpcomingActivitiesForTeams`** — bara de kolumner
  korten faktiskt renderar. Hela rader skulle dras med per lagmedlem och
  anmälan vid varje rendering.
- **Prisma driver adapter i stället för query engine.** `next.config.ts`
  exkluderar `query_engine_bg.*`, `query_compiler_bg.*` och
  `@prisma/engines/**` ur varje funktionsbundle. `npm run check:bundle-size`
  fäller bygget om en motorbinär smyger tillbaka eller någon route passerar
  20 MB — den regressionen kostade en gång ~1,8 GB Function Storage per
  deploy.

CI (`.github/workflows/`) kör `npm run typecheck`, `next build` och
bundlekontrollen på varje pull request mot `main`.

## Tester

Två fristående Node-skript, körda med `tsx`:

```bash
npm run test:schedule   # veckodagar, varannan vecka, sommartid, seriegränser
npm run test:pwa        # proxy-matchern och service workerns beteende
npm run lint            # ESLint
npm run typecheck       # next typegen && tsc --noEmit
```

`test:pwa` kör service workern i en `vm`-sandbox och kontrollerar
proxy-matchern med Next:s `unstable_doesMiddlewareMatch`.

Kör `tsc --noEmit` direkt och du får `Cannot find name 'LayoutProps'`. Typer
som `LayoutProps<"/">` genereras av Next till `.next/types` och finns inte
förrän något har byggt dem, så `typecheck` kör `next typegen` först. Det
skriver också `next-env.d.ts`, som är gitignorerad.

CI kör `typecheck` före bygget, så ett typfel faller snabbt och med ett
tydligare meddelande än mitt i en build.

## Scripts

| Script | Vad det gör |
| --- | --- |
| `npm run dev` | Utvecklingsserver |
| `npm run build` | `prisma migrate deploy` + `prisma generate` + `next build` |
| `npm run start` | Startar ett byggt produktionsbygge |
| `npm run lint` | ESLint |
| `npm run typecheck` | Genererar Next:s ruttyper och kör `tsc --noEmit` |
| `npm run db:migrate` | Skapa/uppdatera lokal databas + migrationsfil |
| `npm run db:deploy` | Kör befintliga migrationer mot en databas (t.ex. prod) |
| `npm run db:seed` | Fyller databasen med exempeldata |
| `npm run db:studio` | Prisma Studio, GUI mot databasen |
| `npm run check:bundle-size` | Kontrollerar funktionsbundlarna efter `next build` |
| `npm run test:schedule` | Datumlogiken för återkommande aktiviteter |
| `npm run test:pwa` | Proxy-matchern och service workern |

## Kända begränsningar

- `Training` och `Match` är nära duplicerade modeller, vilket tvingar fram
  parallell kod i nästan varje query, action och vy.
- `DEFAULT_SEASON` (`"2026/27"`) och `DEFAULT_TEAM_SLUG` (`"kumla"`) är
  hårdkodade i `src/lib/current-user.ts`. Säsongsbyte kräver en kodändring och
  en deploy.
- Testtäckningen omfattar schemalogik och PWA. Varken RSVP-flödet,
  behörighetsgränserna eller adminåtgärderna testas automatiskt.
- `PasswordResetCode` finns i schemat och i produktionsdatabasen, men det
  finns inget gränssnitt som använder den — funktionen är inte färdig.
- `COACH` finns i `Role`-enumen men används inte.
- Ingen e-post skickas. PIN-koder förmedlas manuellt av adminen.
