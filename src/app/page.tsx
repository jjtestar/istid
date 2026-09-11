import { addHighlight, removeHighlight } from "@/app/actions";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader, formatTime } from "@/lib/format";
import { getCalendarEvents, getTeamHighlights } from "@/lib/queries";

export default async function Home() {
  const { user, team, context } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const [historicEvents, highlights] = await Promise.all([
    getCalendarEvents(user.id, team.id, 1, true),
    getTeamHighlights(team.id),
  ]);
  const latest = historicEvents[0] ?? null;

  return (
    <div>
      <PageHeader title="Hem" />
      <main className="space-y-4 px-5 pb-8">
        <Card className="overflow-hidden p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow tone="heading">Information</Eyebrow>
              <h2 className="mt-2 text-xl font-bold text-ink">Hej, {user.name}</h2>
              <p className="mt-2 text-base leading-6 text-ink-muted">
                Här visas viktig information från {team.name}.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-divider bg-white px-3 py-1.5 text-xs font-bold text-ink-subtle">
              {team.season}
            </span>
          </div>
        </Card>

        <ContextSwitcher
          teams={context.teams}
          seasons={context.seasons}
          selectedTeamSlug={context.selectedTeamSlug}
          selectedSeason={context.selectedSeason}
        />

        <Card className="p-5">
          <div className="mb-4">
            <Eyebrow tone="heading">Highlights</Eyebrow>
            <h2 className="mt-1 text-xl font-bold text-ink">Lagets klipp</h2>
          </div>
          <form action={addHighlight} className="space-y-2.5">
            <input type="hidden" name="teamId" value={team.id} />
            <label className="block">
              <span className="sr-only">Namn på klippet</span>
              <input
                name="title"
                type="text"
                maxLength={80}
                placeholder="Namn på klippet (valfritt)"
                className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none placeholder:text-ink-subtle focus:border-ink"
              />
            </label>
            <div className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">YouTube-länk</span>
                <input
                  name="url"
                  type="url"
                  inputMode="url"
                  required
                  placeholder="https://youtube.com/..."
                  className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base text-ink outline-none placeholder:text-ink-subtle focus:border-ink"
                />
              </label>
              <button type="submit" className="h-11 shrink-0 rounded-xl bg-signal px-4 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Lägg till
              </button>
            </div>
          </form>

          <div className="mt-4">
            {highlights.length === 0 ? (
              <p className="border-t border-divider pt-4 text-sm text-ink-subtle">Inga klipp har lagts till än.</p>
            ) : null}
            {highlights.map((highlight) => (
              <div key={highlight.id} className="flex items-center gap-3 border-t border-divider py-3 first:mt-1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-sm text-white">▶</span>
                <div className="min-w-0 flex-1">
                  <a href={highlight.url} target="_blank" rel="noreferrer" className="block truncate text-[15px] font-bold text-ink underline decoration-divider underline-offset-4">
                    {highlight.title}
                  </a>
                  <span className="text-[12px] text-ink-subtle">Länkat av {highlight.author.name ?? "spelare"}</span>
                </div>
                {highlight.authorId === user.id ? (
                  <form action={removeHighlight}>
                    <input type="hidden" name="highlightId" value={highlight.id} />
                    <button type="submit" className="rounded-lg px-2 py-2 text-sm font-semibold text-ink-subtle hover:bg-divider/50" aria-label={`Ta bort ${highlight.title}`}>
                      Ta bort
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Eyebrow>Senast spelat</Eyebrow>
          {latest ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ink text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] opacity-75">
                  {formatDateHeader(latest.item.startsAt).slice(0, 3)}
                </span>
                <span className="text-xl font-bold leading-none">{latest.item.startsAt.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-ink">
                  {latest.kind === "training"
                    ? "Träning"
                    : `${latest.item.isHome ? "Hemma" : "Borta"} vs ${latest.item.opponent}`}
                </div>
                <div className="mt-1 text-sm text-ink-subtle">
                  {formatDateHeader(latest.item.startsAt)} · {formatTime(latest.item.startsAt)}
                </div>
                <div className="mt-0.5 text-sm text-ink-subtle">{latest.item.location}</div>
              </div>
              {latest.kind === "match" && latest.item.homeScore !== null && latest.item.awayScore !== null ? (
                <div className="shrink-0 text-2xl font-bold text-signal">
                  {latest.item.homeScore}–{latest.item.awayScore}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-subtle">Ingen spelad träning eller match hittades.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
