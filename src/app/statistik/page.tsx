import Link from "next/link";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { StatisticsPlayerPicker } from "@/components/StatisticsPlayerPicker";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader, matchTitle } from "@/lib/format";
import { getStats, getTeamStats } from "@/lib/queries";

type StatisticsView = "spelare" | "topplistor" | "laget";

const viewOptions: Array<{ value: StatisticsView; label: string }> = [
  { value: "spelare", label: "Spelarstatistik" },
  { value: "topplistor", label: "Topplistor" },
  { value: "laget", label: "Laget" },
];

function statisticsHref(view: StatisticsView, playerId?: string) {
  const params = new URLSearchParams({ vy: view });

  if (playerId) {
    params.set("spelare", playerId);
  }

  return `/statistik?${params.toString()}`;
}

export default async function StatistikPage({
  searchParams,
}: {
  searchParams: Promise<{
    spelare?: string | string[];
    vy?: string | string[];
  }>;
}) {
  const { user, team, context } = await getCurrentUserWithTeam();

  if (!team) {
    return <div className="px-5 py-10 text-center text-ink-subtle">Inget lag hittades.</div>;
  }

  const params = await searchParams;
  const requestedView = typeof params.vy === "string" ? params.vy : "";
  const view: StatisticsView =
    requestedView === "topplistor" || requestedView === "laget" ? requestedView : "spelare";
  const stats = await getTeamStats(team.id);
  const requestedPlayerId = typeof params.spelare === "string" ? params.spelare : null;
  const ownPlayer = stats.playerStats.find((player) => player.userId === user.id);
  const selectedPlayer =
    stats.playerStats.find((player) => player.userId === requestedPlayerId) ??
    ownPlayer ??
    stats.playerStats[0] ??
    null;
  const individualStats =
    view === "spelare" && selectedPlayer ? await getStats(selectedPlayer.userId, team.id) : null;

  const record = [
    { value: stats.matches, label: "Matcher" },
    { value: stats.wins, label: "Vinster" },
    { value: stats.draws, label: "Oavgjorda" },
    { value: stats.losses, label: "Förluster" },
  ];
  const leaderboards = [
    { title: "Flest mål", field: "goals" as const, unit: "mål" },
    { title: "Flest assist", field: "assists" as const, unit: "assist" },
    { title: "Flest poäng", field: "points" as const, unit: "poäng" },
    {
      title: "Flest utvisningsminuter",
      field: "penaltyMinutes" as const,
      unit: "min",
    },
  ].map((leaderboard) => ({
    ...leaderboard,
    players: [...stats.playerStats]
      .sort(
        (first, second) =>
          second[leaderboard.field] - first[leaderboard.field] ||
          second.points - first.points ||
          (first.jerseyNo ?? 999) - (second.jerseyNo ?? 999),
      )
      .slice(0, 3),
  }));

  return (
    <div>
      <PageHeader title="Statistik" />
      <main className="space-y-6 px-5 pb-10">
        <ContextSwitcher
          key={`${context.selectedTeamSlug}:${context.selectedSeason}`}
          teams={context.teams}
          seasons={context.seasons}
          selectedTeamSlug={context.selectedTeamSlug}
          selectedSeason={context.selectedSeason}
        />

        <nav
          aria-label="Statistikvy"
          className="grid grid-cols-3 rounded-2xl border border-divider bg-white/90 p-1"
        >
          {viewOptions.map((option) => {
            const active = view === option.value;

            return (
              <Link
                key={option.value}
                href={statisticsHref(option.value, selectedPlayer?.userId)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-center text-[13px] font-bold transition-colors ${
                  active ? "bg-ink text-white" : "text-ink-muted hover:bg-rink-crease"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>

        {view === "spelare" ? (
          <>
            <Card className="p-4">
              <StatisticsPlayerPicker
                players={stats.playerStats.map(({ userId, name, jerseyNo }) => ({ userId, name, jerseyNo }))}
                selectedPlayerId={selectedPlayer?.userId ?? ""}
                ownPlayerId={ownPlayer?.userId}
              />
            </Card>

            {selectedPlayer && individualStats ? (
              <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                <Card className="overflow-hidden p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Eyebrow>{selectedPlayer.position ?? "Spelare"}</Eyebrow>
                      <h2 className="mt-1 truncate section-title">
                        <span className="mr-2 text-ink-subtle">#{selectedPlayer.jerseyNo ?? "–"}</span>
                        {selectedPlayer.name ?? "Okänd spelare"}
                      </h2>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-3xl font-bold text-signal">{individualStats.points}</div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                        poäng
                      </div>
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
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-subtle">
                          {label}
                        </div>
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
                        className={`flex items-center gap-3 px-4 py-3 ${
                          index === 0 ? "" : "border-t border-divider"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-ink">
                            {matchTitle(matchStat.match)}
                          </div>
                          <div className="text-[12px] text-ink-subtle">
                            {formatDateHeader(matchStat.match.startsAt)}
                          </div>
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
                            <div className="text-sm font-bold text-signal">
                              {matchStat.goals + matchStat.assists}
                            </div>
                            <div className="text-[9px] font-bold uppercase text-ink-subtle">P</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-4 text-sm text-ink-subtle">Ingen spelarstatistik finns ännu.</Card>
            )}
          </>
        ) : null}

        {view === "topplistor" ? (
          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            {leaderboards.map((leaderboard) => (
              <Card key={leaderboard.field} className="overflow-hidden">
                <div className="px-4 pb-2 pt-4">
                  <Eyebrow tone="heading">{leaderboard.title}</Eyebrow>
                </div>
                {leaderboard.players.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-ink-subtle">Ingen statistik finns ännu.</p>
                ) : (
                  leaderboard.players.map((player, index) => (
                    <Link
                      key={player.userId}
                      href={statisticsHref("spelare", player.userId)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-rink-crease ${
                        index === 0 ? "" : "border-t border-divider"
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0 ? "bg-signal text-white" : "bg-rink-crease text-ink"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-ink">
                          <span className="mr-2 text-ink-subtle">#{player.jerseyNo ?? "–"}</span>
                          {player.name ?? "Okänd spelare"}
                        </div>
                        <div className="text-[12px] text-ink-subtle">{player.position ?? "Spelare"}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xl font-bold text-ink">{player[leaderboard.field]}</span>
                        <span className="ml-1 text-[11px] font-bold uppercase text-ink-subtle">
                          {leaderboard.unit}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </Card>
            ))}
          </div>
        ) : null}

        {view === "laget" ? (
          <>
            <Card className="p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <Eyebrow>{team.season}</Eyebrow>
                  <h2 className="mt-1 section-title">{team.name}</h2>
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
                <Eyebrow>Hela laget</Eyebrow>
                <span className="text-[10px] font-bold text-ink-subtle">M</span>
                <span className="text-[10px] font-bold text-ink-subtle">A</span>
                <span className="text-[10px] font-bold text-ink-subtle">P</span>
                <span className="text-[10px] font-bold text-ink-subtle">UTV</span>
              </div>
              {stats.playerStats.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-ink-subtle">Ingen spelarstatistik finns ännu.</p>
              ) : (
                stats.playerStats.map((player, index) => (
                  <Link
                    key={player.id}
                    href={statisticsHref("spelare", player.userId)}
                    className={`grid grid-cols-[1fr_32px_32px_32px_36px] items-center gap-1 px-4 py-3 text-right transition-colors hover:bg-rink-crease ${
                      index === 0 ? "" : "border-t border-divider"
                    }`}
                  >
                    <div className="min-w-0 text-left">
                      <div className="truncate text-[15px] font-semibold text-ink">
                        <span className="mr-2 text-ink-subtle">#{player.jerseyNo ?? "–"}</span>
                        {player.name ?? "Okänd spelare"}
                      </div>
                      <div className="text-[12px] text-ink-subtle">
                        {player.position ?? "Spelare"} · {player.matches} matcher
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink">{player.goals}</span>
                    <span className="text-sm font-semibold text-ink">{player.assists}</span>
                    <span className="text-sm font-bold text-signal">{player.points}</span>
                    <span className="text-sm text-ink-subtle">{player.penaltyMinutes}</span>
                  </Link>
                ))
              )}
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}
