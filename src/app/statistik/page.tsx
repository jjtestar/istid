import { ContextSwitcher } from "@/components/ContextSwitcher";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { getTeamStats } from "@/lib/queries";

export default async function StatistikPage() {
  const { team, context } = await getCurrentUserWithTeam();

  if (!team) {
    return <div className="px-5 py-10 text-center text-ink-subtle">Inget lag hittades.</div>;
  }

  const stats = await getTeamStats(team.id);
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
          {stats.playerStats.map((player, index) => (
            <div
              key={player.id}
              className={`grid grid-cols-[1fr_32px_32px_32px_36px] items-center gap-1 px-4 py-3 text-right ${
                index === 0 ? "" : "border-t border-divider"
              }`}
            >
              <div className="min-w-0 text-left">
                <div className="truncate text-[15px] font-semibold text-ink">
                  <span className="mr-2 text-ink-subtle">#{player.jerseyNo ?? "–"}</span>
                  {player.name}
                </div>
                <div className="text-[12px] text-ink-subtle">
                  {player.position} · {player.matches} matcher
                </div>
              </div>
              <span className="text-sm font-semibold text-ink">{player.goals}</span>
              <span className="text-sm font-semibold text-ink">{player.assists}</span>
              <span className="text-sm font-bold text-signal">{player.points}</span>
              <span className="text-sm text-ink-subtle">{player.penaltyMinutes}</span>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
