import { PageHeader } from "@/components/PageHeader";
import { Eyebrow } from "@/components/ui";
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

  return (
    <div>
      <PageHeader title="Statistik" />

      <div className="px-5 pb-8">
        <div className="border-t-2 border-divider pt-4">
          <div className="text-[15px] font-semibold uppercase text-ink">{user.name}</div>
          <div className="text-[13px] text-ink-subtle">
            #{member?.jerseyNo ?? "–"}
            {member?.position ? ` · ${member.position}` : ""}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-3xl font-bold text-ink">{stats.matchesPlayed}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-subtle">
              Matcher
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-signal">{stats.goals}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-subtle">
              Mål
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ink">{stats.assists}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-subtle">
              Assist
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ink">{stats.points}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-subtle">
              Poäng
            </div>
          </div>
        </div>

        <div className="mt-6 border-t-2 border-divider pt-4">
          <Eyebrow>Träningsnärvaro</Eyebrow>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-ink">{stats.trainingsAttended}</span>
              <span className="text-ink-subtle"> av {stats.trainingsTotal} träningar</span>
            </div>
            <span className="text-2xl font-bold text-ink">{stats.attendancePct}%</span>
          </div>
          <div className="mt-3 h-[3px] w-full bg-divider">
            <div className="h-full bg-ink" style={{ width: `${stats.attendancePct}%` }} />
          </div>
        </div>

        <div className="mt-6">
          <Eyebrow>Senaste matcherna</Eyebrow>
          <div className="mt-2">
            {stats.recentMatches.map((stat) => (
              <div
                key={stat.id}
                className="flex items-center justify-between border-t-2 border-divider py-3"
              >
                <div>
                  <div className="text-[15px] font-semibold text-ink">
                    {stat.match.isHome ? "Hemma" : "Borta"} vs {stat.match.opponent}
                  </div>
                  <div className="text-[13px] text-ink-subtle">
                    {formatDateHeader(stat.match.startsAt)}
                  </div>
                </div>
                <div className="text-[13px] text-ink-subtle">
                  {stat.goals} mål · {stat.assists} assist
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
