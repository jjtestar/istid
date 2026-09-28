"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { audit, requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { normalizeEmail, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";
import { findMutableTeam } from "@/lib/team-guard";

export type InviteState = { error?: string; invite?: { code: string; email: string; team: string; expiresAt: string } } | undefined;

export async function createInvite(_state: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requireAdmin();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const teamId = String(formData.get("teamId") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ange en giltig e-postadress." };
  const team = await findMutableTeam(teamId);
  if (!team) return { error: "Välj ett giltigt lag för innevarande säsong." };
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

export type ResetCodeState = { error?: string; code?: string } | undefined;

/** One-time admin-issued code a locked-out player uses at /aterstall-losenord. Valid 24h, single use. */
export async function createPasswordResetCode(_state: ResetCodeState, formData: FormData): Promise<ResetCodeState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true, accessApproved: true } });
  if (!target) return { error: "Användaren hittades inte." };
  if (!target.isActive || !target.accessApproved) return { error: "Kontot är spärrat och kan inte återställas här." };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      const reset = await prisma.passwordResetCode.create({
        data: { codeHash: secureHash(code, "password-reset"), userId, createdById: admin.id, expiresAt },
      });
      await audit(admin.id, "Skapade återställningskod", "PasswordResetCode", reset.id, userId);
      revalidatePath("/admin/anvandare");
      return { code };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return { error: "Kunde inte skapa en unik kod. Försök igen." };
}

export async function revokePasswordResetCode(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("resetCodeId") ?? "");
  const result = await prisma.passwordResetCode.updateMany({ where: { id, usedAt: null }, data: { revokedAt: new Date() } });
  if (result.count) await audit(admin.id, "Återkallade återställningskod", "PasswordResetCode", id);
  revalidatePath("/admin/anvandare");
}

export type ActionState = { error?: string; success?: string } | undefined;

export async function setUserAccess(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isSuperAdmin: true } });
  if (!target) return { error: "Användaren hittades inte." };
  if (target.id === admin.id) return { error: "Du kan inte ändra din egen åtkomst här." };
  if (target.isSuperAdmin) return { error: "En huvudadmin kan inte spärras." };
  if (target.role === "ADMIN" && !admin.isSuperAdmin) return { error: "Bara en huvudadmin kan spärra en annan admin." };
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await audit(admin.id, isActive ? "Aktiverade användare" : "Spärrade användare", "User", userId);
  revalidatePath("/admin/anvandare");
  return { success: isActive ? "Användaren aktiverades." : "Användaren spärrades." };
}

export async function setUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!["PLAYER", "ADMIN"].includes(role)) return { error: "Ogiltig roll." };
  if (userId === admin.id) return { error: "Du kan inte ändra din egen roll här." };
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { isSuperAdmin: true } });
  if (!target) return { error: "Användaren hittades inte." };
  if (target.isSuperAdmin) return { error: "En huvudadmins roll ändras inte här." };
  if (role === "PLAYER" && !admin.isSuperAdmin) return { error: "Bara en huvudadmin kan ta bort en annan admins roll." };
  await prisma.user.update({ where: { id: userId }, data: { role: role as "PLAYER" | "ADMIN" } });
  await audit(admin.id, role === "ADMIN" ? "Gav adminroll" : "Tog bort adminroll", "User", userId);
  revalidatePath("/admin/anvandare");
  return { success: role === "ADMIN" ? "Användaren är nu admin." : "Adminrollen togs bort." };
}

export async function setSuperAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  const userId = String(formData.get("userId") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!userId || userId === admin.id) return { error: "Du kan inte ändra din egen huvudadminstatus här." };
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSuperAdmin: true } });
  if (!target) return { error: "Användaren hittades inte." };

  try {
    await prisma.$transaction(
      async (tx) => {
        if (enabled) {
          const count = await tx.user.count({ where: { isSuperAdmin: true } });
          if (count >= 2) throw new Error("SUPERADMIN_LIMIT_REACHED");
        }
        await tx.user.update({ where: { id: userId }, data: { isSuperAdmin: enabled, role: enabled ? "ADMIN" : undefined } });
      },
      // Serializable so two concurrent "gör till huvudadmin" clicks can't both
      // pass the count check and push the total past 2 — one transaction
      // loses the race and rolls back instead of silently over-committing.
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SUPERADMIN_LIMIT_REACHED") return { error: "Det finns redan 2 huvudadmins." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { error: "En annan ändring krockade med den här. Försök igen." };
    }
    throw error;
  }

  await audit(admin.id, enabled ? "Utsåg huvudadmin" : "Tog bort huvudadmin", "User", userId);
  revalidatePath("/admin/anvandare");
  return { success: enabled ? "Utsedd till huvudadmin." : "Huvudadminstatus togs bort." };
}
