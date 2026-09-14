import { redirect } from "next/navigation";
import { InviteForm } from "@/app/admin/anvandare/InviteForm";
import { revokeInvite, setUserAccess } from "@/app/admin/anvandare/actions";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function date(value: Date) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(value);
}

export default async function UserAdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin?.isActive || admin.role !== "ADMIN") redirect("/");

  const [teams, invitations, users] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }], select: { id: true, name: true, season: true } }),
    prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { team: { select: { name: true, season: true } }, usedBy: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, isActive: true, teams: { select: { team: { select: { name: true } } } } },
    }),
  ]);
  const now = new Date();

  return (
    <div>
      <PageHeader title="Användare" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Ny spelare</Eyebrow>
          <h2 className="mt-1 section-title">Skapa inbjudan</h2>
          <p className="mt-2 text-sm leading-6 text-ink-subtle">PIN-koden knyts till spelarens e-post och kan användas en gång.</p>
          <InviteForm teams={teams.map((team) => ({ id: team.id, label: `${team.name} · ${team.season}` }))} />
        </Card>

        <Card className="p-5">
          <Eyebrow>Konton</Eyebrow>
          <h2 className="mt-1 section-title">Användare</h2>
          <div className="mt-4 divide-y divide-divider">
            {users.map((user) => (
              <div key={user.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{user.name ?? "Namnlös användare"}</p>
                    <p className="truncate text-sm text-ink-muted">{user.email}</p>
                    <p className="mt-1 text-xs text-ink-subtle">{user.role === "ADMIN" ? "Administratör" : user.teams.map((item) => item.team.name).join(", ") || "Inget lag"}</p>
                  </div>
                  {user.id === admin.id ? <span className="rounded-full bg-rink-crease px-3 py-1 text-xs font-bold">Du</span> : (
                    <form action={setUserAccess}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="isActive" value={user.isActive ? "false" : "true"} />
                      <button className={`rounded-full border px-3 py-1 text-xs font-bold ${user.isActive ? "border-signal text-signal" : "border-ink bg-ink text-white"}`}>
                        {user.isActive ? "Spärra" : "Aktivera"}
                      </button>
                    </form>
                  )}
                </div>
                {!user.isActive ? <p className="mt-2 text-xs font-bold text-signal">Spärrad – kan inte logga in</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Eyebrow>Historik</Eyebrow>
          <h2 className="mt-1 section-title">PIN-koder</h2>
          <div className="mt-4 divide-y divide-divider">
            {invitations.length === 0 ? <p className="text-sm text-ink-muted">Inga inbjudningar ännu.</p> : invitations.map((invite) => {
              const status = invite.usedAt ? `Använd av ${invite.usedBy?.name ?? invite.email}` : invite.revokedAt ? "Återkallad" : invite.expiresAt <= now ? "Utgången" : "Aktiv";
              const active = status === "Aktiv";
              return (
                <div key={invite.id} className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{invite.email}</p>
                    <p className="text-xs text-ink-subtle">{invite.team.name} · {invite.team.season}</p>
                    <p className={`mt-1 text-xs font-bold ${active ? "text-ink" : "text-ink-subtle"}`}>{status} · {active ? `går ut ${date(invite.expiresAt)}` : date(invite.usedAt ?? invite.revokedAt ?? invite.expiresAt)}</p>
                  </div>
                  {active ? (
                    <form action={revokeInvite}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <button className="rounded-full border border-divider px-3 py-1 text-xs font-bold text-signal">Återkalla</button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
