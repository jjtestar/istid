import { PageHeader } from "@/components/PageHeader";
import { Eyebrow, StatusLabel } from "@/components/ui";
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

      <div className="px-5 pb-8">
        <div className="flex items-center justify-between border-t-2 border-divider pt-4">
          <Eyebrow>
            {team.name} · {team.season}
          </Eyebrow>
          {nextMatch && (
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
              {respondedGoing}/{roster.length} svarat
            </span>
          )}
        </div>

        <div className="mt-2">
          {roster.map((member) => {
            const status = statusByUser.get(member.userId);
            return (
              <div
                key={member.id}
                className="flex items-center gap-3.5 border-t-2 border-divider py-3"
              >
                <span className="w-[46px] shrink-0 text-[13px] font-bold text-ink">
                  {member.jerseyNo ?? "–"}
                </span>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-ink">{member.user.name}</div>
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
        </div>
      </div>
    </div>
  );
}
