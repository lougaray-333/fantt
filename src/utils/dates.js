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

// Snap a date forward to Monday if it falls on a weekend
export function snapToMonday(date) {
  const d = toLocal(date);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
  if (day === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
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

// Count weekdays between two dates (start inclusive, end exclusive)
export function businessDaysBetween(start, end) {
  let s = toLocal(start);
  let e = toLocal(end);
  if (s >= e) return 0;
  let count = 0;
  let cursor = new Date(s);
  while (cursor < e) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// Convert a business-day delta to a calendar-day delta from a given start date
// e.g. businessToCalendarDays('2026-03-27' (Fri), 1) => 3 (skip Sat/Sun => Mon)
export function businessToCalendarDays(startDate, businessDelta) {
  const start = toLocal(startDate);
  if (businessDelta === 0) return 0;
  const sign = businessDelta > 0 ? 1 : -1;
  let remaining = Math.abs(businessDelta);
  let calendarDays = 0;
  let cursor = new Date(start);
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + sign);
    calendarDays += sign;
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return calendarDays;
}
