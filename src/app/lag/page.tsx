import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow, StatusLabel } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { getRosterWithNextMatch } from "@/lib/queries";

export default async function LagPage() {
  const { team } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const { roster, nextMatch, statusByUser, respondedGoing } = await getRosterWithNextMatch(
    team.id,
  );

  return (
    <div>
      <PageHeader title="Lag" />

      <main className="space-y-4 px-5 pb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>{team.season}</Eyebrow>
              <h2 className="mt-1 text-xl font-bold text-ink">{team.name}</h2>
            </div>
            {nextMatch && (
              <div className="text-right">
                <div className="text-2xl font-bold text-ink">{respondedGoing}/{roster.length}</div>
                <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                  svarat
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          {roster.map((member, index) => {
            const status = statusByUser.get(member.userId);
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3.5 px-4 py-3.5 ${
                  index === 0 ? "" : "border-t border-divider"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  {member.jerseyNo ?? "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-ink">
                    {member.user.name}
                  </div>
                  {member.position && (
                    <div className="text-[13px] text-ink-subtle">{member.position}</div>
                  )}
                </div>
                {nextMatch &&
                  (status === "GOING" ? (
                    <StatusLabel tone="success">Anmäld</StatusLabel>
                  ) : status === "NOT_GOING" ? (
                    <StatusLabel tone="muted">Avbokad</StatusLabel>
                  ) : (
                    <StatusLabel tone="signal">Inget svar</StatusLabel>
                  ))}
              </div>
            );
          })}
        </Card>
      </main>
    </div>
  );
}
