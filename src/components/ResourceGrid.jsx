import { memo, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Eraser } from 'lucide-react';
import { RATE_CARD, getDepartments } from '../data/rateCard';
import { formatDate, addDays, diffDays, isWeekend, getDateRange } from '../utils/dates';
import { COL_WIDTHS } from './GanttChart';

const ROLE_COL_WIDTH = 280;
const ROW_H = 28;

// Input that manages local state and only propagates on blur
function LocalInput({ value, onChange, ...props }) {
  const [local, setLocal] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <input
      ref={ref}
      {...props}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      onKeyDown={(e) => { if (e.key === 'Enter') ref.current?.blur(); }}
    />
  );
}

export default memo(function ResourceGrid({
  tasks,
  viewMode,
  hideWeekends = false,
  resourceHours,
  onHoursChange,
  onQuickFill,
  hiddenRoles,
  onHideRole,
  onShowRole,
  roleNames,
  onRoleNameChange,
  oopExpenses,
  onOopChange,
  onAddOop,
  onRemoveOop,
  collapsed,
  onToggle,
  onClearAll,
  resourceScrollRef,
  ganttScrollRef,
  highlightedDate,
  onDateClick,
}) {
  const departments = useMemo(() => getDepartments(), []);
  const hiddenSet = useMemo(() => new Set(hiddenRoles || []), [hiddenRoles]);
  const colWidth = COL_WIDTHS[viewMode];
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const addRoleRef = useRef(null);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => getDateRange(tasks), [tasks]);
  const totalDays = diffDays(rangeStart, rangeEnd);

  const skipWeekends = hideWeekends && viewMode === 'day';
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(rangeStart, i);
      if (skipWeekends && isWeekend(d)) continue;
      arr.push({
        str: formatDate(d),
        day: d.getDate(),
        abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        isWeekend: isWeekend(d),
        isToday: formatDate(d) === formatDate(new Date()),
      });
    }
    return arr;
  }, [rangeStart, totalDays, skipWeekends]);

  // Dates covered by at least one task
  const coveredDates = useMemo(() => {
    const set = new Set();
    for (const task of tasks) {
      let cursor = new Date(task.start + 'T00:00:00');
      const end = new Date(task.end + 'T00:00:00');
      while (cursor <= end) {
        set.add(formatDate(cursor));
        cursor = addDays(cursor, 1);
      }
    }
    return set;
  }, [tasks]);

  // Compute totals
  const totals = useMemo(() => {
    let grandTotal = 0;
    let grandHours = 0;
    const hoursPerDay = {};
    const costPerDay = {};
    for (const entry of RATE_CARD) {
      if (hiddenSet.has(entry.role)) continue;
      const roleData = resourceHours[entry.role] || {};
      for (const [dateStr, hours] of Object.entries(roleData)) {
        if (hours > 0) {
          hoursPerDay[dateStr] = (hoursPerDay[dateStr] || 0) + hours;
          const dayCost = hours * entry.rate;
          costPerDay[dateStr] = (costPerDay[dateStr] || 0) + dayCost;
          grandTotal += dayCost;
          grandHours += hours;
        }
      }
    }
    for (const oop of (oopExpenses || [])) {
      if ((oop.amount || 0) > 0) grandTotal += oop.amount;
    }
    return { hoursPerDay, costPerDay, grandTotal, grandHours };
  }, [resourceHours, oopExpenses, hiddenSet]);

  const formatCurrency = (n) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

  // Cost by department
  const costByDept = useMemo(() => {
    const map = {};
    for (const entry of RATE_CARD) {
      if (hiddenSet.has(entry.role)) continue;
      const roleData = resourceHours[entry.role] || {};
      let deptCost = 0;
      for (const hours of Object.values(roleData)) {
        if (hours > 0) deptCost += hours * entry.rate;
      }
      if (deptCost > 0) map[entry.department] = (map[entry.department] || 0) + deptCost;
    }
    return map;
  }, [resourceHours, hiddenSet]);

  // Cost by phase
  const costByPhase = useMemo(() => {
    const datePhaseMap = {};
    for (const task of tasks) {
      if (!task.group) continue;
      const start = new Date(task.start + 'T00:00:00');
      const end = new Date(task.end + 'T00:00:00');
      let cursor = start;
      while (cursor <= end) {
        const ds = formatDate(cursor);
        if (!datePhaseMap[ds]) datePhaseMap[ds] = task.group;
        cursor = addDays(cursor, 1);
      }
    }
    const map = {};
    for (const entry of RATE_CARD) {
      if (hiddenSet.has(entry.role)) continue;
      const roleData = resourceHours[entry.role] || {};
      for (const [dateStr, hours] of Object.entries(roleData)) {
        if (hours > 0 && datePhaseMap[dateStr]) {
          const phase = datePhaseMap[dateStr];
          map[phase] = (map[phase] || 0) + hours * entry.rate;
        }
      }
    }
    return map;
  }, [resourceHours, oopExpenses, tasks, hiddenSet]);

  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const breakdownRef = useRef(null);

  useEffect(() => {
    if (!breakdownOpen) return;
    const handler = (e) => {
      if (breakdownRef.current && !breakdownRef.current.contains(e.target)) setBreakdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [breakdownOpen]);

  useEffect(() => {
    if (!addRoleOpen) return;
    const handler = (e) => {
      if (addRoleRef.current && !addRoleRef.current.contains(e.target)) setAddRoleOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addRoleOpen]);

  // Forward horizontal wheel/trackpad scroll to the Gantt chart
  const wrapperRef = useRef(null);
  useEffect(() => {
    const el = wrapperRef.current;
    const gantt = ganttScrollRef?.current;
    if (!el || !gantt) return;
    const handler = (e) => {
      // deltaX for trackpad horizontal swipe, or shift+wheel
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (dx) {
        e.preventDefault();
        gantt.scrollLeft += dx;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [ganttScrollRef]);

  // Sync frozen bottom rows horizontally with main grid
  const bottomScrollRef = useRef(null);
  useEffect(() => {
    const grid = resourceScrollRef?.current;
    const bottom = bottomScrollRef.current;
    if (!grid || !bottom) return;
    const handler = () => { bottom.scrollLeft = grid.scrollLeft; };
    grid.addEventListener('scroll', handler, { passive: true });
    return () => grid.removeEventListener('scroll', handler);
  }, [resourceScrollRef]);

  const handleInputChange = useCallback(
    (role, dateStr, value) => {
      onHoursChange(role, dateStr, Number(value) || 0);
    },
    [onHoursChange]
  );

  const getActiveLevel = useCallback((role) => {
    const roleData = resourceHours[role] || {};
    const values = Object.values(roleData).filter((v) => v > 0);
    if (values.length === 0) return 0;
    const first = values[0];
    if ([2, 4, 8].includes(first) && values.every((v) => v === first)) return first;
    return null;
  }, [resourceHours]);

  const gridWidth = dates.length * colWidth;
  const totalWidth = ROLE_COL_WIDTH + gridWidth;

  const isColActive = (d) => d.isToday || highlightedDate === d.str;

  // Sticky cell style for role column
  const stickyLeft = 'sticky left-0 z-10';

  // Render a role cell (used in each row)
  const RoleCell = ({ children, className = '' }) => (
    <div
      className={`${stickyLeft} shrink-0 border-r border-border bg-sidebar ${className}`}
      style={{ width: ROLE_COL_WIDTH, height: ROW_H }}
    >
      {children}
    </div>
  );

  // Render a dept header role cell
  const DeptCell = ({ children }) => (
    <div
      className={`${stickyLeft} shrink-0 border-r border-border bg-bg-alt/60`}
      style={{ width: ROLE_COL_WIDTH, height: ROW_H }}
    >
      {children}
    </div>
  );

  return (
    <div ref={wrapperRef} className="flex flex-col h-full border-t border-border bg-sidebar relative z-10">
      {/* Collapse bar */}
      <div className="flex w-full items-center gap-2 px-4 py-2 shrink-0 relative">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-left hover:opacity-70 transition"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
          <span className="text-xs font-bold text-text">Resource Budget</span>
        </button>
        {onClearAll && totals.grandHours > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
            title="Clear all hours"
          >
            <Eraser size={11} />
            Clear
          </button>
        )}
        <div className="ml-2 relative" ref={breakdownRef}>
          <button
            onClick={() => setBreakdownOpen((o) => !o)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition
              ${breakdownOpen ? 'bg-bg-alt text-text ring-1 ring-border' : 'bg-border text-text hover:bg-bg-alt'}`}
          >
            {formatCurrency(totals.grandTotal)}
          </button>

          {/* Breakdown popover */}
          {breakdownOpen && (
            <div
              className="fixed right-4 w-[420px] rounded-xl border border-border bg-sidebar shadow-2xl z-[100] overflow-hidden"
              style={{
                animation: 'fantt-pop-in 0.2s ease-out',
                bottom: (() => {
                  const el = breakdownRef.current;
                  if (!el) return 60;
                  const rect = el.getBoundingClientRect();
                  return window.innerHeight - rect.top + 8;
                })(),
              }}
            >
              <div className="px-4 py-3 border-b border-border">
                <div className="text-xs font-bold text-text">Cost Breakdown</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Total: <span className="font-semibold text-accent">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
              <div className="flex divide-x divide-border">
                <div className="flex-1 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">By Department</div>
                  {Object.keys(costByDept).length === 0 ? (
                    <div className="text-[11px] text-text-muted/50">No hours allocated</div>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(costByDept).sort((a, b) => b[1] - a[1]).map(([dept, cost]) => (
                        <div key={dept} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-text truncate">{dept}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (cost / totals.grandTotal) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-text w-14 text-right">{formatCurrency(cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">By Phase</div>
                  {Object.keys(costByPhase).length === 0 ? (
                    <div className="text-[11px] text-text-muted/50">No phases assigned</div>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(costByPhase).sort((a, b) => b[1] - a[1]).map(([phase, cost]) => (
                        <div key={phase} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-text truncate">{phase}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (cost / totals.grandTotal) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-text w-14 text-right">{formatCurrency(cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(() => {
                    const phasedTotal = Object.values(costByPhase).reduce((s, c) => s + c, 0);
                    const oopTotal = (oopExpenses || []).reduce((s, o) => s + (o.amount || 0), 0);
                    const unphasedResource = totals.grandTotal - oopTotal - phasedTotal;
                    if (unphasedResource <= 0) return null;
                    return (
                      <div className="flex items-center justify-between gap-2 mt-0.5 opacity-60">
                        <span className="text-[11px] text-text-muted italic truncate">Unphased</span>
                        <span className="text-[10px] font-mono font-semibold text-text-muted w-14 text-right">{formatCurrency(unphasedResource)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {(oopExpenses || []).length > 0 && (() => {
                const oopTotal = (oopExpenses || []).reduce((s, o) => s + (o.amount || 0), 0);
                if (oopTotal <= 0) return null;
                return (
                  <div className="px-4 py-2 border-t border-border bg-bg-alt/30 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-text-muted">OOP Expenses</span>
                    <span className="text-[10px] font-mono font-semibold text-text">{formatCurrency(oopTotal)}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-border flex flex-col flex-1 min-h-0 bg-sidebar">
          {/* Single scroll container — horizontal scroll driven by Gantt chart */}
          <div
            ref={resourceScrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-sidebar"
          >
            <div style={{ width: totalWidth, minWidth: '100%' }}>
              {/* Header row — sticky top */}
              <div className="flex sticky top-0 z-20 border-b border-border bg-sidebar" style={{ height: ROW_H }}>
                <div
                  className="sticky left-0 z-30 shrink-0 flex items-center px-3 border-r border-border bg-sidebar"
                  style={{ width: ROLE_COL_WIDTH, height: ROW_H }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Role</span>
                </div>
                {dates.map((d) => (
                  <div
                    key={d.str}
                    onClick={() => onDateClick?.(highlightedDate === d.str ? null : d.str)}
                    className={`shrink-0 flex flex-col items-center justify-center text-center border-r border-border/30 cursor-pointer
                      hover:bg-accent/15 transition-colors select-none
                      ${isColActive(d) ? 'bg-accent/10' : d.isWeekend ? 'bg-[var(--color-weekend)]' : 'bg-sidebar'}`}
                    style={{ width: colWidth, height: ROW_H }}
                  >
                    <span className={`text-[9px] leading-none ${isColActive(d) ? 'text-accent font-bold' : 'text-text-muted'}`}>{d.day}</span>
                    <span className={`text-[8px] leading-none ${isColActive(d) ? 'text-accent' : 'text-text-muted/60'}`}>{d.abbr}</span>
                  </div>
                ))}
              </div>

              {/* Department + role rows */}
              {departments.map((dept) => {
                const roles = RATE_CARD.filter((e) => e.department === dept && !hiddenSet.has(e.role));
                if (roles.length === 0) return null;
                return (
                  <div key={dept}>
                    {/* Department header */}
                    <div className="flex border-b border-border/50" style={{ height: ROW_H }}>
                      <DeptCell>
                        <div className="flex items-center px-3 h-full">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{dept}</span>
                        </div>
                      </DeptCell>
                      {dates.map((d) => (
                        <div
                          key={d.str}
                          className={`shrink-0 border-r border-border/20 bg-bg-alt/60
                            ${isColActive(d) ? 'bg-accent/5' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                          style={{ width: colWidth, height: ROW_H }}
                        />
                      ))}
                    </div>

                    {/* Role rows */}
                    {roles.map((entry) => {
                      const roleData = resourceHours[entry.role] || {};
                      const activeLevel = getActiveLevel(entry.role);
                      const personName = (roleNames || {})[entry.role] || '';
                      return (
                        <div key={entry.role} className="flex border-b border-border/30" style={{ height: ROW_H }}>
                          <RoleCell className="hover:bg-bg-alt/50 transition-colors group/role">
                            <div className="flex items-center px-2 h-full gap-1">
                              <button
                                onClick={() => onHideRole(entry.role)}
                                className="shrink-0 opacity-0 group-hover/role:opacity-100 rounded p-0 text-text-muted/40 hover:text-red-500 transition"
                                title="Remove role"
                              >
                                <X size={11} />
                              </button>
                              <div className="flex-1 min-w-0 flex items-center gap-1 group-hover/role:hidden">
                                <span className="text-[11px] text-text truncate">{entry.role}</span>
                                {personName && (
                                  <span className="text-[10px] text-accent truncate shrink-0 max-w-[70px]">· {personName}</span>
                                )}
                                <span className="text-[10px] text-text-muted font-mono ml-auto shrink-0">${entry.rate}</span>
                              </div>
                              <div className="flex-1 min-w-0 items-center gap-1 hidden group-hover/role:flex">
                                <span className="text-[10px] text-text truncate shrink-0 max-w-[80px]">{entry.role}</span>
                                <LocalInput
                                  type="text"
                                  value={personName}
                                  onChange={(val) => onRoleNameChange(entry.role, val)}
                                  placeholder="Name…"
                                  className="text-[10px] text-accent bg-transparent border-none outline-none flex-1 min-w-0 truncate placeholder:text-text-muted/30"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {[2, 4, 8].map((h) => (
                                    <button
                                      key={h}
                                      onClick={() => onQuickFill(entry.role, activeLevel === h ? 0 : h)}
                                      className={`rounded px-1 py-0 text-[9px] font-bold leading-tight transition
                                        ${activeLevel === h
                                          ? 'bg-accent text-white'
                                          : 'bg-bg-alt text-text-muted hover:bg-accent/20 hover:text-accent'
                                        }`}
                                      title={h === 2 ? 'Oversight (2h/day)' : h === 4 ? 'Half-time (4h/day)' : 'Full-time (8h/day)'}
                                    >
                                      {h}h
                                    </button>
                                  ))}
                                  {activeLevel > 0 && (
                                    <button
                                      onClick={() => onQuickFill(entry.role, 0)}
                                      className="rounded p-0 text-text-muted hover:text-red-400 transition ml-0.5"
                                      title="Clear hours"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </RoleCell>
                          {dates.map((d) => {
                            const hours = roleData[d.str] || 0;
                            const orphaned = hours > 0 && !coveredDates.has(d.str);
                            return (
                              <div
                                key={d.str}
                                className={`shrink-0 border-r border-border/20 flex items-center justify-center
                                  ${orphaned ? 'bg-red-500/10' : isColActive(d) ? 'bg-accent/5' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                                style={{ width: colWidth, height: ROW_H }}
                                title={orphaned ? 'No activity on this date' : undefined}
                              >
                                <input
                                  type="number"
                                  min="0"
                                  max="24"
                                  value={hours || ''}
                                  onChange={(e) => handleInputChange(entry.role, d.str, e.target.value)}
                                  className={`w-full h-full bg-transparent text-center text-[10px] font-mono
                                    focus:bg-accent/10 focus:outline-none focus:ring-1 focus:ring-accent/30
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                    ${orphaned ? 'text-red-400' : 'text-text'}`}
                                  style={{ width: colWidth }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Add role back button */}
              {hiddenSet.size > 0 && (
                <div className="flex border-b border-border/50" style={{ height: ROW_H }}>
                  <div
                    className={`${stickyLeft} shrink-0 border-r border-border bg-sidebar`}
                    style={{ width: ROLE_COL_WIDTH, height: ROW_H }}
                    ref={addRoleRef}
                  >
                    <div
                      className="flex items-center px-3 h-full hover:bg-bg-alt/50 cursor-pointer transition"
                      onClick={() => setAddRoleOpen((o) => !o)}
                    >
                      <Plus size={11} className="text-accent mr-1" />
                      <span className="text-[10px] font-semibold text-accent">
                        Add Role ({hiddenSet.size} hidden)
                      </span>
                    </div>
                    {addRoleOpen && (
                      <div className="absolute left-0 top-full z-50 w-[340px] max-h-[240px] overflow-auto rounded-lg border border-border bg-sidebar shadow-xl">
                        {RATE_CARD.filter((e) => hiddenSet.has(e.role)).map((entry) => (
                          <button
                            key={entry.role}
                            onClick={() => { onShowRole(entry.role); if (hiddenSet.size <= 1) setAddRoleOpen(false); }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-bg-alt transition border-b border-border/30 last:border-0"
                          >
                            <div>
                              <span className="text-[11px] text-text">{entry.role}</span>
                              <span className="text-[10px] text-text-muted ml-2">{entry.department}</span>
                            </div>
                            <span className="text-[10px] text-text-muted font-mono">${entry.rate}/hr</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {dates.map((d) => (
                    <div key={d.str} className="shrink-0 border-r border-border/20" style={{ width: colWidth, height: ROW_H }} />
                  ))}
                </div>
              )}

              {/* OOP section */}
              <div className="flex border-b border-border/50" style={{ height: ROW_H }}>
                <DeptCell>
                  <div className="flex items-center justify-between px-3 h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">OOP Expenses</span>
                    <button
                      onClick={onAddOop}
                      className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/10 transition"
                    >
                      <Plus size={10} />
                      Add
                    </button>
                  </div>
                </DeptCell>
                {dates.map((d) => (
                  <div
                    key={d.str}
                    className={`shrink-0 border-r border-border/20 bg-bg-alt/60
                      ${isColActive(d) ? 'bg-accent/5' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                    style={{ width: colWidth, height: ROW_H }}
                  />
                ))}
              </div>
              {(oopExpenses || []).map((oop) => (
                <div key={oop.id} className="flex border-b border-border/30" style={{ height: ROW_H }}>
                  <RoleCell className="hover:bg-bg-alt/50 transition-colors group">
                    <div className="flex items-center px-2 h-full gap-1">
                      <button
                        onClick={() => onRemoveOop(oop.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0 text-text-muted/40 hover:text-red-500 transition"
                      >
                        <X size={11} />
                      </button>
                      <LocalInput
                        type="text"
                        value={oop.name}
                        onChange={(val) => onOopChange(oop.id, 'name', val)}
                        placeholder="Description…"
                        className="text-[11px] text-text bg-transparent border-none outline-none flex-1 min-w-0 truncate"
                      />
                      <div className="shrink-0 flex items-center gap-0.5">
                        <span className="text-[10px] text-text-muted">$</span>
                        <LocalInput
                          type="number"
                          min="0"
                          value={oop.amount || ''}
                          onChange={(val) => onOopChange(oop.id, 'amount', val)}
                          placeholder="0"
                          className="w-[60px] text-[10px] font-mono text-text bg-transparent border-none outline-none text-right
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </RoleCell>
                  {dates.map((d) => (
                    <div
                      key={d.str}
                      className={`shrink-0 border-r border-border/20
                        ${isColActive(d) ? 'bg-accent/5' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                      style={{ width: colWidth, height: ROW_H }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Frozen bottom: Total Hours + Total Budget */}
          <div className="flex border-t-2 border-border shrink-0">
            <div
              className="shrink-0 border-r border-border bg-sidebar z-10"
              style={{ width: ROLE_COL_WIDTH }}
            >
              <div className="flex items-center justify-between px-3 border-b border-border/50" style={{ height: ROW_H }}>
                <span className="text-[11px] font-bold text-text">Total Hours</span>
                <span className="text-[11px] font-bold text-text font-mono">{totals.grandHours.toLocaleString()}h</span>
              </div>
              {(() => {
                const oopTotal = (oopExpenses || []).reduce((s, o) => s + (o.amount || 0), 0);
                if (oopTotal <= 0) return null;
                return (
                  <div className="flex items-center justify-between px-3 border-b border-border/50" style={{ height: ROW_H }}>
                    <span className="text-[11px] font-bold text-text">Total OOP</span>
                    <span className="text-[11px] font-bold text-text font-mono">{formatCurrency(oopTotal)}</span>
                  </div>
                );
              })()}
              <div className="flex items-center justify-between px-3" style={{ height: ROW_H }}>
                <span className="text-[11px] font-bold text-text">Total Budget</span>
                <span className="text-[11px] font-bold text-text font-mono">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
            <div ref={bottomScrollRef} className="flex-1 overflow-hidden">
              <div style={{ width: gridWidth, minWidth: '100%' }}>
                <div className="flex border-b border-border/50 bg-sidebar" style={{ height: ROW_H }}>
                  {dates.map((d) => {
                    const dayHours = totals.hoursPerDay[d.str] || 0;
                    return (
                      <div
                        key={d.str}
                        className={`shrink-0 border-r border-border/30 flex items-center justify-center
                          ${isColActive(d) ? 'bg-accent/10' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                        style={{ width: colWidth, height: ROW_H }}
                      >
                        <span className={`text-[10px] font-bold font-mono ${dayHours > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                          {dayHours > 0 ? dayHours : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex bg-sidebar" style={{ height: ROW_H }}>
                  {dates.map((d) => (
                    <div
                      key={d.str}
                      className={`shrink-0 border-r border-border/30
                        ${isColActive(d) ? 'bg-accent/10' : d.isWeekend ? 'bg-[var(--color-weekend)]' : ''}`}
                      style={{ width: colWidth, height: ROW_H }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
