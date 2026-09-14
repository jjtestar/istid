"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { normalizeEmail, secureHash } from "@/lib/invite-security";
import { prisma } from "@/lib/prisma";

export type InviteState = {
  error?: string;
  invite?: { code: string; email: string; team: string; expiresAt: string };
} | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("UNAUTHORIZED");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.isActive || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function createInvite(_state: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requireAdmin();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const teamId = String(formData.get("teamId") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Ange en giltig e-postadress." };

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, season: true } });
  if (!team) return { error: "Välj ett giltigt lag." };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Det finns redan ett konto med den e-postadressen." };
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      await prisma.inviteCode.create({
        data: { codeHash: secureHash(code, "invite"), email, teamId, createdById: admin.id, expiresAt },
      });
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
  await requireAdmin();
  const id = String(formData.get("inviteId") ?? "");
  await prisma.inviteCode.updateMany({ where: { id, usedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/anvandare");
}

export async function setUserAccess(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!userId || userId === admin.id) return;
  await prisma.user.updateMany({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/anvandare");
}
