import Link from "next/link";
import {
  createMatch,
  createMatchSeries,
  createPlayerRequest,
  createTraining,
  createTrainingSeries,
  deleteMatch,
  deleteMatchSeries,
  deleteTraining,
  deleteTrainingSeries,
  resolvePlayerRequest,
  updateMatch,
  updateTraining,
} from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { ExpandableList } from "@/components/ExpandableList";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_SEASON } from "@/lib/current-user";
import { formatMediumDateTime, matchShortTitle } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MATCH_TIME,
  DEFAULT_MATCH_WEEKDAYS,
  DEFAULT_TRAINING_TIME,
  DEFAULT_TRAINING_WEEKDAYS,
  WEEKDAY_OPTIONS,
  stockholmDateInput,
  stockholmDateTimeInput,
} from "@/lib/schedule";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const label = "text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle";

const POSITION_LABEL: Record<string, string> = { GOALKEEPER: "Målvakt", SKATER: "Utespelare" };

type TeamOption = { id: string; name: string; season: string };

function TeamSelect({ teams }: { teams: TeamOption[] }) {
  return (
    <label className="block">
      <span className={label}>Lag</span>
      <select name="teamId" required className={`${field} mt-1`}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}
      </select>
    </label>
  );
}

/**
 * Veckodagarna en serie ska upprepas på. Förvalet är lagets grundschema:
 * tisdag och torsdag för träning, söndag för match.
 */
