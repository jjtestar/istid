"use server";

import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const POSITIONS = new Set(["Forward", "Back", "Målvakt"]);

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function stockholmDateTime(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const guess = new Date(`${match[1]}T${match[2]}:00Z`);
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Stockholm", timeZoneName: "longOffset" })
    .formatToParts(guess).find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const offset = /GMT([+-])(\d{2}):(\d{2})/.exec(zone);
  const minutes = offset ? (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1) : 0;
  return new Date(guess.getTime() - minutes * 60_000);
}
function calendarDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : null;
}
function position(value: string) { return POSITIONS.has(value) ? value : null; }

export async function createTeam(formData: FormData) {
  const admin = await requireAdmin();
  const name = text(formData, "name");
  const season = text(formData, "season");
  if (name.length < 2 || !/^\d{4}\/\d{2}$/.test(season)) return;
  const team = await prisma.team.create({ data: { name, season } });
  await audit(admin.id, "Skapade lag", "Team", team.id, `${name} · ${season}`);
  revalidatePath("/admin");
  revalidatePath("/admin/lag");
}

export async function assignTeamMember(formData: FormData) {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const userId = text(formData, "userId");
  const requestedPosition = position(text(formData, "position"));
  const [team, user] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  if (!team || !user) return;
  const member = await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    update: { position: requestedPosition },
    create: { teamId, userId, position: requestedPosition },
  });
  await audit(admin.id, "Tilldelade spelare till lag", "TeamMember", member.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/lag");
}

export async function updateTeamMember(formData: FormData) {
  const admin = await requireAdmin();
  const membershipId = text(formData, "membershipId");
  const requestedPosition = position(text(formData, "position"));
  const member = await prisma.teamMember.update({ where: { id: membershipId }, data: { position: requestedPosition } });
  await audit(admin.id, "Ändrade spelarposition", "TeamMember", member.id, requestedPosition ?? "Ingen position");
  revalidatePath("/admin/lag");
  revalidatePath("/lag");
}

export async function removeTeamMember(formData: FormData) {
  const admin = await requireAdmin();
  const membershipId = text(formData, "membershipId");
  const member = await prisma.teamMember.delete({ where: { id: membershipId } });
  await audit(admin.id, "Tog bort spelare från lag", "TeamMember", member.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/lag");
}

export async function createTraining(formData: FormData) {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const location = text(formData, "location");
  const notes = text(formData, "notes");
  if (!startsAt || !location || !(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return;
  const training = await prisma.training.create({ data: { teamId, startsAt, location, notes: notes || null } });
  await audit(admin.id, "Skapade träning", "Training", training.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
}

export async function createMatch(formData: FormData) {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const opponent = text(formData, "opponent");
  const location = text(formData, "location");
  const isHome = formData.get("isHome") === "true";
  if (!startsAt || !opponent || !location || !(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return;
  const match = await prisma.match.create({ data: { teamId, startsAt, opponent, location, isHome } });
  await audit(admin.id, "Skapade match", "Match", match.id, opponent);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
}

export async function createPayment(formData: FormData) {
  const admin = await requireAdmin();
  const membershipId = text(formData, "membershipId");
  const title = text(formData, "title");
  const amountOre = Math.round(Number(text(formData, "amount").replace(",", ".")) * 100);
  const dueDate = calendarDate(text(formData, "dueDate"));
  const note = text(formData, "note");
  const membership = await prisma.teamMember.findUnique({ where: { id: membershipId }, select: { userId: true, teamId: true } });
  if (!membership || !title || !dueDate || !Number.isInteger(amountOre) || amountOre < 0) return;
  const payment = await prisma.payment.create({ data: { userId: membership.userId, teamId: membership.teamId, title, amountOre, dueDate, note: note || null } });
  await audit(admin.id, "Skapade betalning", "Payment", payment.id, `${title}: ${amountOre / 100} kr`);
  revalidatePath("/admin");
  revalidatePath("/admin/betalningar");
  revalidatePath("/betalningar");
}

export async function setPaymentStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "paymentId");
  const paid = formData.get("paid") === "true";
  const payment = await prisma.payment.update({ where: { id }, data: { paidAt: paid ? new Date() : null } });
  await audit(admin.id, paid ? "Markerade betalning som betald" : "Markerade betalning som obetald", "Payment", payment.id);
  revalidatePath("/admin");
  revalidatePath("/admin/betalningar");
  revalidatePath("/betalningar");
}

export async function saveMatchStat(formData: FormData) {
  const admin = await requireAdmin();
  const matchId = text(formData, "matchId");
  const userId = text(formData, "userId");
  const goals = Number(text(formData, "goals"));
  const assists = Number(text(formData, "assists"));
  const penaltyMinutes = Number(text(formData, "penaltyMinutes"));
  if (![goals, assists, penaltyMinutes].every((value) => Number.isInteger(value) && value >= 0 && value <= 99)) return;
  const match = await prisma.match.findFirst({ where: { id: matchId, team: { members: { some: { userId } } } }, select: { id: true } });
  if (!match) return;
  const stat = await prisma.matchStat.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: { goals, assists, penaltyMinutes },
    create: { matchId, userId, goals, assists, penaltyMinutes },
  });
  await audit(admin.id, "Uppdaterade matchstatistik", "MatchStat", stat.id);
  revalidatePath("/statistik");
  revalidatePath("/admin/statistik");
}

export async function saveTrainingAttendance(formData: FormData) {
  const admin = await requireAdmin();
  const trainingId = text(formData, "trainingId");
  const userId = text(formData, "userId");
  const attendedValue = text(formData, "attended");
  if (!["true", "false"].includes(attendedValue)) return;
  const training = await prisma.training.findFirst({ where: { id: trainingId, team: { members: { some: { userId } } } }, select: { id: true } });
  if (!training) return;
  const registration = await prisma.trainingRegistration.upsert({
    where: { trainingId_userId: { trainingId, userId } },
    update: { attended: attendedValue === "true" },
    create: { trainingId, userId, status: "GOING", attended: attendedValue === "true" },
  });
  await audit(admin.id, "Uppdaterade träningsnärvaro", "TrainingRegistration", registration.id);
  revalidatePath("/statistik");
  revalidatePath("/admin/statistik");
}

export async function createHighlight(formData: FormData) {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const title = text(formData, "title");
  const url = text(formData, "url");
  let parsed: URL;
  try { parsed = new URL(url); } catch { return; }
  if (!["http:", "https:"].includes(parsed.protocol) || !title || !(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return;
  const highlight = await prisma.highlight.create({ data: { teamId, authorId: admin.id, title, url: parsed.toString() } });
  await audit(admin.id, "Lade till highlight", "Highlight", highlight.id, title);
  revalidatePath("/");
  revalidatePath("/admin/highlights");
}

export async function deleteHighlight(formData: FormData) {
  const admin = await requireAdmin();
  const id = text(formData, "highlightId");
  const highlight = await prisma.highlight.delete({ where: { id } });
  await audit(admin.id, "Tog bort highlight", "Highlight", highlight.id, highlight.title);
  revalidatePath("/");
  revalidatePath("/admin/highlights");
}
