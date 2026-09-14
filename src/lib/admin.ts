import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.isActive || !user.accessApproved || (user.role !== "ADMIN" && !user.isSuperAdmin)) redirect("/");
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
