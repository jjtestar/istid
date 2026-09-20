import { createHighlight, deleteHighlight } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { HighlightFieldsSelect } from "@/components/admin/CascadingSelects";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { matchShortTitle } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const date = (value: Date) => new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(value);

const TYPE_LABELS: Record<string, string> = { GOAL: "Mål", SAVE: "Räddning", BLOOPER: "Blooper", OTHER: "Övrigt" };
const ROLE_LABELS: Record<string, string> = { SCORER: "Målskytt", ASSIST: "Assist", GOALKEEPER: "Målvakt" };

export default async function AdminHighlightsPage() {
  await requireAdmin();
  const [teams, trainings, matches, members, highlights] = await Promise.all([
    // Highlights can only be added for the current season or a season that hasn't
    // started yet — older seasons are historical data and shouldn't receive new content.
    prisma.team.findMany({ where: { archivedAt: null, season: { gte: DEFAULT_SEASON } }, orderBy: [{ season: "asc" }, { name: "asc" }] }),
    prisma.training.findMany({ orderBy: { startsAt: "desc" }, take: 60, select: { id: true, teamId: true, startsAt: true, location: true } }),
    prisma.match.findMany({ orderBy: { startsAt: "desc" }, take: 60, select: { id: true, teamId: true, startsAt: true, opponent: true, kind: true } }),
    prisma.teamMember.findMany({
      where: { team: { archivedAt: null, season: { gte: DEFAULT_SEASON } } },
      orderBy: { user: { name: "asc" } },
      select: { userId: true, teamId: true, user: { select: { name: true } } },
    }),
    prisma.highlight.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        team: true,
        author: { select: { name: true } },
        training: true,
        match: true,
        players: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const activities = [
    ...trainings.map((t) => ({ id: t.id, teamId: t.teamId, label: `${date(t.startsAt)} · ${t.location}`, kind: "training" as const })),
    ...matches.map((m) => ({ id: m.id, teamId: m.teamId, label: `${date(m.startsAt)} – ${matchShortTitle(m)}`, kind: "match" as const })),
  ];
  const rosterPlayers = members.map((m) => ({ id: m.userId, teamId: m.teamId, label: m.user.name ?? "Namnlös spelare" }));

  const groups = new Map<string, { label: string; items: typeof highlights }>();
  for (const h of highlights) {
    const key = h.trainingId ? `training:${h.trainingId}` : h.matchId ? `match:${h.matchId}` : "none";
    const label = h.training
      ? `Träning · ${date(h.training.startsAt)} · ${h.training.location} · ${h.team.name}`
      : h.match
        ? `${h.match.kind === "CUP" ? "Cup" : "Match"} · ${date(h.match.startsAt)} – ${h.match.opponent} · ${h.team.name}`
        : "Utan koppling till match/träning";
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(h);
  }

  return (
    <div>
      <AdminHeader title="Highlights" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Nytt klipp</Eyebrow>
          <h2 className="mt-1 section-title">Lägg till highlight</h2>
          {teams.length === 0 ? (
            <p className="mt-3 text-sm text-ink-subtle">Inga lag för säsongen {DEFAULT_SEASON} eller senare hittades.</p>
          ) : (
            <AdminForm action={createHighlight} submitLabel="Lägg till highlight" className="mt-4 grid gap-3 lg:grid-cols-2" submitClassName="h-11 rounded-xl bg-ink font-bold text-white disabled:opacity-60 lg:col-span-2">
              <input name="title" required maxLength={120} placeholder="Rubrik, exempelvis Mål 2–1" className={field} />
              <input name="url" required type="url" placeholder="Länk till klippet" className={field} />
              <HighlightFieldsSelect
                teams={teams.map((t) => ({ id: t.id, label: `${t.name} · ${t.season}` }))}
                activities={activities}
                players={rosterPlayers}
              />
            </AdminForm>
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-divider p-5"><h2 className="section-title">Publicerade highlights</h2></div>
          {highlights.length ? (
            <div className="divide-y divide-divider">
              {Array.from(groups.values()).map((group) => (
                <div key={group.label} className="p-4">
                  <Eyebrow>{group.label}</Eyebrow>
                  <div className="mt-3 space-y-3">
                    {group.items.map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-divider bg-white/60 p-3">
                        <div className="min-w-0">
                          <a href={h.url} target="_blank" rel="noreferrer" className="block truncate font-bold underline underline-offset-4">{h.title}</a>
                          <p className="text-sm text-ink-subtle">
                            {TYPE_LABELS[h.type] ?? h.type} · {date(h.createdAt)} · {h.author.name}
                          </p>
                          {h.players.length > 0 ? (
                            <p className="mt-0.5 text-sm text-ink-subtle">
                              {h.players.map((p) => `${ROLE_LABELS[p.role] ?? p.role}: ${p.user.name ?? "Namnlös spelare"}`).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <AdminForm action={deleteHighlight} submitLabel="Ta bort" submitClassName="rounded-xl border border-divider px-3 py-2 text-xs font-bold text-signal">
                          <input type="hidden" name="highlightId" value={h.id} />
                        </AdminForm>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="p-5 text-sm text-ink-subtle">Inga highlights ännu.</p>}
        </Card>
      </main>
    </div>
  );
}
