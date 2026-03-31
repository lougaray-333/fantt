import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { formatDate, addDays, diffDays, isWeekend, getDateRange, formatShortDate, getMonday, businessDaysBetween, businessToCalendarDays } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';

export const ROW_HEIGHT = 44;
export const BAR_HEIGHT = 28;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
export const COL_WIDTHS = { day: 40, week: 20, month: 6 };

export function getHeaderHeight(viewMode) {
  return viewMode === 'day' ? 84 : 64;
}

export default function GanttChart({
  tasks,
  viewMode = 'week',
  hideWeekends = false,
  onTaskClick,
  onTaskUpdate,
  onBeginDrag,
  onDragMove,
  onEndDrag,
  onReorder,
  onBeginReorder,
  onResizeEnd,
  onMoveEnd,
  selectedId,
  selectedIds,
  animatingTask,
  onAnimationEnd,
  ganttScrollRef,
  onHorizontalScroll,
  highlightedDate,
  onDateClick,
}) {
  const svgRef = useRef(null);
  const internalScrollRef = useRef(null);
  const scrollRef = ganttScrollRef || internalScrollRef;
  const panRef = useRef(null);
  const didDragRef = useRef(false);
  const [tooltip, setTooltip] = useState(null); // { x, y, task }
  const tooltipRafRef = useRef(null);
  const colWidth = COL_WIDTHS[viewMode];
  const groups = getAllGroups(tasks);
  const HEADER_HEIGHT = getHeaderHeight(viewMode);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => getDateRange(tasks), [tasks]);
  const skipWeekends = hideWeekends && viewMode === 'day';
  const totalDays = skipWeekends ? businessDaysBetween(rangeStart, rangeEnd) : diffDays(rangeStart, rangeEnd);
  const chartWidth = Math.max(totalDays * colWidth, 800);
  const bodyHeight = tasks.length * ROW_HEIGHT + 20;
  const chartHeight = HEADER_HEIGHT + bodyHeight;

  const todayStr = useMemo(() => formatDate(new Date()), []);
  const todayX = skipWeekends
    ? businessDaysBetween(rangeStart, todayStr) * colWidth
    : diffDays(rangeStart, todayStr) * colWidth;
  const showToday = todayX >= 0 && todayX <= chartWidth;

  function dayToX(date) {
    return skipWeekends
      ? businessDaysBetween(rangeStart, date) * colWidth
      : diffDays(rangeStart, date) * colWidth;
  }

  // Month spans for day view top row
  const monthSpans = useMemo(() => {
    if (viewMode !== 'day') return [];
    const spans = [];
    let current = new Date(rangeStart);
    while (current < rangeEnd) {
      const x = skipWeekends
        ? businessDaysBetween(rangeStart, current) * colWidth
        : diffDays(rangeStart, current) * colWidth;
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const endDate = nextMonth < rangeEnd ? nextMonth : rangeEnd;
      const daysInSpan = skipWeekends
        ? businessDaysBetween(current, endDate)
        : diffDays(current, endDate);
      if (daysInSpan > 0) {
        spans.push({
          x,
          width: daysInSpan * colWidth,
          label: current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        });
      }
      current = nextMonth;
    }
    return spans;
  }, [viewMode, rangeStart, rangeEnd, colWidth, skipWeekends]);

  // Week spans for day view (W1, W2, etc.)
  const weekSpans = useMemo(() => {
    if (viewMode !== 'day' || tasks.length === 0) return [];
    // Week 1 = Monday of earliest task's start week
    let earliest = tasks[0].start;
    for (const t of tasks) {
      if (t.start < earliest) earliest = t.start;
    }
    const week1Monday = getMonday(earliest);
    const spans = [];
    // Start from either week1Monday or rangeStart, whichever is earlier
    let monday = getMonday(rangeStart);
    while (monday < rangeEnd) {
      const nextMonday = addDays(monday, 7);
      const spanStart = monday < rangeStart ? rangeStart : monday;
      const spanEnd = nextMonday > rangeEnd ? rangeEnd : nextMonday;
      const x = skipWeekends
        ? businessDaysBetween(rangeStart, spanStart) * colWidth
        : diffDays(rangeStart, spanStart) * colWidth;
      const width = skipWeekends
        ? businessDaysBetween(spanStart, spanEnd) * colWidth
        : diffDays(spanStart, spanEnd) * colWidth;
      // Calculate week number relative to week1Monday
      const weekNum = Math.round(diffDays(week1Monday, monday) / 7) + 1;
      if (weekNum >= 1 && width > 0) {
        spans.push({ x, width, label: `W${weekNum}` });
      }
      monday = nextMonday;
    }
    return spans;
  }, [viewMode, tasks, rangeStart, rangeEnd, colWidth, skipWeekends]);

  // Header labels
  const headerLabels = useMemo(() => {
    const labels = [];
    const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (viewMode === 'day') {
      const calendarDays = diffDays(rangeStart, rangeEnd);
      let col = 0;
      for (let i = 0; i < calendarDays; i++) {
        const d = addDays(rangeStart, i);
        if (skipWeekends && isWeekend(d)) continue;
        labels.push({
          x: col * colWidth,
          width: colWidth,
          label: d.getDate().toString(),
          sublabel: DAY_ABBRS[d.getDay()],
          isWeekend: isWeekend(d),
          isToday: formatDate(d) === todayStr,
          dateStr: formatDate(d),
        });
        col++;
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
  }, [rangeStart, rangeEnd, totalDays, colWidth, viewMode, todayStr, skipWeekends]);

  // Memoized clipPath defs
  const clipPathDefs = useMemo(() => {
    return tasks.filter(t => !t.milestone).map((task) => {
      const x = dayToX(task.start);
      const barWidth = Math.max((diffDays(task.start, task.end) + 1) * colWidth, colWidth);
      return (
        <clipPath key={`clip-${task.id}`} id={`clip-${task.id}`}>
          <rect x={x + 6} y={0} width={barWidth - 12} height={bodyHeight + 100} />
        </clipPath>
      );
    });
  }, [tasks, colWidth, skipWeekends]);

  // Horizontal drag (move/resize)
  const handleMouseDown = useCallback(
    (e, task, type) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const origStart = task.start;
      const origEnd = task.end;
      let lastDelta = 0;
      let didMove = false;
      didDragRef.current = false;

      if (type === 'move') onBeginDrag();

      function onMove(ev) {
        const dx = ev.clientX - startX;
        const visualDelta = Math.round(dx / colWidth);
        const daysDelta = skipWeekends
          ? businessToCalendarDays(type === 'resize-start' ? origStart : (type === 'resize-end' ? origEnd : origStart), visualDelta)
          : visualDelta;
        if (daysDelta === lastDelta) return;
        lastDelta = daysDelta;
        didMove = true;
        didDragRef.current = true;

        // Capture scroll position before state update
        const container = scrollRef.current;
        const scrollLeft = container?.scrollLeft;
        const scrollTop = container?.scrollTop;

        if (type === 'move') {
          onDragMove(task.id, daysDelta);
        } else if (type === 'resize-end') {
          const newEnd = addDays(new Date(origEnd + 'T00:00:00'), daysDelta);
          if (newEnd >= new Date(origStart + 'T00:00:00')) {
            onTaskUpdate(task.id, { end: formatDate(newEnd) });
          }
        } else if (type === 'resize-start') {
          const newStart = addDays(new Date(origStart + 'T00:00:00'), daysDelta);
          if (newStart <= new Date(origEnd + 'T00:00:00')) {
            onTaskUpdate(task.id, { start: formatDate(newStart) });
          }
        }

        // Restore scroll position after re-render
        if (container) {
          requestAnimationFrame(() => {
            container.scrollLeft = scrollLeft;
            container.scrollTop = scrollTop;
          });
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        if (type === 'move') {
          onEndDrag();
          if (didMove) onMoveEnd?.(task.id);
        }
        if (type === 'resize-start' || type === 'resize-end') {
          onResizeEnd?.(task.id);
        }
      }

      document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [colWidth, onTaskUpdate, onBeginDrag, onDragMove, onEndDrag, onResizeEnd, onMoveEnd, skipWeekends]
  );

  // Vertical drag (reorder rows)
  const handleRowDragStart = useCallback(
    (e, taskIndex) => {
      e.stopPropagation();
      e.preventDefault();
      if (!onReorder) return;

      onBeginReorder?.();
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
    [tasks.length, onReorder, onBeginReorder]
  );

  // Background click-and-drag to pan/scroll
  const handlePanStart = useCallback((e) => {
    // Only pan on left-click directly on the container or SVG background
    if (e.button !== 0) return;
    const container = scrollRef.current;
    if (!container) return;

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      moved: false,
    };

    function onMove(ev) {
      const pan = panRef.current;
      if (!pan) return;
      const dx = ev.clientX - pan.startX;
      const dy = ev.clientY - pan.startY;
      if (!pan.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      pan.moved = true;
      container.scrollLeft = pan.scrollLeft - dx;
      container.scrollTop = pan.scrollTop - dy;
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      panRef.current = null;
    }

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Fire horizontal scroll callback (rAF-throttled)
  useEffect(() => {
    if (!onHorizontalScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onHorizontalScroll(el.scrollLeft);
        ticking = false;
      });
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [onHorizontalScroll, scrollRef]);

  return (
    <div ref={ganttScrollRef ? undefined : internalScrollRef} className={ganttScrollRef ? "bg-bg shrink-0" : "overflow-auto flex-1 bg-bg"} style={{ cursor: 'grab', minWidth: chartWidth }} onMouseDown={handlePanStart}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <svg width={chartWidth} height={HEADER_HEIGHT} className="select-none" style={{ display: 'block' }}>
          {/* Header background */}
          <rect x={0} y={0} width={chartWidth} height={HEADER_HEIGHT} fill="var(--color-bg-alt)" />
          <line x1={0} y1={HEADER_HEIGHT - 0.5} x2={chartWidth} y2={HEADER_HEIGHT - 0.5} stroke="var(--color-border)" />

          {/* User-clicked column highlight in header */}
          {highlightedDate && viewMode === 'day' && (() => {
            const hx = dayToX(highlightedDate);
            if (hx < 0 || hx > chartWidth) return null;
            return (
              <rect
                x={hx} y={0} width={colWidth} height={HEADER_HEIGHT}
                fill="var(--color-accent)" fillOpacity={0.08}
                stroke="var(--color-accent)" strokeWidth={2} strokeOpacity={0.4} rx={2}
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}

          {/* Day view: Month row */}
          {monthSpans.map((m, i) => (
            <g key={`month-${i}`}>
              <text x={m.x + m.width / 2} y={18} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-text)" style={{ fontFamily: 'var(--font-sans)' }}>
                {m.label}
              </text>
              {i > 0 && <line x1={m.x} y1={4} x2={m.x} y2={26} stroke="var(--color-border)" strokeWidth={0.5} />}
            </g>
          ))}

          {/* Separator after month row */}
          {viewMode === 'day' && <line x1={0} y1={28} x2={chartWidth} y2={28} stroke="var(--color-grid)" strokeWidth={0.5} />}

          {/* Day view: Week number row */}
          {weekSpans.map((w, i) => (
            <g key={`week-${i}`}>
              <text x={w.x + w.width / 2} y={42} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-text-muted)" style={{ fontFamily: 'var(--font-sans)' }}>
                {w.label}
              </text>
            </g>
          ))}

          {/* Separator after week row */}
          {viewMode === 'day' && weekSpans.length > 0 && <line x1={0} y1={48} x2={chartWidth} y2={48} stroke="var(--color-grid)" strokeWidth={0.5} />}

          {/* Header labels */}
          {headerLabels.map((h, i) => (
            <g key={i}>
              {viewMode === 'day' ? (
                <>
                  <text x={h.x + h.width / 2} y={60} textAnchor="middle" fontSize={12} fontWeight={h.isToday ? 700 : 500} fill={h.isToday ? 'var(--color-accent)' : 'var(--color-text)'} style={{ fontFamily: 'var(--font-sans)' }}>
                    {h.label}
                  </text>
                  <text x={h.x + h.width / 2} y={74} textAnchor="middle" fontSize={9} fill={h.isToday ? 'var(--color-accent)' : 'var(--color-text-muted)'} style={{ fontFamily: 'var(--font-sans)' }}>
                    {h.sublabel}
                  </text>
                  {onDateClick && h.dateStr && (
                    <rect x={h.x} y={48} width={h.width} height={HEADER_HEIGHT - 48} fill="transparent" style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); onDateClick(highlightedDate === h.dateStr ? null : h.dateStr); }}
                    />
                  )}
                </>
              ) : (
                <>
                  <text x={h.x + h.width / 2} y={h.sublabel ? 26 : 38} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)" style={{ fontFamily: 'var(--font-sans)' }}>
                    {h.label}
                  </text>
                  {h.sublabel && (
                    <text x={h.x + h.width / 2} y={46} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-text-muted)" style={{ fontFamily: 'var(--font-sans)' }}>
                      {h.sublabel}
                    </text>
                  )}
                </>
              )}
              {/* Vertical grid line in header */}
              <line x1={h.x} y1={0} x2={h.x} y2={HEADER_HEIGHT} stroke="var(--color-grid)" strokeWidth={0.5} />
            </g>
          ))}
        </svg>
      </div>

      {/* Body */}
      <svg
        ref={svgRef}
        width={chartWidth}
        height={Math.max(bodyHeight, 200)}
        className="select-none"
        style={{ display: 'block' }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0.5 L7,3 L0,5.5" fill="none" stroke="var(--color-text-muted)" strokeWidth={1.2} />
          </marker>
          {clipPathDefs}
        </defs>

        {/* Today column highlight */}
        {showToday && (
          <rect
            x={todayX} y={0} width={colWidth} height={bodyHeight}
            fill="var(--color-accent)" fillOpacity={0.04}
            stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4,3" rx={2}
          />
        )}

        {/* User-clicked column highlight in body */}
        {highlightedDate && viewMode === 'day' && (() => {
          const hx = dayToX(highlightedDate);
          if (hx < 0 || hx > chartWidth) return null;
          return (
            <rect
              x={hx} y={0} width={colWidth} height={bodyHeight}
              fill="var(--color-accent)" fillOpacity={0.08}
              stroke="var(--color-accent)" strokeWidth={2} strokeOpacity={0.4} rx={2}
              style={{ pointerEvents: 'none' }}
            />
          );
        })()}

        {/* Weekend shading + vertical grid */}
        {headerLabels.map((h, i) => (
          <g key={`grid-${i}`}>
            {h.isWeekend && (
              <rect x={h.x} y={0} width={h.width} height={bodyHeight} fill="var(--color-weekend)" />
            )}
            <line x1={h.x} y1={0} x2={h.x} y2={bodyHeight} stroke="var(--color-grid)" strokeWidth={0.5} />
          </g>
        ))}

        {/* Row stripes */}
        {tasks.map((task, i) => {
          const isRowSelected = selectedId === task.id || selectedIds?.has(task.id);
          return (
          <g key={`row-${task.id}`}>
            <rect
              x={0} y={i * ROW_HEIGHT} width={chartWidth} height={ROW_HEIGHT}
              fill={isRowSelected ? 'var(--color-accent-light)' : i % 2 === 1 ? 'var(--color-bg-alt)' : 'transparent'}
              opacity={isRowSelected ? 0.4 : 0.3}
            />
            <line x1={0} y1={(i + 1) * ROW_HEIGHT} x2={chartWidth} y2={(i + 1) * ROW_HEIGHT} stroke="var(--color-grid)" strokeWidth={0.5} />
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
              dayToX(dep.end) +
              Math.max((diffDays(dep.end, addDays(new Date(dep.end + 'T00:00:00'), 1))) * colWidth, colWidth);
            const fromX = depBarEnd;
            const fromY = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
            const toX = dayToX(task.start);
            const toY = i * ROW_HEIGHT + ROW_HEIGHT / 2;

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
                stroke="var(--color-text-muted)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}

        {/* Task bars */}
        {tasks.map((task, i) => {
          const x = dayToX(task.start);
          const duration = skipWeekends
            ? businessDaysBetween(task.start, addDays(task.end, 1))
            : diffDays(task.start, task.end) + 1;
          const barWidth = Math.max(duration * colWidth, colWidth);
          const y = i * ROW_HEIGHT + BAR_Y_OFFSET;
          const color = getTaskColor(task, groups);
          const isSelected = selectedId === task.id;
          const progress = task.progress || 0;
          const totalHoursPerDay = (task.assignees || []).reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);

          // Milestone diamond geometry
          const isMilestone = task.milestone;
          const mx = x + colWidth / 2;
          const my = i * ROW_HEIGHT + ROW_HEIGHT / 2;
          const ds = 10; // diamond half-size

          let animStyle = {};
          if (animatingTask?.id === task.id) {
            const animMap = {
              'jiggle': 'fantt-jiggle 0.28s ease-out',
              'settle': 'fantt-settle 0.25s ease-out',
              'slot':   'fantt-slot 0.22s ease-out',
              'appear': 'fantt-appear 0.3s ease-out',
              'bounce-h': 'fantt-bounce-h 0.3s ease-out',
              'bounce-v': 'fantt-bounce-v 0.35s ease-out',
              'pop-in':   'fantt-pop-in 0.4s ease-out',
            };
            const centerX = isMilestone ? mx : x + barWidth / 2;
            const centerY = isMilestone ? my : y + BAR_HEIGHT / 2;
            animStyle = {
              animation: animMap[animatingTask.type] || '',
              transformOrigin: `${centerX}px ${centerY}px`,
            };
          }

          const handleTooltipMove = (e) => {
            if (!tooltipRafRef.current) {
              tooltipRafRef.current = requestAnimationFrame(() => {
                setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                tooltipRafRef.current = null;
              });
            }
          };

          if (isMilestone) {
            return (
              <g
                key={`bar-${task.id}`}
                style={animStyle}
                onAnimationEnd={onAnimationEnd}
                onMouseEnter={(e) => { setTooltip({ x: e.clientX, y: e.clientY, task }); }}
                onMouseMove={handleTooltipMove}
                onMouseLeave={() => setTooltip(null)}
              >
                {isSelected && (
                  <polygon
                    points={`${mx},${my-ds-3} ${mx+ds+3},${my} ${mx},${my+ds+3} ${mx-ds-3},${my}`}
                    fill="none" stroke={color} strokeWidth={2} opacity={0.4}
                  />
                )}

                <polygon
                  points={`${mx},${my-ds} ${mx+ds},${my} ${mx},${my+ds} ${mx-ds},${my}`}
                  fill={color} opacity={0.9}
                />

                <text x={mx + ds + 6} y={my + 1} dominantBaseline="middle" fontSize={11} fontWeight={500} fill="var(--color-text)" style={{ pointerEvents: 'none', fontFamily: 'var(--font-sans)' }}>
                  {task.name}
                </text>

                {/* Reorder handle */}
                <rect x={mx - ds - 14} y={my - ds + 4} width={12} height={2 * ds - 8} fill="transparent" style={{ cursor: 'ns-resize' }} onMouseDown={(e) => handleRowDragStart(e, i)} />
                <circle cx={mx - ds - 8} cy={my - 4} r={1.5} fill="var(--color-text-muted)" opacity={0.5} style={{ pointerEvents: 'none' }} />
                <circle cx={mx - ds - 8} cy={my + 4} r={1.5} fill="var(--color-text-muted)" opacity={0.5} style={{ pointerEvents: 'none' }} />

                {/* Move handle (covers diamond) — no resize handles */}
                <rect x={mx - ds} y={my - ds} width={2 * ds} height={2 * ds} fill="transparent" style={{ cursor: 'grab' }}
                  onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                  onClick={(e) => { if (!didDragRef.current) onTaskClick?.(task.id, e); }}
                />
              </g>
            );
          }

          return (
            <g
              key={`bar-${task.id}`}
              style={animStyle}
              onAnimationEnd={onAnimationEnd}
              onMouseEnter={(e) => { setTooltip({ x: e.clientX, y: e.clientY, task }); }}
              onMouseMove={handleTooltipMove}
              onMouseLeave={() => setTooltip(null)}
            >
              {isSelected && (
                <rect x={x - 2} y={y - 2} width={barWidth + 4} height={BAR_HEIGHT + 4} rx={7} fill="none" stroke={color} strokeWidth={2} opacity={0.4} />
              )}

              <rect x={x} y={y} width={barWidth} height={BAR_HEIGHT} rx={5} fill={color} opacity={0.85} />

              {progress > 0 && (
                <rect x={x} y={y} width={barWidth * (progress / 100)} height={BAR_HEIGHT} rx={5} fill={color} opacity={1} style={{ pointerEvents: 'none' }} />
              )}

              <text x={x + 8} y={y + BAR_HEIGHT / 2 + 1} dominantBaseline="middle" fontSize={11} fontWeight={500} fill="white" clipPath={`url(#clip-${task.id})`} style={{ pointerEvents: 'none', fontFamily: 'var(--font-sans)' }}>
                {task.name}
              </text>

              {viewMode === 'day' && totalHoursPerDay > 0 && barWidth > 60 && (
                <text x={x + barWidth - 8} y={y + BAR_HEIGHT / 2 + 1} dominantBaseline="middle" textAnchor="end" fontSize={9} fontWeight={600} fill="white" opacity={0.8} style={{ pointerEvents: 'none', fontFamily: 'var(--font-sans)' }}>
                  {totalHoursPerDay}h/d
                </text>
              )}

              <rect x={x - 14} y={y + 4} width={12} height={BAR_HEIGHT - 8} fill="transparent" style={{ cursor: 'ns-resize' }} onMouseDown={(e) => handleRowDragStart(e, i)} />
              <circle cx={x - 8} cy={y + BAR_HEIGHT / 2 - 4} r={1.5} fill="var(--color-text-muted)" opacity={0.5} style={{ pointerEvents: 'none' }} />
              <circle cx={x - 8} cy={y + BAR_HEIGHT / 2 + 4} r={1.5} fill="var(--color-text-muted)" opacity={0.5} style={{ pointerEvents: 'none' }} />

              <rect x={x + 8} y={y} width={Math.max(barWidth - 16, 4)} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                onClick={(e) => { if (!didDragRef.current) onTaskClick?.(task.id, e); }}
              />

              <rect x={x} y={y} width={8} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={(e) => handleMouseDown(e, task, 'resize-start')} />
              <rect x={x + barWidth - 8} y={y} width={8} height={BAR_HEIGHT} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={(e) => handleMouseDown(e, task, 'resize-end')} />
            </g>
          );
        })}
      </svg>

      {/* Custom tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-[100] rounded-lg border border-border bg-sidebar px-3 py-2 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y - 12, transform: 'translate(-50%, -100%)' }}
        >
          <div className="text-xs font-semibold text-text leading-tight">{tooltip.task.name}</div>
          <div className="text-[10px] text-text-muted leading-tight mt-0.5">
            {formatShortDate(tooltip.task.start)} – {formatShortDate(tooltip.task.end)}
          </div>
          {tooltip.task.group && (
            <div className="text-[10px] text-text-muted/70 leading-tight">Phase: {tooltip.task.group}</div>
          )}
        </div>
      )}
    </div>
  );
}
