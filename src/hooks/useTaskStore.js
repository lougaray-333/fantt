import { useState, useCallback, useEffect, useRef } from 'react';
import { addDays, formatDate, businessDaysBetween, businessToCalendarDays, snapToMonday } from '../utils/dates';
import { supabase, isConfigured } from '../lib/supabase';

const STORAGE_KEY = 'gantt-v2-tasks';

// Collect all task IDs that transitively depend on the given task id
function getDependents(taskId, tasks) {
  const result = new Set();
  const queue = [taskId];
  while (queue.length) {
    const id = queue.shift();
    for (const t of tasks) {
      if (t.dependencies?.includes(id) && !result.has(t.id)) {
        result.add(t.id);
        queue.push(t.id);
      }
    }
  }
  return result;
}

// Map Supabase row to app task shape
function rowToTask(row) {
  return {
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    group: row.group || '',
    progress: row.progress || 0,
    dependencies: row.dependencies || [],
    color: row.color || '',
    sortOrder: row.sort_order ?? 0,
    assignees: row.assignees || [],
    milestone: row.start_date === row.end_date,
  };
}

// Map app task to Supabase row shape
function taskToRow(task, projectId) {
  return {
    ...(task.id ? { id: task.id } : {}),
    project_id: projectId,
    name: task.name,
    start_date: task.start,
    end_date: task.end,
    group: task.group || '',
    progress: task.progress || 0,
    dependencies: task.dependencies || [],
    color: task.color || '',
    sort_order: task.sortOrder ?? 0,
    assignees: task.assignees || [],
  };
}

function loadLocalTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const tasks = raw ? JSON.parse(raw) : [];
    return tasks.map((t) => ({ ...t, assignees: t.assignees || [], milestone: t.milestone || false }));
  } catch {
    return [];
  }
}

