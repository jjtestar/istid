import Link from "next/link";
import { createMatch, createPlayerRequest, createTraining, deleteMatch, deleteTraining, resolvePlayerRequest, updateMatch, updateTraining } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const fmt = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" });
const localInput = (d: Date) => {
  const stockholm = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => stockholm.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const POSITION_LABEL: Record<string, string> = { GOALKEEPER: "Målvakt", SKATER: "Utespelare" };

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

export default async function AdminActivitiesPage() {
  await requireAdmin();
  const [teams, trainings, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }] }),
    prisma.training.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { team: true, playerRequests: { where: { resolvedAt: null } } } }),
    prisma.match.findMany({ orderBy: { startsAt: "desc" }, take: 30, include: { team: true, playerRequests: { where: { resolvedAt: null } } } }),
  ]);

  return (
    <div>
      <AdminHeader title="Aktiviteter" />
      <main className="space-y-6 px-5 pb-10">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <Eyebrow>Träning</Eyebrow>
            <h2 className="mt-1 section-title">Skapa träning</h2>
            <AdminForm action={createTraining} submitLabel="Skapa träning" className="mt-4 space-y-3">
              <select name="teamId" required className={field}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}
              </select>
              <input name="startsAt" type="datetime-local" required className={field} />
              <input name="location" required placeholder="Plats" className={field} />
              <input name="notes" placeholder="Anteckning (valfritt)" className={field} />
            </AdminForm>
          </Card>
          <Card className="p-5">
            <Eyebrow>Match</Eyebrow>
            <h2 className="mt-1 section-title">Skapa match</h2>
            <AdminForm action={createMatch} submitLabel="Skapa match" className="mt-4 space-y-3">
              <select name="teamId" required className={field}>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}
              </select>
              <input name="startsAt" type="datetime-local" required className={field} />
              <input name="opponent" required placeholder="Motståndare" className={field} />
              <input name="location" required placeholder="Plats" className={field} />
              <select name="isHome" className={field}>
                <option value="true">Hemmamatch</option>
                <option value="false">Bortamatch</option>
              </select>
            </AdminForm>
          </Card>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <h2 className="section-title">Senaste träningarna</h2>
            <div className="mt-3 divide-y divide-divider">
              {trainings.map((t) => (
                <details key={t.id} className="group py-3">
                  <summary className="cursor-pointer list-none">
                    <p className="font-bold">{t.team.name}</p>
                    <p className="text-sm text-ink-subtle">{fmt.format(t.startsAt)} · {t.location} <span className="ml-1 text-ink-muted group-open:hidden">· Redigera</span></p>
                  </summary>
                  <div className="mt-3 space-y-4">
                    <AdminForm action={updateTraining} submitLabel="Spara ändringar" className="space-y-3">
                      <input type="hidden" name="trainingId" value={t.id} />
                      <input name="startsAt" type="datetime-local" required defaultValue={localInput(t.startsAt)} className={field} />
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
                    <PlayerRequestSection activity={t} activityRef={`training:${t.id}`} />
                    <Link href={`/admin/lagindelning/training/${t.id}`} className="block h-10 rounded-xl border border-divider text-center text-sm font-bold leading-10 text-ink">
                      Lagindelning
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="section-title">Senaste matcherna</h2>
            <div className="mt-3 divide-y divide-divider">
              {matches.map((m) => (
                <details key={m.id} className="group py-3">
                  <summary className="cursor-pointer list-none">
                    <p className="font-bold">
                      {m.team.name} – {m.opponent}
                      {m.homeScore !== null && m.awayScore !== null ? ` (${m.isHome ? `${m.homeScore}–${m.awayScore}` : `${m.awayScore}–${m.homeScore}`})` : ""}
                    </p>
                    <p className="text-sm text-ink-subtle">{fmt.format(m.startsAt)} · {m.location} <span className="ml-1 text-ink-muted group-open:hidden">· Redigera</span></p>
                  </summary>
                  <div className="mt-3 space-y-4">
                    <AdminForm action={updateMatch} submitLabel="Spara ändringar" className="space-y-3">
                      <input type="hidden" name="matchId" value={m.id} />
                      <input name="startsAt" type="datetime-local" required defaultValue={localInput(m.startsAt)} className={field} />
                      <input name="opponent" required defaultValue={m.opponent} placeholder="Motståndare" className={field} />
                      <input name="location" required defaultValue={m.location} placeholder="Plats" className={field} />
                      <select name="isHome" defaultValue={String(m.isHome)} className={field}>
                        <option value="true">Hemmamatch</option>
                        <option value="false">Bortamatch</option>
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
                      submitLabel="Ta bort match"
                      submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal"
                    >
                      <input type="hidden" name="matchId" value={m.id} />
                    </AdminForm>
                    <PlayerRequestSection activity={m} activityRef={`match:${m.id}`} />
                    <Link href={`/admin/lagindelning/match/${m.id}`} className="block h-10 rounded-xl border border-divider text-center text-sm font-bold leading-10 text-ink">
                      Lagindelning
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
