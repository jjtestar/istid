"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { audit, requireAdmin } from "@/lib/admin";
import { isValidLineupData } from "@/lib/lineup";
import { prisma } from "@/lib/prisma";

const POSITIONS = new Set(["Forward", "Back", "Målvakt"]);

export type FormState = { error?: string; success?: string } | undefined;

function text(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function optionalScore(formData: FormData, key: string) {
  const value = text(formData, key);
  if (value === "") return { ok: true as const, value: null };
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 99
    ? { ok: true as const, value: parsed }
    : { ok: false as const, value: null };
}
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

export async function updateTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "teamId");
  const name = text(formData, "name");
  const season = text(formData, "season");
  if (name.length < 2) return { error: "Ange ett lagnamn." };
  if (!/^\d{4}\/\d{2}$/.test(season)) return { error: "Säsong ska skrivas som 2026/27." };
  const team = await prisma.team.update({ where: { id }, data: { name, season } }).catch(() => null);
  if (!team) return { error: "Laget hittades inte." };
  await audit(admin.id, "Ändrade lag", "Team", team.id, `${name} · ${season}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin/lag");
  return { success: "Laget sparades." };
}

export async function archiveTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "teamId");
  const team = await prisma.team.update({ where: { id }, data: { archivedAt: new Date() } }).catch(() => null);
  if (!team) return { error: "Laget hittades inte." };
  await audit(admin.id, "Arkiverade lag", "Team", team.id, team.name);
  revalidatePath("/", "layout");
  revalidatePath("/admin/lag");
  return { success: "Laget arkiverades." };
}

export async function unarchiveTeam(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "teamId");
  const team = await prisma.team.update({ where: { id }, data: { archivedAt: null } }).catch(() => null);
  if (!team) return { error: "Laget hittades inte." };
  await audit(admin.id, "Återställde arkiverat lag", "Team", team.id, team.name);
  revalidatePath("/", "layout");
  revalidatePath("/admin/lag");
  return { success: "Laget är aktivt igen." };
}

export async function setPlayerTeams(formData: FormData) {
  const admin = await requireAdmin();
  const userId = text(formData, "userId");
  const requestedTeamIds = new Set(formData.getAll("teamIds").map(String));
  const [user, activeTeams, currentMemberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.team.findMany({ where: { archivedAt: null }, select: { id: true } }),
    prisma.teamMember.findMany({ where: { userId, team: { archivedAt: null } }, select: { id: true, teamId: true } }),
  ]);
  if (!user) return;
  const activeTeamIds = new Set(activeTeams.map((t) => t.id));
  const wantedTeamIds = [...requestedTeamIds].filter((id) => activeTeamIds.has(id));
  const currentTeamIds = new Set(currentMemberships.map((m) => m.teamId));
  const toAdd = wantedTeamIds.filter((id) => !currentTeamIds.has(id));
  const toRemove = currentMemberships.filter((m) => !requestedTeamIds.has(m.teamId));
  if (!toAdd.length && !toRemove.length) return;
  await prisma.$transaction([
    ...toAdd.map((teamId) => prisma.teamMember.create({ data: { teamId, userId } })),
    ...toRemove.map((m) => prisma.teamMember.delete({ where: { id: m.id } })),
  ]);
  await audit(admin.id, "Ändrade spelarens lag", "User", userId, `${wantedTeamIds.length} lag`);
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

export async function createTraining(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const location = text(formData, "location");
  const notes = text(formData, "notes");
  if (!startsAt) return { error: "Ange ett giltigt datum och tid." };
  if (!location) return { error: "Ange en plats." };
  if (!(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return { error: "Laget hittades inte." };
  const training = await prisma.training.create({ data: { teamId, startsAt, location, notes: notes || null } });
  await audit(admin.id, "Skapade träning", "Training", training.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  return { success: "Träningen skapades." };
}

export async function updateTraining(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "trainingId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const location = text(formData, "location");
  const notes = text(formData, "notes");
  if (!startsAt) return { error: "Ange ett giltigt datum och tid." };
  if (!location) return { error: "Ange en plats." };
  const training = await prisma.training.update({ where: { id }, data: { startsAt, location, notes: notes || null } }).catch(() => null);
  if (!training) return { error: "Träningen hittades inte." };
  await audit(admin.id, "Ändrade träning", "Training", training.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  return { success: "Träningen sparades." };
}

export async function deleteTraining(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "trainingId");
  const training = await prisma.training.delete({ where: { id } }).catch(() => null);
  if (!training) return { error: "Träningen hittades inte." };
  await audit(admin.id, "Tog bort träning", "Training", training.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  return { success: "Träningen togs bort." };
}

export async function createMatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const opponent = text(formData, "opponent");
  const location = text(formData, "location");
  const isHome = formData.get("isHome") === "true";
  if (!startsAt) return { error: "Ange ett giltigt datum och tid." };
  if (!opponent) return { error: "Ange motståndare." };
  if (!location) return { error: "Ange en plats." };
  if (!(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return { error: "Laget hittades inte." };
  const match = await prisma.match.create({ data: { teamId, startsAt, opponent, location, isHome } });
  await audit(admin.id, "Skapade match", "Match", match.id, opponent);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  return { success: "Matchen skapades." };
}

export async function updateMatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "matchId");
  const startsAt = stockholmDateTime(text(formData, "startsAt"));
  const opponent = text(formData, "opponent");
  const location = text(formData, "location");
  const isHome = formData.get("isHome") === "true";
  const homeScore = optionalScore(formData, "homeScore");
  const awayScore = optionalScore(formData, "awayScore");
  if (!startsAt) return { error: "Ange ett giltigt datum och tid." };
  if (!opponent) return { error: "Ange motståndare." };
  if (!location) return { error: "Ange en plats." };
  if (!homeScore.ok || !awayScore.ok) return { error: "Resultatet måste vara heltal 0–99, eller lämnas tomt." };
  const match = await prisma.match
    .update({
      where: { id },
      data: { startsAt, opponent, location, isHome, homeScore: homeScore.value, awayScore: awayScore.value },
    })
    .catch(() => null);
  if (!match) return { error: "Matchen hittades inte." };
  await audit(admin.id, "Ändrade match", "Match", match.id, opponent);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  revalidatePath("/statistik");
  return { success: "Matchen sparades." };
}

export async function deleteMatch(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "matchId");
  const match = await prisma.match.delete({ where: { id } }).catch(() => null);
  if (!match) return { error: "Matchen hittades inte." };
  await audit(admin.id, "Tog bort match", "Match", match.id, match.opponent);
  revalidatePath("/", "layout");
  revalidatePath("/admin/aktiviteter");
  revalidatePath("/statistik");
  return { success: "Matchen togs bort." };
}

export async function createPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const membershipId = text(formData, "membershipId");
  const title = text(formData, "title");
  const amountOre = Math.round(Number(text(formData, "amount").replace(",", ".")) * 100);
  const dueDate = calendarDate(text(formData, "dueDate"));
  const note = text(formData, "note");
  if (!title) return { error: "Ange en titel." };
  if (!dueDate) return { error: "Ange ett giltigt förfallodatum." };
  if (!Number.isInteger(amountOre) || amountOre < 0) return { error: "Ange ett giltigt belopp." };
  const membership = await prisma.teamMember.findUnique({ where: { id: membershipId }, select: { userId: true, teamId: true } });
  if (!membership) return { error: "Spelaren hittades inte." };
  const payment = await prisma.payment.create({ data: { userId: membership.userId, teamId: membership.teamId, title, amountOre, dueDate, note: note || null } });
  await audit(admin.id, "Skapade betalning", "Payment", payment.id, `${title}: ${amountOre / 100} kr`);
  revalidatePath("/admin");
  revalidatePath("/admin/betalningar");
  revalidatePath("/betalningar");
  return { success: "Betalningen skapades." };
}

export async function updatePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "paymentId");
  const title = text(formData, "title");
  const amountOre = Math.round(Number(text(formData, "amount").replace(",", ".")) * 100);
  const dueDate = calendarDate(text(formData, "dueDate"));
  const note = text(formData, "note");
  if (!title) return { error: "Ange en titel." };
  if (!dueDate) return { error: "Ange ett giltigt förfallodatum." };
  if (!Number.isInteger(amountOre) || amountOre < 0) return { error: "Ange ett giltigt belopp." };
  const payment = await prisma.payment.update({ where: { id }, data: { title, amountOre, dueDate, note: note || null } }).catch(() => null);
  if (!payment) return { error: "Betalningen hittades inte." };
  await audit(admin.id, "Ändrade betalning", "Payment", payment.id, `${title}: ${amountOre / 100} kr`);
  revalidatePath("/admin");
  revalidatePath("/admin/betalningar");
  revalidatePath("/betalningar");
  return { success: "Betalningen sparades." };
}

export async function deletePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "paymentId");
  const payment = await prisma.payment.delete({ where: { id } }).catch(() => null);
  if (!payment) return { error: "Betalningen hittades inte." };
  await audit(admin.id, "Tog bort betalning", "Payment", payment.id, payment.title);
  revalidatePath("/admin");
  revalidatePath("/admin/betalningar");
  revalidatePath("/betalningar");
  return { success: "Betalningen togs bort." };
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

export async function saveMatchStat(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const matchId = text(formData, "matchId");
  const userId = text(formData, "userId");
  const goals = Number(text(formData, "goals"));
  const assists = Number(text(formData, "assists"));
  const penaltyMinutes = Number(text(formData, "penaltyMinutes"));
  if (![goals, assists, penaltyMinutes].every((value) => Number.isInteger(value) && value >= 0 && value <= 99)) {
    return { error: "Mål, assist och utvisningsminuter måste vara heltal 0–99." };
  }
  const match = await prisma.match.findFirst({ where: { id: matchId, team: { members: { some: { userId } } } }, select: { id: true } });
  if (!match) return { error: "Spelaren tillhör inte matchens lag." };
  const stat = await prisma.matchStat.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: { goals, assists, penaltyMinutes },
    create: { matchId, userId, goals, assists, penaltyMinutes },
  });
  await audit(admin.id, "Uppdaterade matchstatistik", "MatchStat", stat.id);
  revalidatePath("/statistik");
  revalidatePath("/admin/statistik");
  return { success: "Matchstatistiken sparades." };
}

export async function saveTrainingAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const trainingId = text(formData, "trainingId");
  const userId = text(formData, "userId");
  const attendedValue = text(formData, "attended");
  if (!["true", "false"].includes(attendedValue)) return { error: "Ange närvaro." };
  const training = await prisma.training.findFirst({ where: { id: trainingId, team: { members: { some: { userId } } } }, select: { id: true } });
  if (!training) return { error: "Spelaren tillhör inte träningens lag." };
  const registration = await prisma.trainingRegistration.upsert({
    where: { trainingId_userId: { trainingId, userId } },
    update: { attended: attendedValue === "true" },
    create: { trainingId, userId, status: "GOING", attended: attendedValue === "true" },
  });
  await audit(admin.id, "Uppdaterade träningsnärvaro", "TrainingRegistration", registration.id);
  revalidatePath("/statistik");
  revalidatePath("/admin/statistik");
  return { success: "Närvaron sparades." };
}

export async function createHighlight(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const teamId = text(formData, "teamId");
  const title = text(formData, "title");
  const url = text(formData, "url");
  const activity = text(formData, "activity");
  const [activityKind, activityId] = activity.includes(":") ? activity.split(":") : [null, null];
  const trainingId = activityKind === "training" ? activityId : "";
  const matchId = activityKind === "match" ? activityId : "";
  let parsed: URL;
  try { parsed = new URL(url); } catch { return { error: "Ange en giltig länk." }; }
  if (!["http:", "https:"].includes(parsed.protocol)) return { error: "Länken måste vara http eller https." };
  if (!title) return { error: "Ange en titel." };
  if (!(await prisma.team.findUnique({ where: { id: teamId }, select: { id: true } }))) return { error: "Laget hittades inte." };
  if (trainingId && !(await prisma.training.findFirst({ where: { id: trainingId, teamId }, select: { id: true } }))) {
    return { error: "Träningen hör inte till valt lag." };
  }
  if (matchId && !(await prisma.match.findFirst({ where: { id: matchId, teamId }, select: { id: true } }))) {
    return { error: "Matchen hör inte till valt lag." };
  }
  const highlight = await prisma.highlight.create({
    data: {
      teamId,
      authorId: admin.id,
      title,
      url: parsed.toString(),
      trainingId: trainingId || null,
      matchId: matchId || null,
    },
  });
  await audit(admin.id, "Lade till highlight", "Highlight", highlight.id, title);
  revalidatePath("/");
  revalidatePath("/admin/highlights");
  return { success: "Klippet lades till." };
}

export async function saveLineupPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const activity = text(formData, "activity");
  const [kind, id] = activity.includes(":") ? activity.split(":") : [null, null];
  if (kind !== "training" && kind !== "match") return { error: "Ogiltig aktivitet." };

  const activityRecord =
    kind === "training"
      ? await prisma.training.findUnique({ where: { id: id! }, select: { id: true, teamId: true } })
      : await prisma.match.findUnique({ where: { id: id! }, select: { id: true, teamId: true } });
  if (!activityRecord) return { error: "Aktiviteten hittades inte." };

  const roster = await prisma.teamMember.findMany({ where: { teamId: activityRecord.teamId }, select: { userId: true } });
  const rosterIds = new Set(roster.map((r) => r.userId));

  let data: unknown;
  try {
    data = JSON.parse(text(formData, "data"));
  } catch {
    return { error: "Ogiltig laguppställning (kunde inte tolkas)." };
  }
  if (!isValidLineupData(data, rosterIds)) return { error: "Ogiltig laguppställning – en spelare tillhör inte laget." };

  await prisma.lineupPlan.upsert({
    where: kind === "training" ? { trainingId: activityRecord.id } : { matchId: activityRecord.id },
    update: { data: data as unknown as Prisma.InputJsonValue, updatedById: admin.id },
    create: {
      teamId: activityRecord.teamId,
      trainingId: kind === "training" ? activityRecord.id : null,
      matchId: kind === "match" ? activityRecord.id : null,
      data: data as unknown as Prisma.InputJsonValue,
      updatedById: admin.id,
    },
  });
  await audit(admin.id, "Sparade lagindelning", "LineupPlan", activityRecord.id);
  revalidatePath("/anmalan");
  revalidatePath(`/admin/lagindelning/${kind}/${id}`);
  return { success: "Lagindelningen sparades." };
}

const PLAYER_REQUEST_POSITIONS = new Set(["GOALKEEPER", "SKATER"]);

export async function createPlayerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const activity = text(formData, "activity");
  const [activityKind, activityId] = activity.includes(":") ? activity.split(":") : [null, null];
  const requestedPosition = text(formData, "position");
  const note = text(formData, "note");
  if (activityKind !== "training" && activityKind !== "match") return { error: "Välj en träning eller match." };
  if (!PLAYER_REQUEST_POSITIONS.has(requestedPosition)) return { error: "Välj position." };

  const activityRecord =
    activityKind === "training"
      ? await prisma.training.findUnique({ where: { id: activityId! }, select: { id: true, teamId: true } })
      : await prisma.match.findUnique({ where: { id: activityId! }, select: { id: true, teamId: true } });
  if (!activityRecord) return { error: "Aktiviteten hittades inte." };

  const request = await prisma.playerRequest.create({
    data: {
      teamId: activityRecord.teamId,
      trainingId: activityKind === "training" ? activityRecord.id : null,
      matchId: activityKind === "match" ? activityRecord.id : null,
      position: requestedPosition as "GOALKEEPER" | "SKATER",
      note: note || null,
      createdById: admin.id,
    },
  });
  await audit(admin.id, "Efterlyste spelare", "PlayerRequest", request.id);
  revalidatePath("/anmalan");
  revalidatePath("/admin/aktiviteter");
  return { success: "Efterlysningen lades till." };
}

export async function resolvePlayerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "playerRequestId");
  const request = await prisma.playerRequest.update({ where: { id }, data: { resolvedAt: new Date() } }).catch(() => null);
  if (!request) return { error: "Efterlysningen hittades inte." };
  await audit(admin.id, "Markerade spelarefterlysning som löst", "PlayerRequest", request.id);
  revalidatePath("/anmalan");
  revalidatePath("/admin/aktiviteter");
  return { success: "Efterlysningen markerades som löst." };
}

export async function deleteHighlight(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = text(formData, "highlightId");
  const highlight = await prisma.highlight.delete({ where: { id } }).catch(() => null);
  if (!highlight) return { error: "Klippet hittades inte." };
  await audit(admin.id, "Tog bort highlight", "Highlight", highlight.id, highlight.title);
  revalidatePath("/");
  revalidatePath("/admin/highlights");
  return { success: "Klippet togs bort." };
}
