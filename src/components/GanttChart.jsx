import { useMemo, useRef, useCallback } from 'react';
import { formatDate, addDays, diffDays, isWeekend, getDateRange, formatShortDate } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';

const ROW_HEIGHT = 44;
const BAR_HEIGHT = 28;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const HEADER_HEIGHT = 64;
const COL_WIDTHS = { day: 40, week: 20, month: 6 };

export default function GanttChart({
  tasks,
  viewMode = 'week',
  onTaskClick,
  onTaskUpdate,
  onBeginDrag,
  onDragMove,
  onEndDrag,
  onReorder,
  selectedId,
  selectedIds,
}) {
  const svgRef = useRef(null);
  const colWidth = COL_WIDTHS[viewMode];
  const groups = getAllGroups(tasks);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => getDateRange(tasks), [tasks]);
  const totalDays = diffDays(rangeStart, rangeEnd);
  const chartWidth = Math.max(totalDays * colWidth, 800);
  const chartHeight = HEADER_HEIGHT + tasks.length * ROW_HEIGHT + 20;

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const todayX = diffDays(rangeStart, todayStr) * colWidth;
  const showToday = todayX >= 0 && todayX <= chartWidth;

  function dayToX(date) {
    return diffDays(rangeStart, date) * colWidth;
  }

  // Month spans for day view top row
  const monthSpans = useMemo(() => {
    if (viewMode !== 'day') return [];
    const spans = [];
    let current = new Date(rangeStart);
    while (current < rangeEnd) {
      const x = diffDays(rangeStart, current) * colWidth;
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const endDate = nextMonth < rangeEnd ? nextMonth : rangeEnd;
      const daysInSpan = diffDays(current, endDate);
      spans.push({
        x,
        width: daysInSpan * colWidth,
        label: current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
      current = nextMonth;
    }
    return spans;
  }, [viewMode, rangeStart, rangeEnd, colWidth]);

  // Header labels
  const headerLabels = useMemo(() => {
    const labels = [];
    const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (viewMode === 'day') {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(rangeStart, i);
        labels.push({
          x: i * colWidth,
          width: colWidth,
          label: d.getDate().toString(),
          sublabel: DAY_ABBRS[d.getDay()],
          isWeekend: isWeekend(d),
          isToday: formatDate(d) === todayStr,
        });
      }
    } else if (viewMode === 'week') {
      for (let i = 0; i < totalDays; i += 7) {
        const d = addDays(rangeStart, i);
        labels.push({
          x: i * colWidth,
          width: 7 * colWidth,
          label: formatShortDate(d),
          sublabel: '',
        });
      }
    } else {
      let current = new Date(rangeStart);
      while (current < rangeEnd) {
        const x = diffDays(rangeStart, current) * colWidth;
        const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const daysInView = Math.min(diffDays(current, nextMonth), diffDays(current, rangeEnd));
        labels.push({
          x,
          width: daysInView * colWidth,
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sublabel: '',
        });
        current = nextMonth;
      }
    }
    return labels;
  }, [rangeStart, rangeEnd, totalDays, colWidth, viewMode, todayStr]);

  // Horizontal drag (move/resize)
  const handleMouseDown = useCallback(
    (e, task, type) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const origStart = task.start;
      const origEnd = task.end;
      let lastDelta = 0;

      if (type === 'move') onBeginDrag();

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const daysDelta = Math.round(dx / colWidth);
        if (daysDelta === lastDelta) return;
        lastDelta = daysDelta;

        if (type === 'move') {
          onDragMove(task.id, daysDelta);
        } else if (type === 'resize-end') {
          const newEnd = addDays(new Date(origEnd), daysDelta);
          if (newEnd >= new Date(origStart)) {
            onTaskUpdate(task.id, { end: formatDate(newEnd) });
          }
        } else if (type === 'resize-start') {
          const newStart = addDays(new Date(origStart), daysDelta);
          if (newStart <= new Date(origEnd)) {
            onTaskUpdate(task.id, { start: formatDate(newStart) });
          }
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (type === 'move') onEndDrag();
      }

      document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [colWidth, onTaskUpdate, onBeginDrag, onDragMove, onEndDrag]
  );

  // Vertical drag (reorder rows)
  const handleRowDragStart = useCallback(
    (e, taskIndex) => {
      e.stopPropagation();
      e.preventDefault();
      if (!onReorder) return;

      const startY = e.clientY;
      let currentIndex = taskIndex;

      function onMove(ev) {
        const dy = ev.clientY - startY;
        const rowDelta = Math.round(dy / ROW_HEIGHT);
        const newIndex = Math.max(0, Math.min(tasks.length - 1, taskIndex + rowDelta));
        if (newIndex !== currentIndex) {
          onReorder(currentIndex, newIndex);
          currentIndex = newIndex;
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [tasks.length, onReorder]
  );

  return (
    <div className="overflow-auto flex-1 bg-bg">
      <svg
        ref={svgRef}
        width={chartWidth}
        height={Math.max(chartHeight, 300)}
        className="select-none"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke="#94a3b8" strokeWidth={1.2} />
          </marker>
          {tasks.map((task) => {
            const x = dayToX(new Date(task.start));
            const barWidth = Math.max((diffDays(task.start, task.end) + 1) * colWidth, colWidth);
            return (
              <clipPath key={`clip-${task.id}`} id={`clip-${task.id}`}>
                <rect x={x + 6} y={0} width={barWidth - 12} height={999} />
              </clipPath>
            );
          })}
        </defs>

        {/* Header background */}
        <rect x={0} y={0} width={chartWidth} height={HEADER_HEIGHT} fill="var(--color-bg-alt)" />
        <line x1={0} y1={HEADER_HEIGHT} x2={chartWidth} y2={HEADER_HEIGHT} stroke="var(--color-border)" />

        {/* Today column highlight — dotted outline behind everything */}
        {showToday && (
          <rect
            x={todayX}
            y={HEADER_HEIGHT}
            width={colWidth}
            height={chartHeight - HEADER_HEIGHT}
            fill="var(--color-accent)"
            fillOpacity={0.04}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
            rx={2}
          />
        )}

        {/* Month spans for day view */}
        {monthSpans.map((m, i) => (
          <g key={`month-${i}`}>
            <text
              x={m.x + m.width / 2}
              y={20}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill="var(--color-text)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {m.label}
            </text>
            {i > 0 && (
              <line x1={m.x} y1={4} x2={m.x} y2={28} stroke="var(--color-border)" strokeWidth={0.5} />
            )}
          </g>
        ))}

        {/* Separator between month row and day row in day view */}
        {viewMode === 'day' && (
          <line x1={0} y1={30} x2={chartWidth} y2={30} stroke="var(--color-grid)" strokeWidth={0.5} />
        )}

        {/* Header labels + vertical grid */}
        {headerLabels.map((h, i) => (
          <g key={i}>
            {h.isWeekend && (
              <rect
                x={h.x}
                y={HEADER_HEIGHT}
                width={h.width}
                height={chartHeight}
                fill="var(--color-weekend)"
              />
            )}
            {viewMode === 'day' ? (
              <>
                <text
                  x={h.x + h.width / 2}
                  y={44}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={h.isToday ? 700 : 500}
                  fill={h.isToday ? 'var(--color-accent)' : 'var(--color-text)'}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {h.label}
                </text>
                <text
                  x={h.x + h.width / 2}
                  y={57}
                  textAnchor="middle"
                  fontSize={9}
                  fill={h.isToday ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {h.sublabel}
                </text>
              </>
            ) : (
              <>
                <text
                  x={h.x + h.width / 2}
                  y={h.sublabel ? 26 : 38}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-text-muted)"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {h.label}
                </text>
                {h.sublabel && (
                  <text
                    x={h.x + h.width / 2}
                    y={46}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--color-text-muted)"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {h.sublabel}
                  </text>
                )}
              </>
            )}
            <line
              x1={h.x}
              y1={HEADER_HEIGHT}
              x2={h.x}
              y2={chartHeight}
              stroke="var(--color-grid)"
              strokeWidth={0.5}
            />
          </g>
        ))}

        {/* Row stripes */}
        {tasks.map((task, i) => {
          const isRowSelected = selectedId === task.id || selectedIds?.has(task.id);
          return (
          <g key={`row-${task.id}`}>
            <rect
              x={0}
              y={HEADER_HEIGHT + i * ROW_HEIGHT}
              width={chartWidth}
              height={ROW_HEIGHT}
              fill={
                isRowSelected
                  ? 'var(--color-accent-light)'
                  : i % 2 === 1
                    ? 'var(--color-bg-alt)'
                    : 'transparent'
              }
              opacity={isRowSelected ? 0.4 : 0.3}
            />
            <line
              x1={0}
              y1={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
              x2={chartWidth}
              y2={HEADER_HEIGHT + (i + 1) * ROW_HEIGHT}
              stroke="var(--color-grid)"
              strokeWidth={0.5}
            />
          </g>
          );
        })}

        {/* Dependency arrows */}
        {tasks.map((task, i) =>
          (task.dependencies || []).map((depId) => {
            const depIdx = tasks.findIndex((t) => t.id === depId);
            if (depIdx === -1) return null;
            const dep = tasks[depIdx];
            const depBarEnd =
              dayToX(new Date(dep.end)) +
              Math.max((diffDays(dep.end, addDays(new Date(dep.end), 1))) * colWidth, colWidth);
            const fromX = depBarEnd;
            const fromY = HEADER_HEIGHT + depIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
            const toX = dayToX(new Date(task.start));
            const toY = HEADER_HEIGHT + i * ROW_HEIGHT + ROW_HEIGHT / 2;

            const gap = 10;
            const cornerX = fromX + gap;

            return (
              <path
                key={`dep-${dep.id}-${task.id}`}
                d={
                  toX > fromX + gap * 2
                    ? `M${fromX},${fromY} L${cornerX},${fromY} L${cornerX},${toY} L${toX - 2},${toY}`
                    : `M${fromX},${fromY} L${cornerX},${fromY} L${cornerX},${
                        fromY + (toY > fromY ? ROW_HEIGHT / 2 + 4 : -(ROW_HEIGHT / 2 + 4))
                      } L${toX - gap},${
                        fromY + (toY > fromY ? ROW_HEIGHT / 2 + 4 : -(ROW_HEIGHT / 2 + 4))
                      } L${toX - gap},${toY} L${toX - 2},${toY}`
                }
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeLinejoin="round"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}

        {/* Task bars */}
        {tasks.map((task, i) => {
          const x = dayToX(new Date(task.start));
          const duration = diffDays(task.start, task.end) + 1;
          const barWidth = Math.max(duration * colWidth, colWidth);
          const y = HEADER_HEIGHT + i * ROW_HEIGHT + BAR_Y_OFFSET;
          const color = getTaskColor(task, groups);
          const isSelected = selectedId === task.id;
          const progress = task.progress || 0;
          const tooltipText = `${task.name}\n${formatShortDate(task.start)} – ${formatShortDate(task.end)}${task.group ? `\nPhase: ${task.group}` : ''}`;

          return (
            <g key={`bar-${task.id}`}>
              <title>{tooltipText}</title>
              {isSelected && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={BAR_HEIGHT + 4}
                  rx={7}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.4}
                />
              )}

              {/* Bar body */}
              <rect x={x} y={y} width={barWidth} height={BAR_HEIGHT} rx={5} fill={color} opacity={0.85} />

              {/* Progress overlay */}
              {progress > 0 && (
                <rect
                  x={x} y={y}
                  width={barWidth * (progress / 100)}
                  height={BAR_HEIGHT}
                  rx={5}
                  fill={color}
                  opacity={1}
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Task label */}
              <text
                x={x + 8}
                y={y + BAR_HEIGHT / 2 + 1}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={500}
                fill="white"
                clipPath={`url(#clip-${task.id})`}
                style={{ pointerEvents: 'none', fontFamily: 'var(--font-sans)' }}
              >
                {task.name}
              </text>

              {/* Drag handle for vertical reorder (left edge dot area) */}
              <rect
                x={x - 14}
                y={y + 4}
                width={12}
                height={BAR_HEIGHT - 8}
                fill="transparent"
                style={{ cursor: 'ns-resize' }}
                onMouseDown={(e) => handleRowDragStart(e, i)}
              />
              {/* Grip dots */}
              <circle cx={x - 8} cy={y + BAR_HEIGHT / 2 - 4} r={1.5} fill="#94a3b8" opacity={0.5} style={{ pointerEvents: 'none' }} />
              <circle cx={x - 8} cy={y + BAR_HEIGHT / 2 + 4} r={1.5} fill="#94a3b8" opacity={0.5} style={{ pointerEvents: 'none' }} />

              {/* Move surface */}
              <rect
                x={x + 8}
                y={y}
                width={Math.max(barWidth - 16, 4)}
                height={BAR_HEIGHT}
                fill="transparent"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                onClick={(e) => onTaskClick?.(task.id, e)}
              />

              {/* Left resize handle */}
              <rect x={x} y={y} width={8} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={(e) => handleMouseDown(e, task, 'resize-start')} />

              {/* Right resize handle */}
              <rect x={x + barWidth - 8} y={y} width={8} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={(e) => handleMouseDown(e, task, 'resize-end')} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
