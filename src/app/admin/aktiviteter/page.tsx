import { createMatch, createTraining } from "@/app/admin/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const fmt = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminActivitiesPage() {
  await requireAdmin();
  const [teams, trainings, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season:"desc" },{ name:"asc" }] }),
    prisma.training.findMany({ orderBy:{ startsAt:"desc" }, take:20, include:{ team:true } }),
    prisma.match.findMany({ orderBy:{ startsAt:"desc" }, take:20, include:{ team:true } }),
  ]);
  return <div><AdminHeader title="Aktiviteter" /><main className="space-y-6 px-5 pb-10">
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><Eyebrow>Träning</Eyebrow><h2 className="mt-1 section-title">Skapa träning</h2><form action={createTraining} className="mt-4 space-y-3">
        <select name="teamId" required className={field}>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}</select>
        <input name="startsAt" type="datetime-local" required className={field}/><input name="location" required placeholder="Plats" className={field}/><input name="notes" placeholder="Anteckning (valfritt)" className={field}/>
        <button className="h-11 w-full rounded-xl bg-ink font-bold text-white">Skapa träning</button>
      </form></Card>
      <Card className="p-5"><Eyebrow>Match</Eyebrow><h2 className="mt-1 section-title">Skapa match</h2><form action={createMatch} className="mt-4 space-y-3">
        <select name="teamId" required className={field}>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}</select>
        <input name="startsAt" type="datetime-local" required className={field}/><input name="opponent" required placeholder="Motståndare" className={field}/><input name="location" required placeholder="Plats" className={field}/>
        <select name="isHome" className={field}><option value="true">Hemmamatch</option><option value="false">Bortamatch</option></select>
        <button className="h-11 w-full rounded-xl bg-ink font-bold text-white">Skapa match</button>
      </form></Card>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="section-title">Senaste träningarna</h2><div className="mt-3 divide-y divide-divider">{trainings.map(t=><div key={t.id} className="py-3"><p className="font-bold">{t.team.name}</p><p className="text-sm text-ink-subtle">{fmt.format(t.startsAt)} · {t.location}</p></div>)}</div></Card>
      <Card className="p-5"><h2 className="section-title">Senaste matcherna</h2><div className="mt-3 divide-y divide-divider">{matches.map(m=><div key={m.id} className="py-3"><p className="font-bold">{m.team.name} – {m.opponent}</p><p className="text-sm text-ink-subtle">{fmt.format(m.startsAt)} · {m.location}</p></div>)}</div></Card>
    </div>
  </main></div>;
}
