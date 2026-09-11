import { respondToMatch, respondToTraining } from "@/app/actions";
import { PageHeader } from "@/components/PageHeader";
import { Eyebrow, StatusLabel } from "@/components/ui";
import { getCurrentUserWithTeam } from "@/lib/current-user";
import { endTime, formatDateHeader, formatMonthYear, formatTime } from "@/lib/format";
import { getCalendarEvents } from "@/lib/queries";

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
  const { user, team } = await getCurrentUserWithTeam();

  if (!team) {
    return (
      <div className="px-5 py-10 text-center text-ink-subtle">
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

      <div className="px-5 pb-8">
        <div className="border-t-2 border-divider pt-4">
          <Eyebrow>{formatMonthYear(today)}</Eyebrow>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekDates.map((d, i) => {
              const isToday = dayKey(d) === dayKey(today);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-ink-subtle">
                    {WEEKDAY_LABELS[i]}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isToday ? "bg-ink text-white" : "text-ink"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {groups.size === 0 && (
          <p className="mt-6 text-center text-sm text-ink-subtle">
            Inga kommande händelser just nu.
          </p>
        )}

        {Array.from(groups.values()).map(({ date, events: dayEvents }) => (
          <div key={dayKey(date)} className="mt-6">
            <Eyebrow>{formatDateHeader(date)}</Eyebrow>
            <div className="mt-2">
              {dayEvents.map(({ kind, item }) => {
                const going = item.registrations[0]?.status === "GOING";
                const title =
                  kind === "training"
                    ? "Träning"
                    : `${item.isHome ? "Hemma" : "Borta"} vs ${item.opponent}`;
                const time =
                  kind === "training"
                    ? `${formatTime(item.startsAt)} – ${formatTime(endTime(item.startsAt))}`
                    : `${formatTime(item.startsAt)} – ${formatTime(endTime(item.startsAt, 120))}`;
                const respond = kind === "training" ? respondToTraining : respondToMatch;
                const idField = kind === "training" ? "trainingId" : "matchId";

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 border-t-2 border-divider py-3"
                  >
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold text-ink">{title}</div>
                      <div className="mt-0.5 text-[13px] text-ink-subtle">
                        {time} · {item.location}
                      </div>
                    </div>
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
        ))}
      </div>
    </div>
  );
}
