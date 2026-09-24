import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { LineupEditor } from "@/components/admin/LineupEditor";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { formatFullDateTime, matchTitle } from "@/lib/format";
import { LineupData } from "@/lib/lineup";
import { prisma } from "@/lib/prisma";

export default async function AdminLineupPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  await requireAdmin();
  const { kind, id } = await params;
  if (kind !== "training" && kind !== "match") notFound();

  const activity =
    kind === "training"
      ? await prisma.training.findUnique({ where: { id }, include: { team: true, lineupPlan: true } })
      : await prisma.match.findUnique({ where: { id }, include: { team: true, lineupPlan: true } });
  if (!activity) notFound();

  const roster = await prisma.teamMember.findMany({
    where: { teamId: activity.teamId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { jerseyNo: "asc" },
  });

  const title =
    kind === "training"
      ? "Träning"
      : matchTitle(activity as { kind: "MATCH" | "CUP"; isHome: boolean; opponent: string });

  return (
    <div>
      <AdminHeader title="Lagindelning" />
      <main className="space-y-6 px-5 pb-10">
        <Card className="p-5">
          <Eyebrow>{activity.team.name}</Eyebrow>
          <h2 className="mt-1 section-title">{title}</h2>
          <p className="mt-1 text-sm text-ink-subtle">{formatFullDateTime(activity.startsAt)}</p>
        </Card>
        <Card className="p-5">
          <LineupEditor
            activityRef={`${kind}:${id}`}
            roster={roster.map((m) => ({ id: m.user.id, name: m.user.name ?? "Namnlös spelare", jerseyNo: m.jerseyNo }))}
            initialData={(activity.lineupPlan?.data as LineupData | undefined) ?? null}
          />
        </Card>
      </main>
    </div>
  );
}
