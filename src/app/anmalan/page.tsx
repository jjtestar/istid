import { respondToMatch, respondToTraining } from "@/app/actions";
import { AttendanceControls } from "@/components/AttendanceControls";
import { ExpandableList } from "@/components/ExpandableList";
import { LineupView } from "@/components/LineupView";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";
import { DEFAULT_SEASON, getSessionUser, getUserSeasonTeams } from "@/lib/current-user";
import { formatDateHeader, formatDayMonth, formatTime, matchTitle } from "@/lib/format";
import { LineupData } from "@/lib/lineup";
import { getActivePlayerRequests, getUpcomingActivitiesForTeams } from "@/lib/queries";

const POSITION_LABEL: Record<string, string> = { GOALKEEPER: "målvakt", SKATER: "utespelare" };

export default async function AnmalanPage() {
  const user = await getSessionUser();
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;
  const teams = await getUserSeasonTeams(user.id, isAdmin, DEFAULT_SEASON);

  if (teams.length === 0) {
    return <div className="px-5 py-10 text-center text-ink-subtle">Inget lag hittades.</div>;
  }

  const teamIds = teams.map((team) => team.id);
  const [activities, playerRequests] = await Promise.all([
    getUpcomingActivitiesForTeams(teams),
    getActivePlayerRequests(teamIds),
  ]);
  const showTeamLabel = teams.length > 1;

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
                    ? `${matchTitle(request.match)}, ${formatDateHeader(request.match.startsAt)}`
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

        {activities.length === 0 ? (
          <Card className="p-5 text-center text-sm text-ink-subtle">
            Inga kommande träningar eller matcher att anmäla sig till.
          </Card>
        ) : (
          /* Ett kort per tillfälle, alla likadana: en enstaka träning och en
             träning ur en återkommande serie ska se ut och fungera exakt
             likadant. Två per rad när skärmen räcker till. */
          <ExpandableList
            initialCount={4}
            moreLabel="Visa fler tillfällen"
            lessLabel="Visa färre tillfällen"
            listClassName={`grid gap-4 ${activities.length > 1 ? "xl:grid-cols-2" : ""}`}
          >
            {activities.map(({ kind, item, roster }, index) => {
              const isTraining = kind === "training";
              const registrationByUser = new Map(
                item.registrations.map((candidate) => [candidate.userId, candidate]),
              );
              const registration = registrationByUser.get(user.id);
              const respond = isTraining ? respondToTraining : respondToMatch;
              const idField = isTraining ? "trainingId" : "matchId";
              const title = isTraining ? "Träning" : matchTitle(item);
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
                <Card
                  key={`${kind}:${item.id}`}
                  className={`overflow-hidden p-4 ${index === 0 ? "border-2 border-ink" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-divider bg-white/80 py-1.5 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                        {formatDateHeader(item.startsAt).slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold leading-none text-ink">{item.startsAt.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-ink">{title}</h2>
                          {index === 0 ? (
                            <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                              Näst på tur
                            </span>
                          ) : null}
                        </span>
                        {showTeamLabel ? (
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-subtle">
                            {item.team.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-ink-subtle">
                        {formatDayMonth(item.startsAt)} · {formatTime(item.startsAt)}
                        {!isTraining && item.endsAt ? `–${formatTime(item.endsAt)}` : ""} · {item.location}
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
          </ExpandableList>
        )}
      </main>
    </div>
  );
}
