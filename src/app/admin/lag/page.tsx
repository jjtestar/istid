import Link from "next/link";
import { archiveTeam, createTeam, setPlayerTeams, unarchiveTeam, updateTeam } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { ExpandableList } from "@/components/ExpandableList";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const [teams, users] = await Promise.all([
    prisma.team.findMany({
      orderBy: [{ archivedAt: "asc" }, { season: "desc" }, { name: "asc" }],
      include: { members: { orderBy: { user: { name: "asc" } }, include: { user: { select: { id: true, name: true, email: true, isActive: true } } } } },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        teams: { select: { teamId: true, position: true, team: { select: { archivedAt: true, name: true, season: true } } } },
      },
    }),
  ]);
  const activeTeams = teams.filter((t) => !t.archivedAt);
  // Only the current season's teams can be assigned to players — older seasons
  // are historical data and their rosters must stay frozen.
  const assignableTeams = activeTeams.filter((t) => t.season === DEFAULT_SEASON);

  return (
    <div>
      <AdminHeader title="Lag & spelare" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Nytt lag</Eyebrow>
          <h2 className="mt-1 section-title">Skapa lag</h2>
          <AdminForm
            action={createTeam}
            submitLabel="Skapa"
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
            submitClassName="h-11 rounded-xl bg-ink px-5 font-bold text-white disabled:opacity-60"
          >
            <input name="name" required placeholder="Lagnamn" className={field} />
            <input name="season" required pattern="\d{4}/\d{2}" placeholder="2026/27" className={field} />
          </AdminForm>
        </Card>
        <Card className="p-5">
          <Eyebrow>Medlemskap</Eyebrow>
          <h2 className="mt-1 section-title">Spelare</h2>
          <p className="mt-2 text-sm text-ink-subtle">
            Klicka på en spelare för att välja lag och position för säsongen {DEFAULT_SEASON}. Äldre säsonger
            är historisk data och går inte att ändra här.
          </p>
          <div className="mt-4 divide-y divide-divider">
            {users.map((user) => {
              const memberships = user.teams.filter((m) => !m.team.archivedAt);
              const summary = memberships.length
                ? memberships.map((m) => `${m.team.name}${m.position ? ` (${m.position})` : ""}`).join(", ")
                : "Inget lag";
              const isAdminUser = user.role === "ADMIN" || user.isSuperAdmin;
              return (
                <details key={user.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3">
                    <span>
                      <span className="font-bold">{user.name ?? user.email}</span>
                      <span className="block text-sm text-ink-subtle">{summary}</span>
                    </span>
                    <span className="text-ink-subtle transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  {isAdminUser ? (
                    <p className="mb-2 rounded-xl bg-rink-line-red px-3 py-2.5 text-sm font-semibold text-signal">
                      {user.isSuperAdmin ? "Huvudadmin" : "Admin"} – ser och kan hantera alla lag oavsett vad som är
                      ikryssat nedan. Ändra rollen under{" "}
                      <Link href="/admin/anvandare" className="underline underline-offset-2">
                        Användare
                      </Link>{" "}
                      om åtkomsten ska begränsas till valda lag.
                    </p>
                  ) : null}
                  <AdminForm
                    action={setPlayerTeams}
                    submitLabel="Spara"
                    className="space-y-2 pb-4"
                    submitClassName="h-10 rounded-xl border border-ink px-4 text-sm font-bold disabled:opacity-60"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    {assignableTeams.map((team) => {
                      const membership = memberships.find((m) => m.teamId === team.id);
                      return (
                        <div key={team.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-divider px-3 py-2 has-[:checked]:border-ink has-[:checked]:bg-rink-crease">
                          <label className="flex min-w-[10rem] flex-1 items-center gap-2 text-sm">
                            <input type="checkbox" name="teamIds" value={team.id} defaultChecked={Boolean(membership)} className="h-4 w-4" />
                            {team.name} · {team.season}
                          </label>
                          <select name={`position:${team.id}`} defaultValue={membership?.position ?? ""} className="h-10 rounded-lg border border-divider bg-white px-2 text-sm">
                            <option value="">Ingen position</option>
                            <option>Forward</option>
                            <option>Back</option>
                            <option>Målvakt</option>
                          </select>
                        </div>
                      );
                    })}
                  </AdminForm>
                </details>
              );
            })}
          </div>
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
                  <span className="group-open:hidden">Visa lag</span>
                  <span className="hidden group-open:inline">Dölj lag</span>
                  <span className="text-ink-subtle transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                </summary>
                <div className="divide-y divide-divider border-t border-divider">
                  {team.members.length ? team.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-bold">{member.user.name ?? "Namnlös"}</p>
                        <p className="text-sm text-ink-subtle">{member.user.email}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-rink-crease px-2 py-1 text-xs font-bold text-ink-subtle">{member.position ?? "Ingen position"}</span>
                    </div>
                  )) : <p className="p-5 text-sm text-ink-subtle">Inga spelare i laget. Lägg till dem under &quot;Spelare&quot; ovan.</p>}
                </div>
              </details>
            </Card>
          ))}
        </ExpandableList>
      </main>
    </div>
  );
}
