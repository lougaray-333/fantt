// 9 preset colors for task bars — Fantasy brand palette
export const PRESET_COLORS = [
  { name: 'Gold', hex: '#ba9634' },
  { name: 'Emerald', hex: '#34d399' },
  { name: 'Bronze', hex: '#cd7f32' },
  { name: 'Ruby', hex: '#ef4444' },
  { name: 'Violet', hex: '#a78bfa' },
  { name: 'Teal', hex: '#2dd4bf' },
  { name: 'Amber', hex: '#fbbf24' },
  { name: 'Coral', hex: '#fb7185' },
  { name: 'Sapphire', hex: '#818cf8' },
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
  return [...groups].sort();
}
