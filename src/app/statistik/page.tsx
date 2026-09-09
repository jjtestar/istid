import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow, StatTile } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader } from "@/lib/format";
import { getStats } from "@/lib/queries";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function StatistikPage() {
  const { user, team, membership: member } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-muted">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const stats = await getStats(user.id);

  return (
    <div>
      <PageHeader
        title="Statistik"
        right={
          <div className="flex gap-2 text-sm font-semibold">
            <span className="rounded-full bg-ink px-4 py-2 text-white">Min statistik</span>
            <span className="rounded-full px-4 py-2 text-muted">Laget</span>
          </div>
        }
      />

      <div className="space-y-4 px-5 pb-8">
        <Card className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
            {initials(user.name ?? "?")}
          </div>
          <div>
            <div className="font-bold uppercase">{user.name}</div>
            <div className="text-sm text-muted">
              #{member?.jerseyNo ?? "–"}
              {member?.position ? ` · ${member.position.toUpperCase()}` : ""}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          <StatTile value={stats.matchesPlayed} label="Matcher" />
          <StatTile value={stats.goals} label="Mål" emphasis />
          <StatTile value={stats.assists} label="Assist" />
          <StatTile value={stats.points} label="Poäng" />
        </div>

        <Card>
          <Eyebrow>Träningsnärvaro</Eyebrow>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold">{stats.trainingsAttended}</span>
              <span className="text-muted"> av {stats.trainingsTotal} träningar</span>
            </div>
            <span className="text-2xl font-bold">{stats.attendancePct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${stats.attendancePct}%` }}
            />
          </div>
        </Card>

        <Card>
          <Eyebrow>Senaste matcherna</Eyebrow>
          <div className="mt-3 divide-y divide-border">
            {stats.recentMatches.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold">
                    {stat.match.isHome ? "Hemma" : "Borta"} vs {stat.match.opponent}
                  </div>
                  <div className="text-xs text-muted">{formatDateHeader(stat.match.startsAt)}</div>
                </div>
                <div className="text-sm text-muted">
                  {stat.goals} mål · {stat.assists} assist
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
