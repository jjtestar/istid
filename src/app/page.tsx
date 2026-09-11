import { respondToMatch, respondToTraining } from "@/app/actions";
import { Rink } from "@/components/Rink";
import { Eyebrow, ResponseToggle, StatusLabel } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { formatDateHeader, formatTime } from "@/lib/format";
import { getCalendarEvents, getDashboardData } from "@/lib/queries";

export default async function Home() {
  const { user, team } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const [{ nextMatch }, events] = await Promise.all([
    getDashboardData(user.id, team.id),
    getCalendarEvents(user.id, team.id, 7),
  ]);

  const week = events.filter((e) => e.item.id !== nextMatch?.id).slice(0, 3);
  const matchGoing = nextMatch?.registrations[0]?.status !== "NOT_GOING";

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <Rink />

      <div className="relative z-[1] flex flex-1 flex-col gap-3.5 px-5 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold uppercase tracking-[0.1em] text-ink">
            {team.name}
          </span>
          <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
            {team.season}
          </span>
        </div>

        {nextMatch && (
          <div className="flex flex-col items-center pt-[30px] text-center">
            <Eyebrow tone="heading">Nästa match</Eyebrow>
            <h2 className="mt-2 text-[27px] font-bold leading-tight tracking-[-0.01em] text-ink">
              {nextMatch.isHome ? "Hemma" : "Borta"} vs {nextMatch.opponent}
            </h2>
            <div className="mt-4 h-0.5 w-[46px] bg-ink" />
            <p className="mt-4 text-[15px] font-semibold text-ink-muted">
              {formatDateHeader(nextMatch.startsAt)} · {formatTime(nextMatch.startsAt)}
            </p>
            <p className="mt-1 text-[13.5px] text-ink-subtle">{nextMatch.location}</p>

            <div className="mt-4">
              <ResponseToggle
                formAction={respondToMatch}
                idField="matchId"
                idValue={nextMatch.id}
                going={matchGoing}
              />
            </div>
          </div>
        )}

        <div className="mt-auto bg-white/[0.88] pb-4 pt-3">
          <Eyebrow>Veckan</Eyebrow>
          <div className="mt-2.5">
            {week.length === 0 && (
              <p className="border-t-2 border-divider py-3 text-[13.5px] text-ink-subtle">
                Inga fler pass denna vecka.
              </p>
            )}
            {week.map(({ kind, item }) => {
              const going = item.registrations[0]?.status === "GOING";
              const title =
                kind === "training"
                  ? "Träning"
                  : `${item.isHome ? "Hemma" : "Borta"} vs ${item.opponent}`;
              const respond = kind === "training" ? respondToTraining : respondToMatch;
              const idField = kind === "training" ? "trainingId" : "matchId";

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 border-t-2 border-divider py-3"
                >
                  <span className="w-[46px] shrink-0 text-[13px] font-bold text-ink">
                    {formatDateHeader(item.startsAt).slice(0, 3).toUpperCase()}{" "}
                    {item.startsAt.getDate()}
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-ink">
                    {title} {formatTime(item.startsAt)}
                  </span>
                  {going ? (
                    <StatusLabel tone="success">Anmäld</StatusLabel>
                  ) : (
                    <form action={respond}>
                      <input type="hidden" name={idField} value={item.id} />
                      <input type="hidden" name="status" value="GOING" />
                      <button type="submit">
                        <StatusLabel tone="signal">Svara</StatusLabel>
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
