const weekdayFmt = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  timeZone: "Europe/Stockholm",
});
const dayMonthFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Stockholm",
});
const timeFmt = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm",
});
const monthYearFmt = new Intl.DateTimeFormat("sv-SE", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Stockholm",
});
const mediumDateFmt = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeZone: "Europe/Stockholm",
});
const mediumDateTimeFmt = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});
const fullDateTimeFmt = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatWeekday(date: Date) {
  return capitalize(weekdayFmt.format(date));
}

export function formatDayMonth(date: Date) {
  return dayMonthFmt.format(date);
}

export function formatDateHeader(date: Date) {
  return `${formatWeekday(date)} ${formatDayMonth(date)}`;
}

export function formatTime(date: Date) {
  return timeFmt.format(date);
}

export function formatMonthYear(date: Date) {
  return capitalize(monthYearFmt.format(date));
}

export function formatMediumDate(date: Date) {
  return mediumDateFmt.format(date);
}

export function formatMediumDateTime(date: Date) {
  return mediumDateTimeFmt.format(date);
}

export function formatFullDateTime(date: Date) {
  return fullDateTimeFmt.format(date);
}

export function endTime(date: Date, durationMinutes = 90) {
  return new Date(date.getTime() + durationMinutes * 60 * 1000);
}

/**
 * Rubriken för en match eller cup. En cup har inget enskilt motståndarlag —
 * där bär `opponent` i stället arrangemangets namn.
 */
export function matchTitle(match: { kind: "MATCH" | "CUP"; isHome: boolean; opponent: string }) {
  if (match.kind === "CUP") return `Cup · ${match.opponent}`;
  return `${match.isHome ? "Hemma" : "Borta"} vs ${match.opponent}`;
}

/** Kort etikett för listor där laget redan framgår, t.ex. "Cup: Vårcupen". */
export function matchShortTitle(match: { kind: "MATCH" | "CUP"; opponent: string }) {
  return match.kind === "CUP" ? `Cup: ${match.opponent}` : match.opponent;
}
