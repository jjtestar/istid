import { ExpandableList } from "@/components/ExpandableList";
import { respondToMatch, respondToTraining } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { SeasonSwitcher } from "@/components/SeasonSwitcher";
import { Card, Eyebrow, StatusLabel } from "@/components/ui";
import { DEFAULT_SEASON, getSessionUser, getUserSeasonTeams, getUserSeasons } from "@/lib/current-user";
import { endTime, formatDateHeader, formatMonthYear, formatTime } from "@/lib/format";
import { RsvpQuickButton } from "@/components/RsvpQuickButton";
import { getCalendarEventsForTeams } from "@/lib/queries";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const WEEKDAY_LABELS = ["MÅN", "TIS", "ONS", "TOR", "FRE", "LÖR", "SÖN"];

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ sasong?: string | string[] }>;
}) {
  const user = await getSessionUser();
  const isAdmin = user.role === "ADMIN" || user.isSuperAdmin;
  const availableSeasons = await getUserSeasons(user.id, isAdmin);

  const params = await searchParams;
  const requestedSeason = typeof params.sasong === "string" ? params.sasong : "";
  const selectedSeason = availableSeasons.includes(requestedSeason) ? requestedSeason : DEFAULT_SEASON;
  const isHistoric = selectedSeason !== DEFAULT_SEASON;

  const teams = await getUserSeasonTeams(user.id, isAdmin, selectedSeason);

  if (teams.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const teamIds = teams.map((team) => team.id);
  const events = await getCalendarEventsForTeams(user.id, teamIds, 21, isHistoric);
  const showTeamLabel = teams.length > 1;
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const groups = new Map<string, { date: Date; events: typeof events }>();
  for (const event of events) {
    const key = dayKey(event.item.startsAt);
    if (!groups.has(key)) groups.set(key, { date: event.item.startsAt, events: [] });
    groups.get(key)!.events.push(event);
  }

  return (
    <div>
      <PageHeader title="Kalender" back={{ href: "/mer", label: "Tillbaka till Mer" }} />

      <main className="space-y-7 px-5 pb-10">
        {availableSeasons.length > 1 ? (
          <SeasonSwitcher seasons={availableSeasons} selectedSeason={selectedSeason} />
        ) : null}

        <Card className="p-4">
          {isHistoric ? (
            <div className="text-center">
              <Eyebrow>Avslutad säsong</Eyebrow>
              <div className="mt-1 text-lg font-bold text-ink">{selectedSeason}</div>
              <div className="mt-1 text-sm text-ink-subtle">Senaste händelserna visas först</div>
            </div>
          ) : (
            <>
              <div className="text-center text-base font-bold text-ink">{formatMonthYear(today)}</div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {weekDates.map((date, index) => {
                  const isToday = dayKey(date) === dayKey(today);
                  return (
                    <div key={dayKey(date)} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-ink-subtle">{WEEKDAY_LABELS[index]}</span>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-ink text-white" : "text-ink"}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {groups.size === 0 && (
          <Card className="p-5 text-center text-sm text-ink-subtle">
            {isHistoric ? "Inga händelser hittades för säsongen." : "Inga kommande händelser just nu."}
          </Card>
        )}

        <ExpandableList initialCount={3} moreLabel="Visa fler händelser" lessLabel="Visa färre händelser" className="space-y-7">
          {Array.from(groups.values()).map(({ date, events: dayEvents }) => (
            <section key={dayKey(date)}>
              <Eyebrow>{formatDateHeader(date)}</Eyebrow>
              <div className="mt-2 grid gap-2.5 xl:grid-cols-2">
                {dayEvents.map(({ kind, item }) => {
                  const going = item.registrations[0]?.status === "GOING";
                  const title =
                    kind === "training"
                      ? "Träning"
                      : `${item.isHome ? "Hemma" : "Borta"} vs ${item.opponent}`;
                  const respond = kind === "training" ? respondToTraining : respondToMatch;
                  const idField = kind === "training" ? "trainingId" : "matchId";

                  return (
                    <Card key={`${kind}:${item.id}`} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-[58px] shrink-0 border-r border-divider pr-3">
                          <div className="text-lg font-bold text-ink">{formatTime(item.startsAt)}</div>
                          <div className="text-xs text-ink-subtle">
                            {formatTime(endTime(item.startsAt, kind === "training" ? 90 : 120))}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold text-ink">{title}</div>
                          <div className="mt-0.5 truncate text-[13px] text-ink-subtle">
                            {item.location}
                            {showTeamLabel ? ` · ${item.team.name}` : ""}
                          </div>
                        </div>
                        {!going && isHistoric ? (
                          <StatusLabel tone="muted">Ej anmäld</StatusLabel>
                        ) : (
                          <RsvpQuickButton action={respond} idField={idField} idValue={item.id} going={going} />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </ExpandableList>
      </main>
    </div>
  );
}
