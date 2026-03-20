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
