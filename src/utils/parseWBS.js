/**
 * Parse a workback schedule (WBS) from bulleted text into task objects.
 *
 * Accepted line format:
 *   • M/D-M/D: Task Name    → date range (normal task)
 *   • M/D: Task Name        → single date (milestone)
 *
 * Bullet prefix can be •, -, or *.
 * Dates are M/D without year — current year is inferred.
 * If the resolved date is >6 months in the past, it rolls to next year.
 */

const LINE_RE = /^[•\-*]\s*(\d{1,2}\/\d{1,2})(?:\s*[-–]\s*(\d{1,2}\/\d{1,2}))?\s*:\s*(.+)$/;

function resolveDate(monthDay) {
  const [month, day] = monthDay.split('/').map(Number);
  const now = new Date();
  const year = now.getFullYear();
  const date = new Date(year, month - 1, day);

  // If >6 months in the past, bump to next year
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (date < sixMonthsAgo) {
    date.setFullYear(year + 1);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseWBS(text) {
  if (!text) return [];

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = LINE_RE.exec(line);
      if (!m) return null;

      const start = resolveDate(m[1]);
      const end = m[2] ? resolveDate(m[2]) : start;
      const name = m[3].trim();
      const milestone = !m[2]; // single-date = milestone

      return {
        name,
        start,
        end,
        milestone,
        group: '',
        progress: 0,
        dependencies: [],
        color: '',
        assignees: [],
      };
    })
    .filter(Boolean);
}
