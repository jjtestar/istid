import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader } from "@/lib/format";
import { getStats } from "@/lib/queries";

export default async function StatistikPage() {
  const { user, team, membership: member } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const stats = await getStats(user.id);

  const statItems = [
    { value: stats.matchesPlayed, label: "Matcher", emphasis: false },
    { value: stats.goals, label: "Mål", emphasis: true },
    { value: stats.assists, label: "Assist", emphasis: false },
    { value: stats.points, label: "Poäng", emphasis: false },
  ];

  return (
    <div>
      <PageHeader title="Statistik" />

      <main className="space-y-4 px-5 pb-8">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
            {member?.jerseyNo ?? "–"}
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{user.name}</div>
            <div className="text-sm text-ink-subtle">{member?.position ?? team.name}</div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {statItems.map(({ value, label, emphasis }) => (
            <Card key={label} className="px-2 py-3 text-center">
              <div className={`text-2xl font-bold ${emphasis ? "text-signal" : "text-ink"}`}>
                {value}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
                {label}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <Eyebrow>Träningsnärvaro</Eyebrow>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <span className="text-3xl font-bold text-ink">{stats.trainingsAttended}</span>
              <span className="text-ink-subtle"> av {stats.trainingsTotal} träningar</span>
            </div>
            <span className="text-2xl font-bold text-ink">{stats.attendancePct}%</span>
          </div>
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-divider">
            <div className="h-full bg-ink" style={{ width: `${stats.attendancePct}%` }} />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 pb-2 pt-4">
            <Eyebrow>Senaste matcherna</Eyebrow>
          </div>
          {stats.recentMatches.map((stat, index) => (
            <div
              key={stat.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                index === 0 ? "" : "border-t border-divider"
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-ink">
                  {stat.match.isHome ? "Hemma" : "Borta"} vs {stat.match.opponent}
                </div>
                <div className="text-[13px] text-ink-subtle">
                  {formatDateHeader(stat.match.startsAt)}
                </div>
              </div>
              <div className="shrink-0 text-right text-[13px] text-ink-subtle">
                {stat.goals} mål · {stat.assists} assist
              </div>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
