// Always parse date strings as local midnight to avoid UTC offset issues
function toLocal(d) {
  if (typeof d === 'string') return new Date(d + 'T00:00:00');
  if (d instanceof Date) {
    // Normalize to local midnight
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return new Date(d);
}

export function parseDate(str) {
  if (!str) return null;
  const d = toLocal(str);
  return isNaN(d) ? null : d;
}

export function formatDate(date) {
  const d = toLocal(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date, days) {
  const d = toLocal(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffDays(a, b) {
  const msPerDay = 86400000;
  return Math.round((toLocal(b) - toLocal(a)) / msPerDay);
}

export function isWeekend(date) {
  return toLocal(date).getDay() === 0 || toLocal(date).getDay() === 6;
}

// Snap a date forward to next workday (skips weekends and holidays)
export function snapToMonday(date, holidays = []) {
  let d = toLocal(date);
  let safety = 0;
  while (isNonWorkday(d, holidays) && safety < 30) {
    d.setDate(d.getDate() + 1);
    safety++;
  }
  return d;
}

export function isSameDay(a, b) {
  return formatDate(a) === formatDate(b);
}

// Returns a stable, wide date range that won't jump when bars move slightly
export function getDateRange(tasks) {
  const today = toLocal(new Date());
  if (!tasks.length) {
    return { start: startOfMonth(addDays(today, -14)), end: endOfMonth(addDays(today, 60)) };
  }
  let min = toLocal(tasks[0].start);
  let max = toLocal(tasks[0].end);
  for (const t of tasks) {
    const s = toLocal(t.start);
    const e = toLocal(t.end);
    if (s < min) min = s;
    if (e > max) max = e;
  }
  return {
    start: startOfMonth(addDays(min, -14)),
    end: endOfMonth(addDays(max, 30)),
  };
}

function startOfMonth(date) {
  const d = toLocal(date);
  d.setDate(1);
  return d;
}

function endOfMonth(date) {
  const d = toLocal(date);
  d.setMonth(d.getMonth() + 1, 0);
  return d;
}

export function formatShortDate(date) {
  const d = toLocal(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getMonday(date) {
  const d = toLocal(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

// Count workdays between two dates (start inclusive, end exclusive)
export function businessDaysBetween(start, end, holidays = []) {
  let s = toLocal(start);
  let e = toLocal(end);
  if (s >= e) return 0;
  let count = 0;
  let cursor = new Date(s);
  while (cursor < e) {
    if (!isNonWorkday(cursor, holidays)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// Convert a business-day delta to a calendar-day delta from a given start date
// e.g. businessToCalendarDays('2026-03-27' (Fri), 1) => 3 (skip Sat/Sun => Mon)
export function businessToCalendarDays(startDate, businessDelta, holidays = []) {
  const start = toLocal(startDate);
  if (businessDelta === 0) return 0;
  const sign = businessDelta > 0 ? 1 : -1;
  let remaining = Math.abs(businessDelta);
  let calendarDays = 0;
  let cursor = new Date(start);
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + sign);
    calendarDays += sign;
    if (!isNonWorkday(cursor, holidays)) remaining--;
  }
  return calendarDays;
}

export function isNonWorkday(date, holidays = []) {
  if (isWeekend(date)) return true;
  if (!holidays.length) return false;
  return holidays.some(h => h.date === formatDate(toLocal(date)));
}

export function computeAutoProgress(start, end, holidays = []) {
  const today = formatDate(new Date());
  if (today <= start) return 0;
  if (today >= end) return 100;
  const elapsed = businessDaysBetween(start, today, holidays);
  const total = businessDaysBetween(start, end, holidays);
  return total > 0 ? Math.round((elapsed / total) * 100) : 0;
}

export const FANTASY_2026_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-02', name: "New Year's Day (cont.)" },
  { date: '2026-01-19', name: 'MLK Jr. Day' },
  { date: '2026-02-16', name: "Presidents' Day" },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving' },
  { date: '2026-11-27', name: 'Day After Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-28', name: 'Winter Break' },
  { date: '2026-12-29', name: 'Winter Break' },
  { date: '2026-12-30', name: 'Winter Break' },
  { date: '2026-12-31', name: "New Year's Eve" },
];
