import { saveMatchStat, saveTrainingAttendance } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { TeamActivityPlayerSelect } from "@/components/admin/CascadingSelects";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const when = (value: Date) => new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(value);

export default async function AdminStatsPage() {
  await requireAdmin();
  const [teams, matches, trainings, members] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }] }),
    prisma.match.findMany({ orderBy: { startsAt: "desc" }, take: 50, include: { team: true } }),
    prisma.training.findMany({ orderBy: { startsAt: "desc" }, take: 50, include: { team: true } }),
    prisma.teamMember.findMany({ orderBy: { user: { name: "asc" } }, include: { user: true, team: true } }),
  ]);

  const teamOptions = teams.map((t) => ({ id: t.id, label: `${t.name} · ${t.season}` }));
  const playerOptions = members.map((m) => ({ id: m.userId, teamId: m.teamId, label: m.user.name ?? "Namnlös spelare" }));

  return (
    <div>
      <AdminHeader title="Statistik & närvaro" />
      <main className="space-y-6 px-5 pb-10">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <Eyebrow>Match</Eyebrow>
            <h2 className="mt-1 section-title">Registrera spelarstatistik</h2>
            <AdminForm action={saveMatchStat} submitLabel="Spara matchstatistik" className="mt-4 space-y-3">
              <TeamActivityPlayerSelect
                teams={teamOptions}
                activities={matches.map((m) => ({ id: m.id, teamId: m.teamId, label: `${when(m.startsAt)} – ${m.opponent}` }))}
                players={playerOptions}
                activityName="matchId"
                activityLabel="matcher"
              />
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs font-bold">Mål<input name="goals" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`} /></label>
                <label className="text-xs font-bold">Assist<input name="assists" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`} /></label>
                <label className="text-xs font-bold">Utv. min<input name="penaltyMinutes" type="number" min="0" max="99" defaultValue="0" required className={`${field} mt-1`} /></label>
              </div>
            </AdminForm>
            <p className="mt-3 text-xs text-ink-subtle">Befintliga värden för spelaren och matchen ersätts.</p>
          </Card>
          <Card className="p-5">
            <Eyebrow>Träning</Eyebrow>
            <h2 className="mt-1 section-title">Registrera närvaro</h2>
            <AdminForm action={saveTrainingAttendance} submitLabel="Spara närvaro" className="mt-4 space-y-3">
              <TeamActivityPlayerSelect
                teams={teamOptions}
                activities={trainings.map((t) => ({ id: t.id, teamId: t.teamId, label: `${when(t.startsAt)} · ${t.location}` }))}
                players={playerOptions}
                activityName="trainingId"
                activityLabel="träningar"
              />
              <select name="attended" required className={field}>
                <option value="true">Närvarande</option>
                <option value="false">Frånvarande</option>
              </select>
            </AdminForm>
          </Card>
        </div>
      </main>
    </div>
  );
}
