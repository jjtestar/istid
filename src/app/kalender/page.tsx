import { respondToMatch, respondToTraining } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Card, DarkCard, Eyebrow } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { endTime, formatDateHeader, formatMonthYear, formatTime } from "@/lib/format";
import { getCalendarEvents, getUserTeam } from "@/lib/queries";

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const WEEKDAY_LABELS = ["MÅN", "TIS", "ONS", "TOR", "FRE", "LÖR", "SÖN"];

export default async function KalenderPage() {
  const user = await getCurrentUser();
  const team = await getUserTeam(user.id);

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-muted">
        Inget lag hittades. Kör <code>npm run db:seed</code> för att skapa exempeldata.
      </div>
    );
  }

  const events = await getCalendarEvents(user.id, team.id);
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
      <PageHeader title="Kalender" />

      <div className="space-y-6 px-5 pb-8">
        <Card>
          <div className="mb-4 flex items-center justify-between text-sm font-bold uppercase tracking-wide">
            <span>{formatMonthYear(today)}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDates.map((d, i) => {
              const isToday = dayKey(d) === dayKey(today);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-muted">
                    {WEEKDAY_LABELS[i]}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isToday ? "bg-accent text-accent-foreground" : "text-ink"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {groups.size === 0 && (
          <p className="text-center text-sm text-muted">Inga kommande händelser just nu.</p>
        )}

        {Array.from(groups.values()).map(({ date, events: dayEvents }) => (
          <div key={dayKey(date)}>
            <Eyebrow>{formatDateHeader(date).toUpperCase()}</Eyebrow>
            <div className="mt-2 space-y-3">
              {dayEvents.map(({ kind, item }) => {
                const registered = item.registrations.length > 0;

                if (kind === "training") {
                  return (
                    <Card key={item.id} className="border-l-4 border-l-accent">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">Träning</h3>
                          <p className="mt-1 text-sm text-muted">
                            {formatTime(item.startsAt)} – {formatTime(endTime(item.startsAt))}
                          </p>
                          <p className="text-sm text-muted">{item.location}</p>
                        </div>
                        {registered ? (
                          <Badge tone="success">Anmäld</Badge>
                        ) : (
                          <form action={respondToTraining}>
                            <input type="hidden" name="trainingId" value={item.id} />
                            <input type="hidden" name="status" value="GOING" />
                            <button type="submit">
                              <Badge tone="outline">Svara</Badge>
                            </button>
                          </form>
                        )}
                      </div>
                    </Card>
                  );
                }

                return (
                  <DarkCard key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">Match</h3>
                        <p className="mt-0.5 text-white/70">
                          {item.isHome ? "Hemma" : "Borta"} vs {item.opponent}
                        </p>
                        <p className="mt-1 text-sm text-white/50">
                          {formatTime(item.startsAt)} – {formatTime(endTime(item.startsAt, 120))}
                        </p>
                        <p className="text-sm text-white/50">{item.location}</p>
                      </div>
                      {registered ? (
                        <Badge tone="success">Anmäld</Badge>
                      ) : (
                        <form action={respondToMatch}>
                          <input type="hidden" name="matchId" value={item.id} />
                          <input type="hidden" name="status" value="GOING" />
                          <button type="submit">
                            <Badge tone="accent">Tillgänglig</Badge>
                          </button>
                        </form>
                      )}
                    </div>
                  </DarkCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
