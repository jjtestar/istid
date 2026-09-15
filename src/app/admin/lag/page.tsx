import { archiveTeam, assignTeamMember, createTeam, removeTeamMember, unarchiveTeam, updateTeam, updateTeamMember } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { ExpandableList } from "@/components/ExpandableList";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const [teams, users] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ archivedAt: "asc" }, { season: "desc" }, { name: "asc" }],
      include: { members: { orderBy: { user: { name: "asc" } }, include: { user: { select: { id: true, name: true, email: true, isActive: true } } } } },
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
  ]);
  const activeTeams = teams.filter((t) => !t.archivedAt);

  return (
    <div>
      <AdminHeader title="Lag & spelare" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Nytt lag</Eyebrow>
          <h2 className="mt-1 section-title">Skapa lag</h2>
          <form action={createTeam} className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
            <input name="name" required placeholder="Lagnamn" className={field} />
            <input name="season" required pattern="\d{4}/\d{2}" placeholder="2026/27" className={field} />
            <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Skapa</button>
          </form>
        </Card>
        <Card className="p-5">
          <Eyebrow>Medlemskap</Eyebrow>
          <h2 className="mt-1 section-title">Tilldela spelare</h2>
          <form action={assignTeamMember} className="mt-4 grid gap-3 lg:grid-cols-4">
            <select name="userId" required className={field}>{users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select>
            <select name="teamId" required className={field}>{activeTeams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}</select>
            <select name="position" className={field}><option value="">Ingen position</option><option>Forward</option><option>Back</option><option>Målvakt</option></select>
            <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Tilldela</button>
          </form>
        </Card>
        <ExpandableList initialCount={6} moreLabel="Visa fler lag" lessLabel="Visa färre lag" className="grid gap-5 xl:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className={`overflow-hidden ${team.archivedAt ? "opacity-60" : ""}`}>
              <div className="border-b border-divider p-5">
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>{team.season}{team.archivedAt ? " · Arkiverat" : ""}</Eyebrow>
                </div>
                <h2 className="mt-1 section-title">{team.name}</h2>
                <p className="mt-1 text-sm text-ink-subtle">{team.members.length} spelare</p>
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-sm font-bold text-signal group-open:hidden">Redigera lag</summary>
                  <div className="mt-3 space-y-3">
                    <AdminForm action={updateTeam} submitLabel="Spara ändringar" className="grid gap-2 sm:grid-cols-[1fr_8rem]" submitClassName="h-10 rounded-xl bg-ink text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">
                      <input type="hidden" name="teamId" value={team.id} />
                      <input name="name" required defaultValue={team.name} placeholder="Lagnamn" className={field} />
                      <input name="season" required pattern="\d{4}/\d{2}" defaultValue={team.season} className={field} />
                    </AdminForm>
                    {team.archivedAt ? (
                      <AdminForm action={unarchiveTeam} submitLabel="Återställ lag" submitClassName="h-10 w-full rounded-xl border border-divider text-sm font-bold text-ink">
                        <input type="hidden" name="teamId" value={team.id} />
                      </AdminForm>
                    ) : (
                      <AdminForm action={archiveTeam} submitLabel="Arkivera lag" submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal">
                        <input type="hidden" name="teamId" value={team.id} />
                      </AdminForm>
                    )}
                  </div>
                </details>
              </div>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 text-sm font-bold text-ink">
                  <span className="group-open:hidden">Visa trupp</span>
                  <span className="hidden group-open:inline">Dölj trupp</span>
                  <span className="text-ink-subtle transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                </summary>
                <div className="divide-y divide-divider border-t border-divider">
                  {team.members.length ? team.members.map((member) => (
                    <div key={member.id} className="p-4">
                      <p className="font-bold">{member.user.name ?? "Namnlös"}</p>
                      <p className="text-sm text-ink-subtle">{member.user.email}</p>
                      <div className="mt-3 flex gap-2">
                        <form action={updateTeamMember} className="flex min-w-0 flex-1 gap-2">
                          <input type="hidden" name="membershipId" value={member.id} />
                          <select name="position" defaultValue={member.position ?? ""} className={field}><option value="">Ingen position</option><option>Forward</option><option>Back</option><option>Målvakt</option></select>
                          <button className="rounded-xl border border-ink px-3 text-sm font-bold">Spara</button>
                        </form>
                        <form action={removeTeamMember}>
                          <input type="hidden" name="membershipId" value={member.id} />
                          <button className="h-11 rounded-xl border border-divider px-3 text-sm font-bold text-signal">Ta bort</button>
                        </form>
                      </div>
                    </div>
                  )) : <p className="p-5 text-sm text-ink-subtle">Inga spelare i laget.</p>}
                </div>
              </details>
            </Card>
          ))}
        </ExpandableList>
      </main>
    </div>
  );
}
