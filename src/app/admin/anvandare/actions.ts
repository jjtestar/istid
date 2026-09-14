"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { audit, requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { normalizeEmail, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

export type InviteState = { error?: string; invite?: { code: string; email: string; team: string; expiresAt: string } } | undefined;

export async function createInvite(_state: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requireAdmin();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const teamId = String(formData.get("teamId") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ange en giltig e-postadress." };
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, season: true } });
  if (!team) return { error: "Välj ett giltigt lag." };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return { error: "Det finns redan ett konto med den e-postadressen." };

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      const invite = await prisma.inviteCode.create({ data: { codeHash: secureHash(code, "invite"), email, teamId, createdById: admin.id, expiresAt } });
      await audit(admin.id, "Skapade PIN-inbjudan", "InviteCode", invite.id, email);
      revalidatePath("/admin/anvandare");
      return { invite: { code, email, team: `${team.name} · ${team.season}`, expiresAt: expiresAt.toISOString() } };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return { error: "Kunde inte skapa en unik kod. Försök igen." };
}

export async function revokeInvite(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("inviteId") ?? "");
  const result = await prisma.inviteCode.updateMany({ where: { id, usedAt: null }, data: { revokedAt: new Date() } });
  if (result.count) await audit(admin.id, "Återkallade PIN-inbjudan", "InviteCode", id);
  revalidatePath("/admin/anvandare");
}

export async function setUserAccess(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isSuperAdmin: true } });
  if (!target || target.id === admin.id || target.isSuperAdmin || (target.role === "ADMIN" && !admin.isSuperAdmin)) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await audit(admin.id, isActive ? "Aktiverade användare" : "Spärrade användare", "User", userId);
  revalidatePath("/admin/anvandare");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!["PLAYER", "ADMIN"].includes(role) || userId === admin.id) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { isSuperAdmin: true } });
  if (!target || target.isSuperAdmin || (role === "PLAYER" && !admin.isSuperAdmin)) return;
  await prisma.user.update({ where: { id: userId }, data: { role: role as "PLAYER" | "ADMIN" } });
  await audit(admin.id, role === "ADMIN" ? "Gav adminroll" : "Tog bort adminroll", "User", userId);
  revalidatePath("/admin/anvandare");
}

export async function setSuperAdmin(formData: FormData) {
  const admin = await requireSuperAdmin();
  const userId = String(formData.get("userId") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!userId || userId === admin.id) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSuperAdmin: true } });
  if (!target) return;
  if (enabled) {
    const count = await prisma.user.count({ where: { isSuperAdmin: true } });
    if (count >= 2) return;
  }
  await prisma.user.update({ where: { id: userId }, data: { isSuperAdmin: enabled, role: enabled ? "ADMIN" : undefined } });
  await audit(admin.id, enabled ? "Utsåg huvudadmin" : "Tog bort huvudadmin", "User", userId);
  revalidatePath("/admin/anvandare");
}
