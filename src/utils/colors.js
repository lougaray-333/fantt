// 6 preset colors — Fantasy brand palette
export const PRESET_COLORS = [
  { name: 'Red',    hex: '#E52222' },
  { name: 'Blue',   hex: '#1d4ed8' },
  { name: 'Green',  hex: '#15803d' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Amber',  hex: '#d97706' },
  { name: 'Teal',   hex: '#0f766e' },
];

export const PRESET_HEXES = new Set(PRESET_COLORS.map((c) => c.hex));

// Fallback: assign color by group if task has no custom color
const GROUP_COLORS = PRESET_COLORS.map((c) => c.hex);

export function getGroupColor(group, allGroups) {
  if (!group) return GROUP_COLORS[0];
  const idx = allGroups.indexOf(group);
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

// Get the effective color for a task — custom color takes priority, then group-based
export function getTaskColor(task, allGroups) {
  if (task.color) return task.color;
  return getGroupColor(task.group, allGroups);
}

export function getAllGroups(tasks) {
  const groups = new Set();
  tasks.forEach((t) => {
    if (t.group) groups.add(t.group);
  });
  return [...groups].sort();
}

// WCAG relative luminance → returns '#ffffff' or '#000000' for best contrast
export function getContrastColor(hex) {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#ffffff';
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast ratio vs white: (1.05) / (L + 0.05)
  // Contrast ratio vs black: (L + 0.05) / (0.05)
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? '#ffffff' : '#000000';
}
