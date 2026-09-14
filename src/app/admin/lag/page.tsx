import { assignTeamMember, createTeam, removeTeamMember, updateTeamMember } from "@/app/admin/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const [teams, users] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }], include: { members: { orderBy: { user: { name: "asc" } }, include: { user: { select: { id: true, name: true, email: true, isActive: true } } } } } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
  ]);
  return <div><AdminHeader title="Lag & spelare" /><main className="space-y-6 px-5 pb-10">
    <Card className="p-5"><Eyebrow>Nytt lag</Eyebrow><h2 className="mt-1 section-title">Skapa lag</h2>
      <form action={createTeam} className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
        <input name="name" required placeholder="Lagnamn" className={field} />
        <input name="season" required pattern="\d{4}/\d{2}" placeholder="2026/27" className={field} />
        <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Skapa</button>
      </form>
    </Card>
    <Card className="p-5"><Eyebrow>Medlemskap</Eyebrow><h2 className="mt-1 section-title">Tilldela spelare</h2>
      <form action={assignTeamMember} className="mt-4 grid gap-3 lg:grid-cols-4">
        <select name="userId" required className={field}>{users.map((u)=><option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select>
        <select name="teamId" required className={field}>{teams.map((t)=><option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}</select>
        <select name="position" className={field}><option value="">Ingen position</option><option>Forward</option><option>Back</option><option>Målvakt</option></select>
        <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Tilldela</button>
      </form>
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">{teams.map((team)=><Card key={team.id} className="overflow-hidden">
      <div className="border-b border-divider p-5"><Eyebrow>{team.season}</Eyebrow><h2 className="mt-1 section-title">{team.name}</h2><p className="mt-1 text-sm text-ink-subtle">{team.members.length} spelare</p></div>
      <div className="divide-y divide-divider">{team.members.length ? team.members.map((member)=><div key={member.id} className="p-4">
        <p className="font-bold">{member.user.name ?? "Namnlös"}</p><p className="text-sm text-ink-subtle">{member.user.email}</p>
        <div className="mt-3 flex gap-2">
          <form action={updateTeamMember} className="flex min-w-0 flex-1 gap-2"><input type="hidden" name="membershipId" value={member.id}/><select name="position" defaultValue={member.position ?? ""} className={field}><option value="">Ingen position</option><option>Forward</option><option>Back</option><option>Målvakt</option></select><button className="rounded-xl border border-ink px-3 text-sm font-bold">Spara</button></form>
          <form action={removeTeamMember}><input type="hidden" name="membershipId" value={member.id}/><button className="h-11 rounded-xl border border-divider px-3 text-sm font-bold text-signal">Ta bort</button></form>
        </div>
      </div>) : <p className="p-5 text-sm text-ink-subtle">Inga spelare i laget.</p>}</div>
    </Card>)}</div>
  </main></div>;
}
