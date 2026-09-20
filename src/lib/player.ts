/**
 * Delade spelarkonstanter och fältvalidering. Håll modulen fri från Prisma och
 * andra serverberoenden – den importeras även av klientkomponenter (tröjnummer-
 * väljaren och välkomstformuläret).
 */

export const PLAYER_POSITIONS = ["Forward", "Back", "Målvakt"] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const JERSEY_MIN = 0;
export const JERSEY_MAX = 99;
export const JERSEY_NUMBERS = Array.from(
  { length: JERSEY_MAX - JERSEY_MIN + 1 },
  (_, index) => JERSEY_MIN + index,
);

export const HEIGHT_MIN = 80;
export const HEIGHT_MAX = 230;
export const WEIGHT_MIN = 20;
export const WEIGHT_MAX = 250;

export const TRAINING_DAYS = ["TUESDAY", "THURSDAY", "SATURDAY"] as const;
export type TrainingDayValue = (typeof TRAINING_DAYS)[number];

export const TRAINING_DAY_LABELS: Record<TrainingDayValue, string> = {
  TUESDAY: "Tisdag",
  THURSDAY: "Torsdag",
  SATURDAY: "Lördag",
};

export const STICK_SIDE_LABELS = { LEFT: "Vänster", RIGHT: "Höger" } as const;

/**
 * `undefined` betyder ogiltigt värde, `null` betyder tomt fält. Samma
 * trestegssvar används av alla parsers här så att anroparen kan skilja
 * "spelaren lämnade fältet tomt" från "spelaren skrev något orimligt".
 */
export type ParsedField<Value> = Value | null | undefined;

export function parseJerseyNo(value: string): ParsedField<number> {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < JERSEY_MIN || parsed > JERSEY_MAX) return undefined;
  return parsed;
}

export function parseHeightCm(value: string): ParsedField<number> {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < HEIGHT_MIN || parsed > HEIGHT_MAX) return undefined;
  return parsed;
}

export function parseWeightKg(value: string): ParsedField<number> {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < WEIGHT_MIN || parsed > WEIGHT_MAX) return undefined;
  return Math.round(parsed * 10) / 10;
}

export function parseStickSide(value: string): ParsedField<"LEFT" | "RIGHT"> {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed !== "LEFT" && trimmed !== "RIGHT") return undefined;
  return trimmed;
}

export function parsePosition(value: string): ParsedField<PlayerPosition> {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return (PLAYER_POSITIONS as readonly string[]).includes(trimmed)
    ? (trimmed as PlayerPosition)
    : undefined;
}

/** Behåller spelarens egen formatering och trimmar bara överflödiga blanksteg. */
export function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPhone(value: string) {
  const compact = value.replace(/[\s-]/g, "");
  return /^\+?\d{6,15}$/.test(compact);
}
