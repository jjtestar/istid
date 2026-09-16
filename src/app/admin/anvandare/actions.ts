"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { audit, requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { generatePin, normalizeEmail, secureHash } from "@/lib/invite-security";
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
    const code = generatePin();
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
    if (error instanceof Error && error.message === "SUPERADMIN_LIMIT_REACHED") return;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return;
    throw error;
  }

  await audit(admin.id, enabled ? "Utsåg huvudadmin" : "Tog bort huvudadmin", "User", userId);
  revalidatePath("/admin/anvandare");
}

export type PasswordResetState =
  | { error?: string; reset?: { code: string; name: string; email: string; expiresAt: string } }
  | undefined;

/**
 * There is no e-mail sender in this app, so account recovery mirrors how
 * invitations already work: the administrator generates a one-time PIN, reads
 * it out to the player, and the player redeems it on /aterstall.
 */
export async function createPasswordReset(
  _state: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isSuperAdmin: true, isActive: true },
  });
  if (!target) return { error: "Användaren hittades inte." };

  // Handing out a reset PIN is a full account takeover, so it follows the same
  // rules as changing someone's role: a plain admin may only reset players,
  // nobody but a huvudadmin may reset an admin, and no huvudadmin may be reset
  // by anyone other than themselves.
  const allowed =
    target.id === admin.id || (!target.isSuperAdmin && (admin.isSuperAdmin || target.role === "PLAYER"));
  if (!allowed) return { error: "Du har inte behörighet att återställa det kontots lösenord." };
  if (!target.isActive) return { error: "Kontot är spärrat. Aktivera det först." };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generatePin();
    try {
      const reset = await prisma.$transaction(async (tx) => {
        // Only one live code per account, so an older one that leaked can't
        // still be redeemed after a new one is issued.
        await tx.passwordResetCode.updateMany({
          where: { userId: target.id, usedAt: null, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return tx.passwordResetCode.create({
          data: { codeHash: secureHash(code, "password-reset"), userId: target.id, createdById: admin.id, expiresAt },
        });
      });
      await audit(admin.id, "Skapade lösenordsåterställning", "PasswordResetCode", reset.id, target.email);
      revalidatePath("/admin/anvandare");
      return {
        reset: {
          code,
          name: target.name ?? target.email,
          email: target.email,
          expiresAt: expiresAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  return { error: "Kunde inte skapa en unik kod. Försök igen." };
}
