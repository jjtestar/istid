import { saveMatchStat, saveTrainingAttendance } from "@/app/admin/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const when=(value:Date)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium"}).format(value);

export default async function AdminStatsPage(){
  await requireAdmin();
  const [matches,trainings,members]=await Promise.all([
    prisma.match.findMany({orderBy:{startsAt:"desc"},take:50,include:{team:true}}),
    prisma.training.findMany({orderBy:{startsAt:"desc"},take:50,include:{team:true}}),
    prisma.teamMember.findMany({orderBy:{user:{name:"asc"}},include:{user:true,team:true}}),
  ]);
  return <div><AdminHeader title="Statistik & närvaro"/><main className="space-y-6 px-5 pb-10">
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><Eyebrow>Match</Eyebrow><h2 className="mt-1 section-title">Registrera spelarstatistik</h2><form action={saveMatchStat} className="mt-4 space-y-3">
        <select name="matchId" required className={field}>{matches.map(m=><option key={m.id} value={m.id}>{when(m.startsAt)} · {m.team.name} – {m.opponent}</option>)}</select>
        <select name="userId" required className={field}>{members.map(m=><option key={m.id} value={m.userId}>{m.user.name} · {m.team.name}</option>)}</select>
        <div className="grid grid-cols-3 gap-2"><label className="text-xs font-bold">Mål<input name="goals" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`}/></label><label className="text-xs font-bold">Assist<input name="assists" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`}/></label><label className="text-xs font-bold">Utv. min<input name="penaltyMinutes" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`}/></label></div>
        <button className="h-11 w-full rounded-xl bg-ink font-bold text-white">Spara matchstatistik</button>
      </form><p className="mt-3 text-xs text-ink-subtle">Befintliga värden för spelaren och matchen ersätts.</p></Card>
      <Card className="p-5"><Eyebrow>Träning</Eyebrow><h2 className="mt-1 section-title">Registrera närvaro</h2><form action={saveTrainingAttendance} className="mt-4 space-y-3">
        <select name="trainingId" required className={field}>{trainings.map(t=><option key={t.id} value={t.id}>{when(t.startsAt)} · {t.team.name} · {t.location}</option>)}</select>
        <select name="userId" required className={field}>{members.map(m=><option key={m.id} value={m.userId}>{m.user.name} · {m.team.name}</option>)}</select>
        <select name="attended" required className={field}><option value="true">Närvarande</option><option value="false">Frånvarande</option></select>
        <button className="h-11 w-full rounded-xl bg-ink font-bold text-white">Spara närvaro</button>
      </form></Card>
    </div>
  </main></div>;
}
