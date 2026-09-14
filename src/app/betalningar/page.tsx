import { PageHeader } from "@/components/PageHeader";
import { TeamFilterSelect } from "@/components/TeamFilterSelect";
import { Card, Eyebrow } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const money = (ore: number) => new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(ore / 100);
const date = (value: Date) => new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(value);

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ lag?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  const allPayments = await prisma.payment.findMany({ where: { userId: user.id }, orderBy: [{ paidAt: "asc" }, { dueDate: "desc" }], include: { team: true } });

  const teams = Array.from(new Map(allPayments.map((p) => [p.teamId, p.team])).values());
  const params = await searchParams;
  const requestedTeamId = typeof params.lag === "string" ? params.lag : "";
  const teamFilter = teams.some((t) => t.id === requestedTeamId) ? requestedTeamId : "";
  const payments = teamFilter ? allPayments.filter((p) => p.teamId === teamFilter) : allPayments;
  const unpaid = payments.filter((p) => !p.paidAt);

  const perTeam = teams.map((team) => {
    const teamUnpaid = allPayments.filter((p) => p.teamId === team.id && !p.paidAt);
    return { team, unpaidOre: teamUnpaid.reduce((sum, p) => sum + p.amountOre, 0), unpaidCount: teamUnpaid.length };
  });

  return (
    <div>
      <PageHeader title="Betalningar" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Översikt</Eyebrow>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-ink">{money(unpaid.reduce((sum, p) => sum + p.amountOre, 0))}</p>
              <p className="text-sm text-ink-subtle">kvar att betala{teamFilter ? " för valt lag" : ""}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${unpaid.length ? "bg-rink-line-red text-signal" : "bg-rink-crease text-success"}`}>
              {unpaid.length ? `${unpaid.length} obetalda` : "Allt betalt"}
            </span>
          </div>
          {teams.length > 1 ? (
            <div className="mt-4 space-y-1.5 border-t border-divider pt-4">
              {perTeam.map(({ team, unpaidOre, unpaidCount }) => (
                <div key={team.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-subtle">{team.name}</span>
                  <span className={`font-bold ${unpaidCount ? "text-signal" : "text-success"}`}>{unpaidCount ? money(unpaidOre) : "Allt betalt"}</span>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        {teams.length > 1 ? (
          <form method="get">
            <TeamFilterSelect teams={teams.map((t) => ({ id: t.id, label: t.name }))} selectedTeamId={teamFilter} />
          </form>
        ) : null}

        <Card className="overflow-hidden">
          <div className="divide-y divide-divider">
            {payments.length ? payments.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{p.title}</p>
                    <p className="text-sm text-ink-subtle">{p.team.name} · förfaller {date(p.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{money(p.amountOre)}</p>
                    <p className={`text-xs font-bold ${p.paidAt ? "text-success" : "text-signal"}`}>{p.paidAt ? `Betald ${date(p.paidAt)}` : "Obetald"}</p>
                  </div>
                </div>
                {p.note ? <p className="mt-2 text-sm text-ink-subtle">{p.note}</p> : null}
              </div>
            )) : <p className="p-5 text-sm text-ink-subtle">Du har inga registrerade betalningar{teamFilter ? " för valt lag" : ""}.</p>}
          </div>
        </Card>
      </main>
    </div>
  );
}
