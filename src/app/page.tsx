import { ExpandableList } from "@/components/ExpandableList";
import { GoalHighlights } from "@/components/GoalHighlights";
import { PageHeader } from "@/components/PageHeader";
import { InstallAppButton } from "@/components/PwaProvider";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader, formatTime } from "@/lib/format";
import { getCalendarEvents, getTeamHighlights } from "@/lib/queries";

export default async function Home() {
  const { user, team } = await getCurrentUserWithTeam();

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
      <PageHeader title="Hem" right={<InstallAppButton />} />
      <main className="space-y-6 px-5 pb-10">
        <Card className="overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Eyebrow tone="heading">Information</Eyebrow>
            <div className="shrink-0 text-right">
              <div className="text-xs font-semibold text-ink-subtle">Publicerad</div>
              <time dateTime="2026-09-11" className="text-sm font-bold text-ink">
                11 september 2026
              </time>
            </div>
          </div>
          <p className="mt-4 body-copy text-ink-muted">
            Här visas viktig information från {team.name}.
          </p>
        </Card>

        <Card className="p-5">
          <Eyebrow tone="heading">Highlights</Eyebrow>
          <GoalHighlights />
          {highlights.length > 0 ? <div className="mt-5 border-t border-divider pt-4">
            <h3 className="mb-1 text-base font-bold text-ink">Fler klipp</h3>
            <ExpandableList initialCount={3} moreLabel="Visa fler highlights" lessLabel="Visa färre highlights">
              {highlights.map((highlight) => (
                <a key={highlight.id} href={highlight.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-lg border-t border-divider py-3 first:border-t-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal text-sm text-white" aria-hidden="true">▶</span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ink underline decoration-divider underline-offset-4">
                      {highlight.title}
                    </span>
                    <span className="text-[12px] text-ink-subtle">Länkat av {highlight.author.name ?? "spelare"}</span>
                  </div>
                </a>
              ))}
            </ExpandableList>
          </div> : null}
        </Card>

        <Card className="p-5">
          <Eyebrow tone="heading">Senast spelat</Eyebrow>
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
