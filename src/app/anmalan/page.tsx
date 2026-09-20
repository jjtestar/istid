import { respondToMatch, respondToTraining } from "@/app/actions";
import { AttendanceControls } from "@/components/AttendanceControls";
import { LineupView } from "@/components/LineupView";
import { PageHeader } from "@/components/PageHeader";
import { RsvpQuickButton } from "@/components/RsvpQuickButton";
import { Card, Eyebrow } from "@/components/ui";
import { DEFAULT_SEASON, getSessionUser, getUserSeasonTeams } from "@/lib/current-user";
import { formatDateHeader, formatTime } from "@/lib/format";
import { LineupData } from "@/lib/lineup";
import { getActivePlayerRequests, getCalendarEventsForTeams, getUpcomingByTeam } from "@/lib/queries";

const POSITION_LABEL: Record<string, string> = { GOALKEEPER: "målvakt", SKATER: "utespelare" };

export default async function AnmalanPage() {
  const user = await getSessionUser();
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;
  const teams = await getUserSeasonTeams(user.id, isAdmin, DEFAULT_SEASON);

  if (teams.length === 0) {
    return <div className="px-5 py-10 text-center text-ink-subtle">Inget lag hittades.</div>;
  }

  const teamIds = teams.map((team) => team.id);
  const [byTeam, weekEvents, playerRequests] = await Promise.all([
    getUpcomingByTeam(teams),
    getCalendarEventsForTeams(user.id, teamIds, 7),
    getActivePlayerRequests(teamIds),
  ]);

  const featuredEvents = byTeam
    .flatMap(({ team, nextTraining, nextMatch, roster }) => [
      nextTraining && { kind: "training" as const, item: nextTraining, team, roster },
      nextMatch && { kind: "match" as const, item: nextMatch, team, roster },
    ])
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .sort((a, b) => a.item.startsAt.getTime() - b.item.startsAt.getTime());
  const featuredKeys = new Set(featuredEvents.map((event) => `${event.kind}:${event.item.id}`));
  const week = weekEvents.filter((event) => !featuredKeys.has(`${event.kind}:${event.item.id}`)).slice(0, 3);

  return (
    <div>
      <PageHeader title="Anmälan" />
      <main className="space-y-6 px-5 pb-10">
        {playerRequests.length > 0 ? (
          <Card className="border-2 border-signal bg-rink-line-red/40 p-4">
            <Eyebrow tone="heading">Söker spelare</Eyebrow>
            <div className="mt-2 space-y-2">
              {playerRequests.map((request) => {
                const activityLabel = request.training
                  ? `Träning ${formatDateHeader(request.training.startsAt)} ${formatTime(request.training.startsAt)}`
                  : request.match
                    ? `${request.match.isHome ? "Hemma" : "Borta"} vs ${request.match.opponent}, ${formatDateHeader(request.match.startsAt)}`
                    : "";
                return (
                  <p key={request.id} className="text-sm text-ink">
                    <span className="font-bold">{request.team.name}</span> saknar {POSITION_LABEL[request.position]} till {activityLabel}
                    {request.note ? ` — ${request.note}` : ""}
                  </p>
                );
              })}
            </div>
          </Card>
        ) : null}

        {featuredEvents.length === 0 ? (
          <Card className="p-5 text-center text-sm text-ink-subtle">
            Inga kommande träningar eller matcher att anmäla sig till.
          </Card>
        ) : (
          /* Two per row once there is room for it, so a team with several
             upcoming activities doesn't become one long scroll on desktop. */
          <div className="grid gap-6 xl:grid-cols-2">
            {featuredEvents.map(({ kind, item, team, roster }) => {
              const isTraining = kind === "training";
              const registrationByUser = new Map(
                item.registrations.map((candidate) => [candidate.userId, candidate]),
              );
              const registration = registrationByUser.get(user.id);
              const respond = isTraining ? respondToTraining : respondToMatch;
              const idField = isTraining ? "trainingId" : "matchId";
              const title = isTraining
                ? "Träning"
                : `${item.isHome ? "Hemma" : "Borta"} vs ${item.opponent}`;
              const lineup = roster.map((member) => {
                const playerRegistration = registrationByUser.get(member.userId);
                return {
                  id: member.userId,
                  name: member.user.name ?? "Okänd spelare",
                  jerseyNo: member.jerseyNo,
                  position: member.position,
                  status: playerRegistration?.status ?? null,
                  absenceReason: playerRegistration?.absenceReason ?? null,
                };
              });
              const namesById = new Map(roster.map((member) => [member.userId, member.user.name ?? "Okänd spelare"]));
              const lineupPlanData = item.lineupPlan?.data as LineupData | undefined;

              return (
                <Card key={`${kind}:${item.id}`} className="overflow-hidden p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-divider bg-white/80 py-1.5 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                        {formatDateHeader(item.startsAt).slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold leading-none text-ink">{item.startsAt.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                        <Eyebrow tone="heading">{isTraining ? "Nästa träning" : "Nästa match"}</Eyebrow>
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                          {team.name}
                        </span>
                      </div>
                      <h2 className="mt-0.5 text-base font-bold text-ink">{title}</h2>
                      <p className="mt-0.5 text-sm text-ink-subtle">
                        {formatDateHeader(item.startsAt)} · {formatTime(item.startsAt)} · {item.location}
                      </p>
                    </div>
                  </div>
                  {lineupPlanData ? (
                    <details className="group mt-3 rounded-xl border border-divider bg-white/60 px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink">
                        Visa lagindelning
                        <span className="text-ink-subtle transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                      </summary>
                      <LineupView data={lineupPlanData} namesById={namesById} />
                    </details>
                  ) : null}
                  <div className="mt-3 border-t border-divider pt-3">
                    <AttendanceControls
                      formAction={respond}
                      idField={idField}
                      idValue={item.id}
                      currentUserId={user.id}
                      status={registration?.status ?? null}
                      absenceReason={registration?.absenceReason ?? null}
                      lineup={lineup}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {week.length > 0 ? (
          <Card className="p-4">
            <Eyebrow>Veckan</Eyebrow>
            <div className="mt-2">
              {week.map(({ kind, item }) => {
                const going = item.registrations[0]?.status === "GOING";
                const title = kind === "training" ? "Träning" : `${item.isHome ? "Hemma" : "Borta"} vs ${item.opponent}`;
                const respond = kind === "training" ? respondToTraining : respondToMatch;
                const idField = kind === "training" ? "trainingId" : "matchId";
                return (
                  <div key={`${kind}:${item.id}`} className="flex items-center gap-3.5 border-t border-divider py-3">
                    <span className="w-[46px] shrink-0 text-[13px] font-bold text-ink">
                      {formatDateHeader(item.startsAt).slice(0, 3).toUpperCase()} {item.startsAt.getDate()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink">
                        {title} {formatTime(item.startsAt)}
                      </span>
                      {teams.length > 1 ? (
                        <span className="block text-[12px] text-ink-subtle">{item.team.name}</span>
                      ) : null}
                    </span>
                    <RsvpQuickButton action={respond} idField={idField} idValue={item.id} going={going} />
                  </div>
                );
              })}
            </div>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
