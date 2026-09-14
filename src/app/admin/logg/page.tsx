import Link from "next/link";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 30;
const fmt = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" });
const field = "h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ sida?: string | string[]; aktor?: string | string[]; typ?: string | string[] }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(typeof params.sida === "string" ? params.sida : "1") || 1);
  const actorId = typeof params.aktor === "string" ? params.aktor : "";
  const entityType = typeof params.typ === "string" ? params.typ : "";

  const [actors, entityTypes, total, logs] = await Promise.all([
    prisma.user.findMany({ where: { adminAuditLogs: { some: {} } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.adminAuditLog.findMany({ select: { entityType: true }, distinct: ["entityType"], orderBy: { entityType: "asc" } }),
    prisma.adminAuditLog.count({ where: { actorId: actorId || undefined, entityType: entityType || undefined } }),
    prisma.adminAuditLog.findMany({
      where: { actorId: actorId || undefined, entityType: entityType || undefined },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const queryWithout = (key: string) => {
    const p = new URLSearchParams();
    if (actorId && key !== "aktor") p.set("aktor", actorId);
    if (entityType && key !== "typ") p.set("typ", entityType);
    return p;
  };

  return (
    <div>
      <AdminHeader title="Adminlogg" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>Filter</Eyebrow>
          <form method="get" className="mt-3 grid gap-3 sm:grid-cols-2">
            <select name="aktor" defaultValue={actorId} className={field}>
              <option value="">Alla administratörer</option>
              {actors.map((a) => <option key={a.id} value={a.id}>{a.name ?? "Namnlös"}</option>)}
            </select>
            <select name="typ" defaultValue={entityType} className={field}>
              <option value="">Alla typer</option>
              {entityTypes.map((e) => <option key={e.entityType} value={e.entityType}>{e.entityType}</option>)}
            </select>
            <button type="submit" className="h-11 rounded-xl bg-ink font-bold text-white sm:col-span-2">Filtrera</button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-divider p-5">
            <h2 className="section-title">Adminåtgärder</h2>
            <p className="mt-1 text-sm text-ink-subtle">{total} totalt</p>
          </div>
          {logs.length ? (
            <div className="divide-y divide-divider">
              {logs.map((log) => (
                <div key={log.id} className="p-4 text-sm">
                  <p className="font-bold">{log.action}</p>
                  <p className="text-ink-subtle">{log.actor.name ?? "Administratör"} · {fmt.format(log.createdAt)} · {log.entityType}</p>
                  {log.details ? <p className="mt-1 text-ink-muted">{log.details}</p> : null}
                </div>
              ))}
            </div>
          ) : <p className="p-5 text-sm text-ink-subtle">Inga adminåtgärder matchar filtret.</p>}
        </Card>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <Link
              aria-disabled={page <= 1}
              href={`/admin/logg?${(() => { const p = queryWithout(""); if (page > 2) p.set("sida", String(page - 1)); return p.toString(); })()}`}
              className={`h-11 rounded-xl border border-divider px-4 text-sm font-bold ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              Föregående
            </Link>
            <span className="text-sm text-ink-subtle">Sida {page} av {totalPages}</span>
            <Link
              aria-disabled={page >= totalPages}
              href={`/admin/logg?${(() => { const p = queryWithout(""); p.set("sida", String(page + 1)); return p.toString(); })()}`}
              className={`h-11 rounded-xl border border-divider px-4 text-sm font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            >
              Nästa
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
