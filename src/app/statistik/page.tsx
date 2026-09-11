import Link from "next/link";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader } from "@/lib/format";
import { getStats, getTeamStats } from "@/lib/queries";

export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<{ spelare?: string | string[] }>;
}) {
  const { user, team, context } = await getCurrentUserWithTeam();

  if (!team) {
    return <div className="px-5 py-10 text-center text-ink-subtle">Inget lag hittades.</div>;
  }

  const stats = await getTeamStats(team.id);
  const requestedPlayer = (await searchParams).spelare;
  const requestedPlayerId = typeof requestedPlayer === "string" ? requestedPlayer : null;
  const selectedPlayer =
    stats.playerStats.find((player) => player.userId === requestedPlayerId) ??
    stats.playerStats.find((player) => player.userId === user.id) ??
    stats.playerStats[0] ??
    null;
  const individualStats = selectedPlayer ? await getStats(selectedPlayer.userId, team.id) : null;

  const record = [
    { value: stats.matches, label: "Matcher" },
    { value: stats.wins, label: "Vinster" },
    { value: stats.draws, label: "Oavgjorda" },
    { value: stats.losses, label: "Förluster" },
  ];

  return (
    <div>
      <PageHeader title="Statistik" />
      <main className="space-y-4 px-5 pb-8">
        <ContextSwitcher
          teams={context.teams}
          seasons={context.seasons}
          selectedTeamSlug={context.selectedTeamSlug}
          selectedSeason={context.selectedSeason}
        />

        <Card className="p-4">
          <form method="get">
            <Eyebrow tone="heading">Individuell statistik</Eyebrow>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <label className="min-w-0">
                <span className="sr-only">Välj spelare</span>
                <select
                  name="spelare"
                  aria-label="Välj spelare"
                  defaultValue={selectedPlayer?.userId ?? ""}
                  className="h-11 w-full rounded-xl border border-divider bg-white px-3 text-[15px] font-bold text-ink outline-none focus:border-ink"
                >
                  {stats.playerStats.map((player) => (
                    <option key={player.userId} value={player.userId}>
                      #{player.jerseyNo ?? "–"} {player.name ?? "Okänd spelare"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Visa
              </button>
            </div>
          </form>
        </Card>

        {selectedPlayer && individualStats ? (
          <>
            <Card className="overflow-hidden p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Eyebrow>{selectedPlayer.position ?? "Spelare"}</Eyebrow>
                  <h2 className="mt-1 truncate text-xl font-bold text-ink">
                    <span className="mr-2 text-ink-subtle">#{selectedPlayer.jerseyNo ?? "–"}</span>
                    {selectedPlayer.name ?? "Okänd spelare"}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-bold text-signal">{individualStats.points}</div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-subtle">poäng</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-divider pt-4 text-center">
                {[
                  { value: individualStats.matchesPlayed, label: "Matcher" },
                  { value: individualStats.goals, label: "Mål" },
                  { value: individualStats.assists, label: "Assist" },
                  { value: individualStats.penaltyMinutes, label: "Utv.min" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-xl font-bold text-ink">{value}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-subtle">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-rink-crease px-3 py-3">
                <div>
                  <div className="text-sm font-bold text-ink">Träningsnärvaro</div>
                  <div className="text-[13px] text-ink-subtle">
                    {individualStats.trainingsAttended} av {individualStats.trainingsTotal} träningar
                  </div>
                </div>
                <div className="text-2xl font-bold text-success">{individualStats.attendancePct}%</div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="px-4 pb-2 pt-4">
                <Eyebrow>Senaste matcher</Eyebrow>
              </div>
              {individualStats.recentMatches.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-ink-subtle">Ingen matchstatistik finns ännu.</p>
              ) : (
                individualStats.recentMatches.map((matchStat, index) => (
                  <div
                    key={matchStat.id}
                    className={`flex items-center gap-3 px-4 py-3 ${index === 0 ? "" : "border-t border-divider"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-ink">
                        {matchStat.match.isHome ? "Hemma" : "Borta"} mot {matchStat.match.opponent}
                      </div>
                      <div className="text-[12px] text-ink-subtle">{formatDateHeader(matchStat.match.startsAt)}</div>
                    </div>
                    <div className="grid shrink-0 grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-ink">{matchStat.goals}</div>
                        <div className="text-[9px] font-bold uppercase text-ink-subtle">M</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink">{matchStat.assists}</div>
                        <div className="text-[9px] font-bold uppercase text-ink-subtle">A</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-signal">{matchStat.goals + matchStat.assists}</div>
                        <div className="text-[9px] font-bold uppercase text-ink-subtle">P</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </>
        ) : null}

        <Card className="p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>{team.season}</Eyebrow>
              <h2 className="mt-1 text-xl font-bold text-ink">{team.name}</h2>
              <p className="mt-1 text-sm text-ink-subtle">
                {stats.goalsFor}–{stats.goalsAgainst} i målskillnad
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-signal">{stats.points}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-subtle">poäng</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {record.map(({ value, label }) => (
            <Card key={label} className="px-1 py-3 text-center">
              <div className="text-2xl font-bold text-ink">{value}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-subtle">
                {label}
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_32px_32px_32px_36px] items-center gap-1 px-4 pb-2 pt-4 text-right">
            <Eyebrow>Spelarstatistik</Eyebrow>
            <span className="text-[10px] font-bold text-ink-subtle">M</span>
            <span className="text-[10px] font-bold text-ink-subtle">A</span>
            <span className="text-[10px] font-bold text-ink-subtle">P</span>
            <span className="text-[10px] font-bold text-ink-subtle">UTV</span>
          </div>
          {stats.playerStats.map((player, index) => {
            const active = player.userId === selectedPlayer?.userId;
            return (
              <Link
                key={player.id}
                href={`/statistik?spelare=${encodeURIComponent(player.userId)}`}
                aria-current={active ? "true" : undefined}
                className={`grid grid-cols-[1fr_32px_32px_32px_36px] items-center gap-1 px-4 py-3 text-right transition-colors hover:bg-rink-crease ${index === 0 ? "" : "border-t border-divider"} ${active ? "bg-rink-crease" : ""}`}
              >
                <div className="min-w-0 text-left">
                  <div className="truncate text-[15px] font-semibold text-ink">
                    <span className="mr-2 text-ink-subtle">#{player.jerseyNo ?? "–"}</span>
                    {player.name ?? "Okänd spelare"}
                  </div>
                  <div className="text-[12px] text-ink-subtle">
                    {player.position} · {player.matches} matcher
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink">{player.goals}</span>
                <span className="text-sm font-semibold text-ink">{player.assists}</span>
                <span className="text-sm font-bold text-signal">{player.points}</span>
                <span className="text-sm text-ink-subtle">{player.penaltyMinutes}</span>
              </Link>
            );
          })}
        </Card>
      </main>
    </div>
  );
}
