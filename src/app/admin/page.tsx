import Link from "next/link";
import { ActivityIcon, ChartIcon, ClipboardIcon, InfoIcon, PaymentIcon, ShieldIcon, TrophyIcon, UsersIcon, VideoIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const modules = [
  { href: "/admin/anvandare", label: "Användare", description: "Konton, roller och PIN-koder", icon: UsersIcon },
  { href: "/admin/information", label: "Information", description: "Publicera nyheter till valda lag", icon: InfoIcon },
  { href: "/admin/lag", label: "Lag & spelare", description: "Medlemskap och positioner", icon: ShieldIcon },
  { href: "/admin/aktiviteter", label: "Aktiviteter", description: "Matcher och träningar", icon: ActivityIcon },
  { href: "/admin/betalningar", label: "Betalningar", description: "Betald och obetald", icon: PaymentIcon },
  { href: "/admin/statistik", label: "Statistik", description: "Matcher och närvaro", icon: ChartIcon },
  { href: "/admin/highlights", label: "Highlights", description: "Lägg till och hantera klipp", icon: VideoIcon },
];

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, teams, unpaid, logs] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.team.count(),
    prisma.payment.count({ where: { paidAt: null } }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { actor: { select: { name: true } } } }),
  ]);

  return (
    <div>
      <PageHeader title="Administration" back={{ href: "/mer", label: "Tillbaka till Mer" }} />
      <main className="space-y-6 px-5 pb-10">
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-divider bg-white p-4"><p className="text-2xl font-bold">{users}</p><p className="text-xs text-ink-subtle">aktiva konton</p></div>
          <div className="rounded-2xl border border-divider bg-white p-4"><p className="text-2xl font-bold">{teams}</p><p className="text-xs text-ink-subtle">lag</p></div>
          <div className="rounded-2xl border border-divider bg-white p-4"><p className="text-2xl font-bold text-signal">{unpaid}</p><p className="text-xs text-ink-subtle">obetalda</p></div>
        </section>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {modules.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-h-40 flex-col justify-between rounded-2xl border border-divider bg-white p-5 hover:border-ink">
              <Icon className="h-7 w-7 text-signal" /><span><span className="block text-lg font-bold text-ink">{label}</span><span className="mt-1 block text-sm text-ink-subtle">{description}</span></span>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl border border-divider bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><ClipboardIcon className="h-5 w-5" /><h2 className="section-title">Senaste adminaktivitet</h2></div>
            <Link href="/admin/logg" className="text-sm font-bold text-signal underline underline-offset-4">Visa allt</Link>
          </div>
          {logs.length ? <div className="mt-4 divide-y divide-divider">{logs.map((log) => <div key={log.id} className="py-3 text-sm"><p className="font-bold">{log.action}</p><p className="text-ink-subtle">{log.actor.name ?? "Administratör"} · {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(log.createdAt)}</p></div>)}</div> : <p className="mt-3 text-sm text-ink-subtle">Ingen aktivitet registrerad ännu.</p>}
        </section>
        {admin.isSuperAdmin ? <p className="text-center text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle"><TrophyIcon className="mr-1 inline h-4 w-4" />Huvudadmin</p> : null}
      </main>
    </div>
  );
}