// Compute a diff of changed fields between old and updated values
function diffFields(oldTask, updates) {
  const result = {};
  for (const k of Object.keys(updates)) {
    if (JSON.stringify(oldTask[k]) !== JSON.stringify(updates[k])) {
      result[k] = { from: oldTask[k], to: updates[k] };
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function useTaskStore(projectId, { onRemoteChange, identity } = {}) {
  const [tasks, setTasks] = useState(() => isConfigured ? [] : loadLocalTasks());
  const [loading, setLoading] = useState(isConfigured);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const taskCountRef = useRef(0);
  const dragSnapshotRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastAnimatedRef = useRef(0);
  const recentlyWrittenRef = useRef(new Map()); // taskId → timestamp, for self-filtering realtime events
  const draggingTaskIdRef = useRef(null);        // task being dragged, skip its remote updates
  const onRemoteChangeRef = useRef(onRemoteChange);
  useEffect(() => { onRemoteChangeRef.current = onRemoteChange; }, [onRemoteChange]);
  const tasksRef = useRef([]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const markSaving = useCallback(() => {
    const now = Date.now();
    // Only show spinning animation once every 30 seconds
    if (now - lastAnimatedRef.current > 30000) {
      setSaveStatus('saving');
      lastAnimatedRef.current = now;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  const markSaved = useCallback(() => {
    setLastSavedAt(new Date());
    setSaveStatus('idle');
  }, []);

  // localStorage persistence when Supabase is not configured
  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  // Fire-and-forget history write — captures current tasks as a restorable snapshot
  const recordHistory = useCallback((type, task, changedFields = null) => {
    if (!isConfigured || !projectId) return;
    supabase.from('task_history').insert({
      project_id: projectId,
      task_id: task.id,
      task_name: task.name,
      change_type: type,
      changed_fields: changedFields,
      changed_by: identity || 'Unknown',
      task_snapshot: tasksRef.current,
    }).then(() => {});
  }, [projectId, identity]);

  // Fetch tasks from Supabase on mount / projectId change + subscribe to realtime
  useEffect(() => {
    if (!isConfigured || !projectId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let channel = null;
    setLoading(true);

    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const mapped = data.map(rowToTask);
          taskCountRef.current = mapped.length;
          setTasks(mapped);
        }
        setLoading(false);

        // Subscribe to realtime changes after initial load
        channel = supabase
          .channel(`tasks:${projectId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `project_id=eq.${projectId}`,
          }, ({ eventType, new: row, old: oldRow }) => {
            const id = row?.id ?? oldRow?.id;

            // Self-filter: ignore our own writes within 2 seconds
            const ts = recentlyWrittenRef.current.get(id);
            if (ts && Date.now() - ts < 2000) return;

            // Drag guard: don't overwrite the task currently being dragged
            if (draggingTaskIdRef.current === id) return;

            // Prune stale entries from self-filter map
            const now = Date.now();
            for (const [k, v] of recentlyWrittenRef.current) {
              if (now - v > 5000) recentlyWrittenRef.current.delete(k);
            }

            if (eventType === 'INSERT') {
              setTasks(prev => {
                if (prev.some(t => t.id === id)) return prev; // idempotent
                return [...prev, rowToTask(row)].sort((a, b) => a.sortOrder - b.sortOrder);
              });
            } else if (eventType === 'UPDATE') {
              setTasks(prev => prev.map(t => t.id === id ? rowToTask(row) : t));
            } else if (eventType === 'DELETE') {
              setTasks(prev => prev.filter(t => t.id !== id));
            }

            onRemoteChangeRef.current?.();
          })
          .subscribe();
      });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Touch project's updated_at
  const touchProject = useCallback(() => {
    if (!isConfigured || !projectId) return;
    supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .then(() => {});
  }, [projectId]);

  const addTask = useCallback((task) => {
    const id = crypto.randomUUID();
    const sortOrder = taskCountRef.current;
    taskCountRef.current += 1;
    const newTask = {
      id,
      name: task.name,
      start: task.start,
      end: task.end,
      group: task.group || '',
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      color: task.color || '',
      sortOrder,
      assignees: task.assignees || [],
      milestone: task.milestone || false,
    };

    setTasks((prev) => [...prev, newTask]);

    if (isConfigured) {
      recentlyWrittenRef.current.set(id, Date.now());
      supabase
        .from('tasks')
        .insert(taskToRow(newTask, projectId))
        .then(() => { touchProject(); recordHistory('create', newTask); });
    }

    return newTask;
  }, [projectId, touchProject, recordHistory]);

  const updateTask = useCallback((id, updates) => {
    let oldTask = null;
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) { oldTask = t; return { ...t, ...updates }; }
        return t;
      });
      return updated;
    });

    if (isConfigured) {
      const row = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.start !== undefined) row.start_date = updates.start;
      if (updates.end !== undefined) row.end_date = updates.end;
      if (updates.group !== undefined) row.group = updates.group;
      if (updates.progress !== undefined) row.progress = updates.progress;
      if (updates.dependencies !== undefined) row.dependencies = updates.dependencies;
      if (updates.color !== undefined) row.color = updates.color;
      if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
      if (updates.assignees !== undefined) row.assignees = updates.assignees;

      if (Object.keys(row).length > 0) {
        recentlyWrittenRef.current.set(id, Date.now());
        markSaving();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          supabase
            .from('tasks')
            .update(row)
            .eq('id', id)
            .then(() => {
              touchProject();
              markSaved();
              if (oldTask) {
                const changed = diffFields(oldTask, updates);
                if (changed) recordHistory('update', { ...oldTask, ...updates }, changed);
              }
            });
        }, 300);
      }
    }
  }, [touchProject, markSaving, markSaved, recordHistory]);

  const beginDrag = useCallback((taskId) => {
    draggingTaskIdRef.current = taskId || null;
    setTasks((current) => {
      dragSnapshotRef.current = current;
      return current;
    });
  }, []);

  const dragMove = useCallback((taskId, daysDelta) => {
    const snapshot = dragSnapshotRef.current;
    if (!snapshot) return;

    const dependents = getDependents(taskId, snapshot);
    const affectedIds = new Set([taskId, ...dependents]);

    // Helper: given a task's original dates, compute new start/end preserving biz duration
    const recompute = (origStart, origEnd, newStart) => {
      const snapped = snapToMonday(newStart);
      const bizDuration = businessDaysBetween(
        new Date(origStart + 'T00:00:00'),
        addDays(new Date(origEnd + 'T00:00:00'), 1)
      );
      const calOffset = bizDuration > 1 ? businessToCalendarDays(snapped, bizDuration - 1) : 0;
      return { start: formatDate(snapped), end: formatDate(addDays(snapped, calOffset)) };
    };

    // Next business day after a given end date string
    const nextBizDay = (endDateStr) => {
      const d = addDays(new Date(endDateStr + 'T00:00:00'), 1);
      return snapToMonday(d);
    };

    // Build updated map — start with snapshot, update primary task first
    const updatedMap = new Map(snapshot.map((t) => [t.id, t]));

    const primary = snapshot.find((t) => t.id === taskId);
    const primaryNewStart = addDays(new Date(primary.start + 'T00:00:00'), daysDelta);
    const { start: ps, end: pe } = recompute(primary.start, primary.end, primaryNewStart);
    updatedMap.set(taskId, { ...primary, start: ps, end: pe });

    // Process dependents in dependency order: retry if a dependency hasn't been updated yet
    const toProcess = [...dependents];
    const processed = new Set([taskId]);
    let guard = 0;
    while (toProcess.length > 0 && guard++ < 500) {
      const id = toProcess.shift();
      const task = snapshot.find((t) => t.id === id);
      if (!task) { processed.add(id); continue; }

      // Wait until all of this task's dependencies that are in affectedIds are processed
      const pendingDeps = (task.dependencies || []).filter((d) => affectedIds.has(d) && !processed.has(d));
      if (pendingDeps.length > 0) { toProcess.push(id); continue; }

      // Start = next biz day after the latest end among all dependencies
      let latestEnd = null;
      for (const depId of (task.dependencies || [])) {
        const dep = updatedMap.get(depId);
        if (!dep) continue;
        if (!latestEnd || dep.end > latestEnd) latestEnd = dep.end;
      }

      const newStart = latestEnd ? nextBizDay(latestEnd) : addDays(new Date(task.start + 'T00:00:00'), daysDelta);
      const { start: s, end: e } = recompute(task.start, task.end, newStart);
      updatedMap.set(id, { ...task, start: s, end: e });
      processed.add(id);
    }

    setTasks(snapshot.map((t) => updatedMap.get(t.id) || t));
  }, []);

  const endDrag = useCallback(() => {
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;
    draggingTaskIdRef.current = null;

    if (!snapshot || !isConfigured) return;

    setTasks((current) => {
      const changes = current.filter((t) => {
        const orig = snapshot.find((s) => s.id === t.id);
        return orig && (orig.start !== t.start || orig.end !== t.end);
      });

      for (const task of changes) {
        recentlyWrittenRef.current.set(task.id, Date.now());
        const orig = snapshot.find((s) => s.id === task.id);
        supabase
          .from('tasks')
          .update({ start_date: task.start, end_date: task.end })
          .eq('id', task.id)
          .then(() => {
            recordHistory('move', task, {
              dates: { from: { start: orig.start, end: orig.end }, to: { start: task.start, end: task.end } }
            });
          });
      }

      if (changes.length > 0) touchProject();
      return current;
    });
  }, [touchProject, recordHistory]);

  const deleteTask = useCallback((id) => {
    taskCountRef.current = Math.max(0, taskCountRef.current - 1);
    let deletedTask = null;
    setTasks((prev) => {
      deletedTask = prev.find(t => t.id === id) || null;
      return prev
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          dependencies: t.dependencies.filter((d) => d !== id),
        }));
    });

    if (isConfigured) {
      recentlyWrittenRef.current.set(id, Date.now());
      supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .then(() => {
          touchProject();
          if (deletedTask) recordHistory('delete', deletedTask);
        });
    }
  }, [touchProject, recordHistory]);

  const reorderTasks = useCallback((fromIndex, toIndex) => {
    setTasks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const reordered = next.map((t, i) => ({ ...t, sortOrder: i }));

      if (isConfigured) {
        for (const t of reordered) {
          supabase
            .from('tasks')
            .update({ sort_order: t.sortOrder })
            .eq('id', t.id)
            .then(() => {});
        }
      }

      return reordered;
    });
  }, []);

  const importTasks = useCallback(async (newTasks, mode = 'replace') => {
    if (mode === 'replace') {
      if (isConfigured) {
        await supabase.from('tasks').delete().eq('project_id', projectId);
      }

      const tasksWithIds = newTasks.map((t, i) => ({
        ...t,
        id: t.id || crypto.randomUUID(),
        sortOrder: i,
      }));

      if (isConfigured) {
        const rows = tasksWithIds.map((t) => taskToRow(t, projectId));
        await supabase.from('tasks').insert(rows);
        touchProject();
      }
      taskCountRef.current = tasksWithIds.length;
      setTasks(tasksWithIds);
    } else {
      setTasks((prev) => {
        const startIdx = prev.length;
        const tasksWithIds = newTasks.map((t, i) => ({
          ...t,
          id: crypto.randomUUID(),
          sortOrder: startIdx + i,
        }));

        if (isConfigured) {
          const rows = tasksWithIds.map((t) => taskToRow(t, projectId));
          supabase.from('tasks').insert(rows).then(() => touchProject());
        }

        return [...prev, ...tasksWithIds];
      });
    }
  }, [projectId, touchProject]);

  const setTasksDirect = useCallback((newTasks) => {
    taskCountRef.current = newTasks.length;
    setTasks(newTasks);
    if (isConfigured && projectId) {
      // Delete all project tasks and re-insert
      supabase
        .from('tasks')
        .delete()
        .eq('project_id', projectId)
        .then(() => {
          const rows = newTasks.map((t, i) => taskToRow({ ...t, sortOrder: i }, projectId));
          if (rows.length > 0) {
            supabase.from('tasks').insert(rows).then(() => touchProject());
          }
        });
    }
  }, [projectId, touchProject]);

  const updateProject = useCallback(async (updates) => {
    if (!isConfigured || !projectId) return;
    await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId);
  }, [projectId]);

  return {
    tasks,
    loading,
    saveStatus,
    lastSavedAt,
    project: {},
    addTask,
    updateTask,
    beginDrag,
    dragMove,
    endDrag,
    deleteTask,
    reorderTasks,
    importTasks,
    updateProject,
    setTasksDirect,
  };
}
