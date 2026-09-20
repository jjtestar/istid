/**
 * Datum- och upprepningshjälpare för aktiviteter (träningar, matcher, cuper).
 *
 * Allt räknas i svensk tid: formulären skickar "YYYY-MM-DDTHH:mm" som en
 * administratör skrivit in lokalt, och databasen lagrar UTC.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Högsta antal tillfällen en enskild serie får skapa. */
export const MAX_SERIES_OCCURRENCES = 200;

/** Veckodagar i ISO-ordning (måndag = 1 … söndag = 7). */
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Måndag", short: "Mån" },
  { value: 2, label: "Tisdag", short: "Tis" },
  { value: 3, label: "Onsdag", short: "Ons" },
  { value: 4, label: "Torsdag", short: "Tor" },
  { value: 5, label: "Fredag", short: "Fre" },
  { value: 6, label: "Lördag", short: "Lör" },
  { value: 7, label: "Söndag", short: "Sön" },
] as const;

/**
 * Lagets grundschema: träning tisdag och torsdag, match på söndag. Används som
 * förval i adminformulären så att en normal säsong kan läggas upp direkt.
 */
export const DEFAULT_TRAINING_WEEKDAYS = [2, 4];
export const DEFAULT_TRAINING_TIME = "19:00";
export const DEFAULT_MATCH_WEEKDAYS = [7];
export const DEFAULT_MATCH_TIME = "18:00";

/** Tolkar "YYYY-MM-DDTHH:mm" som svensk lokaltid och ger motsvarande UTC-tid. */
export function stockholmDateTime(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value);
  if (!match) return null;
  const guess = new Date(`${match[1]}T${match[2]}:00Z`);
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Stockholm", timeZoneName: "longOffset" })
    .formatToParts(guess).find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const offset = /GMT([+-])(\d{2}):(\d{2})/.exec(zone);
  const minutes = offset ? (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1) : 0;
  return new Date(guess.getTime() - minutes * 60_000);
}

/** Formaterar ett datum som `datetime-local`-värde i svensk tid. */
export function stockholmDateTimeInput(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Formaterar ett datum som `date`-värde (YYYY-MM-DD) i svensk tid. */
export function stockholmDateInput(date: Date) {
  return stockholmDateTimeInput(date).slice(0, 10);
}

function isoWeekday(utcNoon: Date) {
  const day = utcNoon.getUTCDay();
  return day === 0 ? 7 : day;
}

function mondayOf(utcNoon: Date) {
  const monday = new Date(utcNoon.getTime());
  monday.setUTCDate(monday.getUTCDate() - (isoWeekday(utcNoon) - 1));
  return monday;
}

export type WeeklySeriesInput = {
  /** Första datum serien får landa på, "YYYY-MM-DD". */
  from: string;
  /** Sista datum serien får landa på, "YYYY-MM-DD". */
  to: string;
  /** Veckodagar i ISO-form (1–7). */
  weekdays: number[];
  /** Starttid, "HH:mm". */
  time: string;
  /** 1 = varje vecka, 2 = varannan vecka, räknat från startdatumets vecka. */
  intervalWeeks: number;
};

export type WeeklySeriesResult =
  | { ok: true; occurrences: Date[] }
  | { ok: false; error: string };

/**
 * Räknar ut alla tillfällen i en veckoserie. Datumen stegas fram på UTC-middag
 * för att sommartidsskiften aldrig ska kunna hoppa över eller dubblera en dag;
 * själva klockslaget sätts först på slutet, i svensk tid.
 */
export function weeklyOccurrences({ from, to, weekdays, time, intervalWeeks }: WeeklySeriesInput): WeeklySeriesResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { ok: false, error: "Ange ett giltigt start- och slutdatum." };
  }
  if (!/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Ange en giltig starttid." };
  const selectedDays = [...new Set(weekdays)].filter((day) => day >= 1 && day <= 7);
  if (selectedDays.length === 0) return { ok: false, error: "Välj minst en veckodag." };
  if (![1, 2].includes(intervalWeeks)) return { ok: false, error: "Välj hur ofta serien upprepas." };

  const first = new Date(`${from}T12:00:00Z`);
  const last = new Date(`${to}T12:00:00Z`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
    return { ok: false, error: "Ange ett giltigt start- och slutdatum." };
  }
  if (last.getTime() < first.getTime()) return { ok: false, error: "Slutdatumet måste komma efter startdatumet." };

  const firstMonday = mondayOf(first);
  const occurrences: Date[] = [];
  for (let cursor = new Date(first.getTime()); cursor.getTime() <= last.getTime(); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (!selectedDays.includes(isoWeekday(cursor))) continue;
    const weekIndex = Math.round((mondayOf(cursor).getTime() - firstMonday.getTime()) / (7 * DAY_MS));
    if (weekIndex % intervalWeeks !== 0) continue;
    const startsAt = stockholmDateTime(`${stockholmDateInput(cursor)}T${time}`);
    if (!startsAt) return { ok: false, error: "Ange en giltig starttid." };
    occurrences.push(startsAt);
    if (occurrences.length > MAX_SERIES_OCCURRENCES) {
      return { ok: false, error: `En serie kan som mest skapa ${MAX_SERIES_OCCURRENCES} tillfällen. Korta ned perioden.` };
    }
  }

  if (occurrences.length === 0) return { ok: false, error: "Perioden innehåller inga av de valda veckodagarna." };
  return { ok: true, occurrences };
}
