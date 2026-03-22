import { formatDate, addDays, diffDays } from './dates';

const CSV_COLUMNS = [
  'Name',
  'Section/Column',
  'Start Date',
  'Due Date',
  'Duration',
  'Assignee',
  'Contributors',
  'Hours Per Day',
  'Description',
  'Scoping Notes',
];

/**
 * Parse CSV text into array of { columnName: value } objects.
 * Handles quoted fields with commas/newlines, escaped quotes (""), BOM.
 */
export function parseCSV(text) {
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows = [];
  let i = 0;

  function parseField() {
    if (i >= text.length || text[i] === '\n') return '';

    if (text[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let value = '';
      while (i < text.length) {
        if (text[i] === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          value += text[i];
          i++;
        }
      }
      return value;
    }

    // Unquoted field
    let value = '';
    while (i < text.length && text[i] !== ',' && text[i] !== '\n') {
      value += text[i];
      i++;
    }
    return value;
  }

  function parseRow() {
    const fields = [];
    while (i < text.length && text[i] !== '\n') {
      fields.push(parseField());
      if (i < text.length && text[i] === ',') {
        i++; // skip comma
      }
    }
    if (i < text.length && text[i] === '\n') i++; // skip newline
    return fields;
  }

  // Parse header
  if (i >= text.length) return [];
  const headers = parseRow().map((h) => h.trim());

  // Parse data rows
  while (i < text.length) {
    // Skip blank lines
    if (text[i] === '\n') { i++; continue; }
    const fields = parseRow();
    if (fields.length === 0 || (fields.length === 1 && fields[0].trim() === '')) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (fields[j] || '').trim();
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Generate CSV string from row objects. Quote values containing commas/newlines/quotes.
 */
export function generateCSV(rows, columns = CSV_COLUMNS) {
  function escapeField(value) {
    const str = value == null ? '' : String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  const lines = [columns.map(escapeField).join(',')];
  for (const row of rows) {
    const line = columns.map((col) => escapeField(row[col])).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Trigger browser download via Blob URL.
 */
export function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Try YYYY-MM-DD, then MM/DD/YYYY, then new Date(str). Return YYYY-MM-DD string or null.
 */
export function parseDateFlexible(str) {
  if (!str) return null;
  str = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T00:00:00');
    return isNaN(d) ? null : str;
  }

  // MM/DD/YYYY
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date)) return formatDate(date);
  }

  // Fallback
  const d = new Date(str);
  if (!isNaN(d)) return formatDate(d);

  return null;
}

/**
 * Map CSV row → Fantt task shape. Handle missing dates.
 */
export function csvRowToTask(row, index, fallbackStartDate) {
  const name = row['Name'] || `Task ${index + 1}`;
  const group = row['Section/Column'] || '';
  const startStr = parseDateFlexible(row['Start Date']);
  const endStr = parseDateFlexible(row['Due Date']);
  const durationStr = row['Duration'];

  let start = startStr;
  let end = endStr;

  // If we have start but no end, use duration or default 5 days
  if (start && !end) {
    const days = durationStr ? parseInt(durationStr, 10) : 5;
    const dur = isNaN(days) || days <= 0 ? 5 : days;
    end = formatDate(addDays(start, dur - 1));
  }

  // If we have end but no start, work backwards
  if (!start && end) {
    const days = durationStr ? parseInt(durationStr, 10) : 5;
    const dur = isNaN(days) || days <= 0 ? 5 : days;
    start = formatDate(addDays(end, -(dur - 1)));
  }

  // If neither, use fallback
  if (!start && !end) {
    start = fallbackStartDate || formatDate(new Date());
    const days = durationStr ? parseInt(durationStr, 10) : 5;
    const dur = isNaN(days) || days <= 0 ? 5 : days;
    end = formatDate(addDays(start, dur - 1));
  }

  // Parse assignees
  const assignees = [];
  const hoursPerDay = row['Hours Per Day'] ? parseFloat(row['Hours Per Day']) : 8;
  const hpd = isNaN(hoursPerDay) || hoursPerDay <= 0 ? 8 : hoursPerDay;

  if (row['Assignee']) {
    assignees.push({ name: row['Assignee'].trim(), hoursPerDay: hpd });
  }
  if (row['Contributors']) {
    const contribs = row['Contributors'].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    for (const c of contribs) {
      assignees.push({ name: c, hoursPerDay: hpd });
    }
  }

  return {
    name,
    start,
    end,
    group,
    progress: 0,
    dependencies: [],
    color: '',
    assignees,
  };
}

/**
 * Map Fantt task → CSV row for export.
 */
export function taskToCSVRow(task) {
  const duration = diffDays(task.start, task.end) + 1;
  const assignee = task.assignees?.[0]?.name || '';
  const contributors = (task.assignees || []).slice(1).map((a) => a.name).join(', ');
  const hpd = task.assignees?.[0]?.hoursPerDay || '';

  return {
    'Name': task.name,
    'Section/Column': task.group || '',
    'Start Date': task.start,
    'Due Date': task.end,
    'Duration': String(duration),
    'Assignee': assignee,
    'Contributors': contributors,
    'Hours Per Day': hpd ? String(hpd) : '',
    'Description': '',
    'Scoping Notes': '',
  };
}

/**
 * Export activity database as sequential CSV with calculated dates starting from startDate.
 */
export function generateTemplateCSV(activities, startDate) {
  let cursor = startDate || getNextMonday();
  const rows = [];

  for (const activity of activities) {
    const days = activity.durationDays[0];
    const start = formatDate(cursor);
    const end = formatDate(addDays(cursor, days - 1));

    rows.push({
      'Name': activity.name,
      'Section/Column': activity.phase,
      'Start Date': start,
      'Due Date': end,
      'Duration': String(days),
      'Assignee': activity.owner || '',
      'Contributors': activity.contributors || '',
      'Hours Per Day': '',
      'Description': activity.description || '',
      'Scoping Notes': activity.scoping || '',
    });

    cursor = addDays(cursor, days);
  }

  return generateCSV(rows);
}

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}
