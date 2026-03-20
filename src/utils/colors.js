// 9 preset colors for task bars
export const PRESET_COLORS = [
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Indigo', hex: '#6366f1' },
];

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
  return [...groups];
}
