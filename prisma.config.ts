import { loadEnvFile } from "node:process";

import { defineConfig } from "prisma/config";

// Så fort en konfigurationsfil finns slutar Prisma CLI läsa in `.env` själv,
// så filen gör det i stället — annars saknar `npm run db:migrate` och
// `npm run db:seed` sin DATABASE_URL lokalt. På Vercel och i CI finns
// variablerna redan i miljön, och då hittas ingen fil att läsa.
for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(file);
  } catch {
    // Filen finns inte. Det är det normala utanför lokal utveckling.
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Ersätter `package.json#prisma`, som tas bort i Prisma 7.
    seed: "tsx prisma/seed.ts",
  },
});
