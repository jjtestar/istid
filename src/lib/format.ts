const weekdayFmt = new Intl.DateTimeFormat("sv-SE", { weekday: "short" });
const dayMonthFmt = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" });
const monthYearFmt = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" });

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

export function endTime(date: Date, durationMinutes = 90) {
  return new Date(date.getTime() + durationMinutes * 60 * 1000);
}
