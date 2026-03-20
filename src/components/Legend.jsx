import { getGroupColor, getAllGroups } from '../utils/colors';

export default function Legend({ tasks }) {
  const groups = getAllGroups(tasks);
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 px-1">
      {groups.map((g) => (
        <div key={g} className="flex items-center gap-1.5 text-xs text-text-muted">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: getGroupColor(g, groups) }}
          />
          {g}
        </div>
      ))}
    </div>
  );
}
