import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const textarea = "min-h-28 w-full rounded-xl border border-divider bg-white px-3 py-2.5 text-base outline-none focus:border-ink";
const fmt = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" });

function TeamCheckboxes({ teams, selectedTeamIds }: { teams: { id: string; name: string }[]; selectedTeamIds: Set<string> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {teams.map((team) => (
        <label
          key={team.id}
          className="flex items-center gap-2 rounded-xl border border-divider px-3 py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-rink-crease"
        >
          <input type="checkbox" name="teamIds" value={team.id} defaultChecked={selectedTeamIds.has(team.id)} className="h-4 w-4" />
          {team.name}
        </label>
      ))}
    </div>
  );
}

export default async function AdminInformationPage() {
  await requireAdmin();
  const [teams, announcements] = await Promise.all([
    prisma.team.findMany({ where: { archivedAt: null, season: DEFAULT_SEASON }, orderBy: { name: "asc" } }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { teams: { select: { id: true, name: true } }, author: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <AdminHeader title="Information" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Ny information</Eyebrow>
          <h2 className="mt-1 section-title">Publicera till Hem-fliken</h2>
          {teams.length === 0 ? (
            <p className="mt-3 text-sm text-ink-subtle">Inga lag för säsongen {DEFAULT_SEASON} hittades.</p>
          ) : (
            <AdminForm action={createAnnouncement} submitLabel="Publicera" className="mt-4 space-y-3">
              <input name="title" required maxLength={120} placeholder="Rubrik" className={field} />
              <textarea name="body" required maxLength={4000} placeholder="Meddelande" className={textarea} />
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Vilka lag ska se detta?</p>
                <TeamCheckboxes teams={teams} selectedTeamIds={new Set()} />
              </div>
            </AdminForm>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-divider p-5"><h2 className="section-title">Publicerad information</h2></div>
          {announcements.length ? (
            <div className="divide-y divide-divider">
              {announcements.map((announcement) => (
                <details key={announcement.id} className="group p-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{announcement.title}</p>
                      <p className="mt-1 truncate text-sm text-ink-subtle">
                        {fmt.format(announcement.createdAt)} · {announcement.author.name ?? "Administratör"} ·{" "}
                        {announcement.teams.map((t) => t.name).join(", ") || "Inga lag valda"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-signal group-open:hidden">Redigera</span>
                  </summary>
                  <div className="mt-3 space-y-4">
                    <AdminForm action={updateAnnouncement} submitLabel="Spara ändringar" className="space-y-3">
                      <input type="hidden" name="announcementId" value={announcement.id} />
                      <input name="title" required maxLength={120} defaultValue={announcement.title} className={field} />
                      <textarea name="body" required maxLength={4000} defaultValue={announcement.body} className={textarea} />
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Vilka lag ska se detta?</p>
                        <TeamCheckboxes teams={teams} selectedTeamIds={new Set(announcement.teams.map((t) => t.id))} />
                      </div>
                    </AdminForm>
                    <AdminForm
                      action={deleteAnnouncement}
                      submitLabel="Ta bort"
                      submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
                    >
                      <input type="hidden" name="announcementId" value={announcement.id} />
                    </AdminForm>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-ink-subtle">Ingen information publicerad ännu.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
