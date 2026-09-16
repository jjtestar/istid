import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  // requireActiveUser already bounces missing, blocked and unapproved accounts,
  // so all that is left here is the role itself.
  const user = await requireActiveUser();
  if (user.role !== "ADMIN" && !user.isSuperAdmin) redirect("/");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (!user.isSuperAdmin) redirect("/admin");
  return user;
}

export async function audit(actorId: string, action: string, entityType: string, entityId?: string, details?: string) {
  await prisma.adminAuditLog.create({ data: { actorId, action, entityType, entityId, details } });
}
