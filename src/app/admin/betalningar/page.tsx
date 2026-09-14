import { createPayment, deletePayment, setPaymentStatus, updatePayment } from "@/app/admin/actions";
import { AdminForm } from "@/components/AdminForm";
import { AdminHeader } from "@/components/AdminHeader";
import { TeamPlayerSelect } from "@/components/admin/CascadingSelects";
import { TeamFilterSelect } from "@/components/TeamFilterSelect";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const money = (ore: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(ore / 100);
const date = (value: Date) => new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(value);
const dateInput = (value: Date) => value.toISOString().slice(0, 10);

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ lag?: string | string[] }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const teamFilter = typeof params.lag === "string" ? params.lag : "";

  const [teams, members, payments] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ season: "desc" }, { name: "asc" }] }),
    prisma.teamMember.findMany({ orderBy: { user: { name: "asc" } }, include: { user: true, team: true } }),
    prisma.payment.findMany({
      where: teamFilter ? { teamId: teamFilter } : undefined,
      orderBy: [{ paidAt: "asc" }, { dueDate: "desc" }],
      take: 200,
      include: { user: true, team: true },
    }),
  ]);

  const unpaid = payments.filter((p) => !p.paidAt);
  const unpaidTotal = unpaid.reduce((sum, p) => sum + p.amountOre, 0);

  return (
    <div>
      <AdminHeader title="Betalningar" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Ny avgift</Eyebrow>
          <h2 className="mt-1 section-title">Registrera betalning</h2>
          <AdminForm action={createPayment} submitLabel="Skapa betalning" className="mt-4 grid gap-3 lg:grid-cols-2" submitClassName="h-11 rounded-xl bg-ink font-bold text-white disabled:opacity-60 lg:col-span-2">
            <div className="grid gap-3 lg:col-span-2 lg:grid-cols-2">
              <TeamPlayerSelect
                teams={teams.map((t) => ({ id: t.id, label: `${t.name} · ${t.season}` }))}
                players={members.map((m) => ({ id: m.id, teamId: m.teamId, label: m.user.name ?? "Namnlös spelare" }))}
                name="membershipId"
              />
            </div>
            <input name="title" required placeholder="Exempel: Säsongsavgift" className={field} />
            <input name="amount" required type="number" min="0" step="0.01" placeholder="Belopp i kronor" className={field} />
            <input name="dueDate" required type="date" className={field} />
            <input name="note" placeholder="Kommentar (valfritt)" className={field} />
          </AdminForm>
        </Card>

        <Card className="p-5">
          <Eyebrow>Filter</Eyebrow>
          <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-sm font-bold text-ink">Lag</span>
              <TeamFilterSelect teams={teams.map((t) => ({ id: t.id, label: `${t.name} · ${t.season}` }))} selectedTeamId={teamFilter} />
            </label>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-divider p-5">
            <h2 className="section-title">{teamFilter ? "Betalningar för valt lag" : "Alla betalningar"}</h2>
            <p className="mt-1 text-sm text-ink-subtle">{unpaid.length} obetalda · {money(unpaidTotal)} totalt obetalt</p>
          </div>
          <div className="divide-y divide-divider">
            {payments.length ? payments.map((p) => (
              <details key={p.id} className="group p-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{p.title} · {money(p.amountOre)}</p>
                    <p className="text-sm text-ink-subtle">{p.user.name} · {p.team.name} · förfaller {date(p.dueDate)}</p>
                    {p.note ? <p className="mt-1 text-xs text-ink-subtle">{p.note}</p> : null}
                  </div>
                  <span className={`rounded-full px-3 py-2 text-xs font-bold ${p.paidAt ? "bg-rink-crease text-success" : "bg-rink-line-red text-signal"}`}>
                    {p.paidAt ? "Betald" : "Obetald"}
                  </span>
                </summary>
                <div className="mt-3 space-y-3">
                  <form action={setPaymentStatus}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input type="hidden" name="paid" value={p.paidAt ? "false" : "true"} />
                    <button className="h-10 w-full rounded-xl border border-divider text-sm font-bold text-ink">
                      {p.paidAt ? "Markera obetald" : "Markera betald"}
                    </button>
                  </form>
                  <AdminForm action={updatePayment} submitLabel="Spara ändringar" className="grid gap-2 sm:grid-cols-2" submitClassName="h-10 rounded-xl bg-ink text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input name="title" required defaultValue={p.title} placeholder="Titel" className={field} />
                    <input name="amount" required type="number" min="0" step="0.01" defaultValue={(p.amountOre / 100).toString()} className={field} />
                    <input name="dueDate" required type="date" defaultValue={dateInput(p.dueDate)} className={field} />
                    <input name="note" defaultValue={p.note ?? ""} placeholder="Kommentar (valfritt)" className={field} />
                  </AdminForm>
                  <AdminForm action={deletePayment} submitLabel="Ta bort betalning" submitClassName="h-10 w-full rounded-xl border border-signal text-sm font-bold text-signal">
                    <input type="hidden" name="paymentId" value={p.id} />
                  </AdminForm>
                </div>
              </details>
            )) : <p className="p-5 text-sm text-ink-subtle">Inga betalningar registrerade.</p>}
          </div>
        </Card>
      </main>
    </div>
  );
}