function WeekdayPicker({ selected }: { selected: number[] }) {
  return (
    <fieldset>
      <legend className={label}>Veckodagar</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {WEEKDAY_OPTIONS.map((day) => (
          <label
            key={day.value}
            className="flex items-center gap-2 rounded-xl border border-divider px-3 py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-rink-crease"
          >
            <input
              type="checkbox"
              name="weekdays"
              value={day.value}
              defaultChecked={selected.includes(day.value)}
              className="h-4 w-4"
            />
            {day.short}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SeriesPeriodFields({ defaultTime, from, to }: { defaultTime: string; from: string; to: string }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={label}>Första datum</span>
          <input name="from" type="date" required defaultValue={from} className={`${field} mt-1`} />
        </label>
        <label className="block">
          <span className={label}>Sista datum</span>
          <input name="to" type="date" required defaultValue={to} className={`${field} mt-1`} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={label}>Starttid</span>
          <input name="time" type="time" required defaultValue={defaultTime} className={`${field} mt-1`} />
        </label>
        <label className="block">
          <span className={label}>Upprepas</span>
          <select name="intervalWeeks" className={`${field} mt-1`}>
            <option value="1">Varje vecka</option>
            <option value="2">Varannan vecka</option>
          </select>
        </label>
      </div>
    </>
  );
}

function PlayerRequestSection({
  activity,
  activityRef,
}: {
  activity: { playerRequests: { id: string; position: string; note: string | null }[] };
  activityRef: string;
}) {
  return (
    <div className="rounded-xl border border-divider bg-white/60 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Söker spelare</p>
      {activity.playerRequests.length > 0 ? (
        <div className="mt-2 space-y-2">
          {activity.playerRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-2 rounded-lg bg-rink-line-red/60 px-3 py-2 text-sm">
              <span className="font-semibold text-signal">
                {POSITION_LABEL[request.position]}{request.note ? ` · ${request.note}` : ""}
              </span>
              <AdminForm action={resolvePlayerRequest} submitLabel="Markera löst" submitClassName="shrink-0 rounded-lg border border-divider bg-white px-2 py-1 text-xs font-bold">
                <input type="hidden" name="playerRequestId" value={request.id} />
              </AdminForm>
            </div>
          ))}
        </div>
      ) : (
        <AdminForm action={createPlayerRequest} submitLabel="Lägg till efterlysning" className="mt-2 space-y-2" submitClassName="h-10 w-full rounded-xl border border-divider text-sm font-bold text-ink">
          <input type="hidden" name="activity" value={activityRef} />
          <select name="position" required className={field}>
            <option value="SKATER">Utespelare</option>
            <option value="GOALKEEPER">Målvakt</option>
          </select>
          <input name="note" placeholder="Kommentar (valfritt)" className={field} />
        </AdminForm>
      )}
    </div>
  );
}

/** "Ta bort hela serien" — bara meningsfullt för tillfällen som ingår i en. */
function SeriesActions({
  seriesId,
  action,
  label: buttonLabel,
}: {
  seriesId: string;
  action: typeof deleteTrainingSeries;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-divider bg-white/60 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-subtle">Återkommande serie</p>
      <p className="mt-1 text-sm text-ink-subtle">Tar bort alla kommande tillfällen i serien. Det som redan varit lämnas kvar.</p>
      <AdminForm
        action={action}
        submitLabel={buttonLabel}
        className="mt-2"
        submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
      >
        <input type="hidden" name="seriesId" value={seriesId} />
      </AdminForm>
    </div>
  );
}

export default async function AdminActivitiesPage() {
  await requireAdmin();
  const [teams, trainings, matches] = await Promise.all([
    // Only current-season teams can get new trainings/matches — older seasons are historical data only.
    prisma.team.findMany({ where: { archivedAt: null, season: DEFAULT_SEASON }, orderBy: { name: "asc" } }),
    prisma.training.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { team: true, playerRequests: { where: { resolvedAt: null } } } }),
    prisma.match.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { team: true, playerRequests: { where: { resolvedAt: null } } } }),
  ]);

  const today = new Date();
  const seriesStart = stockholmDateInput(today);
  const seriesEnd = stockholmDateInput(new Date(today.getFullYear(), today.getMonth() + 4, today.getDate()));

  return (
    <div>
      <AdminHeader title="Aktiviteter" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Grundschema</Eyebrow>
          <h2 className="mt-1 section-title">Träning tisdag och torsdag, match på söndag</h2>
          <p className="mt-2 text-sm text-ink-subtle">
            Formulären för återkommande tillfällen är förifyllda med det schemat. Ändra veckodagar, tid och period
            om laget kör något annat – varje tillfälle kan sedan redigeras för sig i listorna längre ned.
          </p>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <Eyebrow>Träning</Eyebrow>
            <h2 className="mt-1 section-title">Enstaka träning</h2>
            <AdminForm action={createTraining} submitLabel="Skapa träning" className="mt-4 space-y-3">
              <TeamSelect teams={teams} />
              <label className="block">
                <span className={label}>Datum och tid</span>
                <input name="startsAt" type="datetime-local" required className={`${field} mt-1`} />
              </label>
              <input name="location" required placeholder="Plats" className={field} />
              <input name="notes" placeholder="Anteckning (valfritt)" className={field} />
            </AdminForm>
          </Card>
          <Card className="p-5">
            <Eyebrow>Träning</Eyebrow>
            <h2 className="mt-1 section-title">Återkommande träningar</h2>
            <AdminForm action={createTrainingSeries} submitLabel="Skapa serie" className="mt-4 space-y-3">
              <TeamSelect teams={teams} />
              <WeekdayPicker selected={DEFAULT_TRAINING_WEEKDAYS} />
              <SeriesPeriodFields defaultTime={DEFAULT_TRAINING_TIME} from={seriesStart} to={seriesEnd} />
              <input name="location" required placeholder="Plats" className={field} />
              <input name="notes" placeholder="Anteckning (valfritt)" className={field} />
              <p className="text-xs text-ink-subtle">
                Tillfällen som redan ligger inne på samma tid hoppas över, så serien kan skapas om utan dubbletter.
              </p>
            </AdminForm>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <Eyebrow>Match &amp; cup</Eyebrow>
            <h2 className="mt-1 section-title">Enstaka match eller cup</h2>
            <AdminForm action={createMatch} submitLabel="Skapa" className="mt-4 space-y-3">
              <TeamSelect teams={teams} />
              <label className="block">
                <span className={label}>Typ</span>
                <select name="kind" className={`${field} mt-1`}>
                  <option value="MATCH">Match</option>
                  <option value="CUP">Cup</option>
                </select>
              </label>
              <label className="block">
                <span className={label}>Startar</span>
                <input name="startsAt" type="datetime-local" required className={`${field} mt-1`} />
              </label>
              <label className="block">
                <span className={label}>Slutar (valfritt)</span>
                <input name="endsAt" type="datetime-local" className={`${field} mt-1`} />
              </label>
              <input name="opponent" required placeholder="Motståndare, eller cupens namn" className={field} />
              <input name="location" required placeholder="Plats" className={field} />
              <select name="isHome" className={field}>
                <option value="true">Hemma</option>
                <option value="false">Borta</option>
              </select>
            </AdminForm>
          </Card>
          <Card className="p-5">
            <Eyebrow>Match &amp; cup</Eyebrow>
            <h2 className="mt-1 section-title">Återkommande matcher</h2>
            <AdminForm action={createMatchSeries} submitLabel="Skapa serie" className="mt-4 space-y-3">
              <TeamSelect teams={teams} />
              <label className="block">
                <span className={label}>Typ</span>
                <select name="kind" className={`${field} mt-1`}>
                  <option value="MATCH">Match</option>
                  <option value="CUP">Cup</option>
                </select>
              </label>
              <WeekdayPicker selected={DEFAULT_MATCH_WEEKDAYS} />
              <SeriesPeriodFields defaultTime={DEFAULT_MATCH_TIME} from={seriesStart} to={seriesEnd} />
              <input name="opponent" placeholder="Motståndare (valfritt)" className={field} />
              <input name="location" required placeholder="Plats" className={field} />
              <select name="isHome" className={field}>
                <option value="true">Hemma</option>
                <option value="false">Borta</option>
              </select>
              <p className="text-xs text-ink-subtle">
                Lämna motståndaren tom om lottningen inte är klar – varje match kan fyllas i för sig efteråt.
              </p>
            </AdminForm>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <h2 className="section-title">Senaste träningarna</h2>
            <ExpandableList
              initialCount={6}
              moreLabel="Visa fler träningar"
              lessLabel="Visa färre träningar"
              className="mt-3 divide-y divide-divider"
            >
              {trainings.map((t) => (
                <details key={t.id} className="group py-3">
                  <summary className="cursor-pointer list-none">
                    <p className="font-bold">
                      {t.team.name}
                      {t.seriesId ? <span className="ml-2 text-xs font-bold uppercase tracking-[0.06em] text-ink-subtle">Serie</span> : null}
                    </p>
                    <p className="text-sm text-ink-subtle">{formatMediumDateTime(t.startsAt)} · {t.location} <span className="ml-1 text-ink-muted group-open:hidden">· Redigera</span></p>
                  </summary>
                  <div className="mt-3 space-y-4">
                    <AdminForm action={updateTraining} submitLabel="Spara ändringar" className="space-y-3">
                      <input type="hidden" name="trainingId" value={t.id} />
                      <input name="startsAt" type="datetime-local" required defaultValue={stockholmDateTimeInput(t.startsAt)} className={field} />
                      <input name="location" required defaultValue={t.location} placeholder="Plats" className={field} />
                      <input name="notes" defaultValue={t.notes ?? ""} placeholder="Anteckning (valfritt)" className={field} />
                    </AdminForm>
                    <AdminForm
                      action={deleteTraining}
                      submitLabel="Ta bort träning"
                      submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
                    >
                      <input type="hidden" name="trainingId" value={t.id} />
                    </AdminForm>
                    {t.seriesId ? (
                      <SeriesActions seriesId={t.seriesId} action={deleteTrainingSeries} label="Ta bort hela serien" />
                    ) : null}
                    <PlayerRequestSection activity={t} activityRef={`training:${t.id}`} />
                    <Link href={`/admin/lagindelning/training/${t.id}`} className="block h-10 rounded-xl border border-divider text-center text-sm font-bold leading-10 text-ink">
                      Lagindelning
                    </Link>
                  </div>
                </details>
              ))}
            </ExpandableList>
          </Card>
          <Card className="p-5">
            <h2 className="section-title">Senaste matcherna</h2>
            <ExpandableList
              initialCount={6}
              moreLabel="Visa fler matcher"
              lessLabel="Visa färre matcher"
              className="mt-3 divide-y divide-divider"
            >
              {matches.map((m) => (
                <details key={m.id} className="group py-3">
                  <summary className="cursor-pointer list-none">
                    <p className="font-bold">
                      {m.team.name} – {matchShortTitle(m)}
                      {m.homeScore !== null && m.awayScore !== null ? ` (${m.isHome ? `${m.homeScore}–${m.awayScore}` : `${m.awayScore}–${m.homeScore}`})` : ""}
                      {m.seriesId ? <span className="ml-2 text-xs font-bold uppercase tracking-[0.06em] text-ink-subtle">Serie</span> : null}
                    </p>
                    <p className="text-sm text-ink-subtle">{formatMediumDateTime(m.startsAt)} · {m.location} <span className="ml-1 text-ink-muted group-open:hidden">· Redigera</span></p>
                  </summary>
                  <div className="mt-3 space-y-4">
                    <AdminForm action={updateMatch} submitLabel="Spara ändringar" className="space-y-3">
                      <input type="hidden" name="matchId" value={m.id} />
                      <label className="block">
                        <span className={label}>Typ</span>
                        <select name="kind" defaultValue={m.kind} className={`${field} mt-1`}>
                          <option value="MATCH">Match</option>
                          <option value="CUP">Cup</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={label}>Startar</span>
                        <input name="startsAt" type="datetime-local" required defaultValue={stockholmDateTimeInput(m.startsAt)} className={`${field} mt-1`} />
                      </label>
                      <label className="block">
                        <span className={label}>Slutar (valfritt)</span>
                        <input name="endsAt" type="datetime-local" defaultValue={m.endsAt ? stockholmDateTimeInput(m.endsAt) : ""} className={`${field} mt-1`} />
                      </label>
                      <input name="opponent" required defaultValue={m.opponent} placeholder="Motståndare, eller cupens namn" className={field} />
                      <input name="location" required defaultValue={m.location} placeholder="Plats" className={field} />
                      <select name="isHome" defaultValue={String(m.isHome)} className={field}>
                        <option value="true">Hemma</option>
                        <option value="false">Borta</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-bold">
                          Hemmalagets mål
                          <input name="homeScore" type="number" min="0" max="99" defaultValue={m.homeScore ?? ""} placeholder="–" className={`${field} mt-1`} />
                        </label>
                        <label className="text-xs font-bold">
                          Bortalagets mål
                          <input name="awayScore" type="number" min="0" max="99" defaultValue={m.awayScore ?? ""} placeholder="–" className={`${field} mt-1`} />
                        </label>
                      </div>
                      <p className="text-xs text-ink-subtle">Lämna tomt om resultatet inte är klart.</p>
                    </AdminForm>
                    <AdminForm
                      action={deleteMatch}
                      submitLabel={`Ta bort ${m.kind === "CUP" ? "cup" : "match"}`}
                      submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
                    >
                      <input type="hidden" name="matchId" value={m.id} />
                    </AdminForm>
                    {m.seriesId ? (
                      <SeriesActions seriesId={m.seriesId} action={deleteMatchSeries} label="Ta bort hela serien" />
                    ) : null}
                    <PlayerRequestSection activity={m} activityRef={`match:${m.id}`} />
                    <Link href={`/admin/lagindelning/match/${m.id}`} className="block h-10 rounded-xl border border-divider text-center text-sm font-bold leading-10 text-ink">
                      Lagindelning
                    </Link>
                  </div>
                </details>
              ))}
            </ExpandableList>
          </Card>
        </div>
      </main>
    </div>
  );
}
