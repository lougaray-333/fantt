import { useState, useCallback, useEffect, useRef } from 'react';
import { addDays, formatDate } from '../utils/dates';
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
  };
}

function loadLocalTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useTaskStore(projectId) {
  const [tasks, setTasks] = useState(() => isConfigured ? [] : loadLocalTasks());
  const [loading, setLoading] = useState(isConfigured);
  const dragSnapshotRef = useRef(null);

  // localStorage persistence when Supabase is not configured
  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  // Fetch tasks from Supabase on mount / projectId change
  useEffect(() => {
    if (!isConfigured || !projectId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setTasks(data.map(rowToTask));
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
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
    const newTask = {
      id,
      name: task.name,
      start: task.start,
      end: task.end,
      group: task.group || '',
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      color: task.color || '',
      sortOrder: 0,
    };

    setTasks((prev) => {
      newTask.sortOrder = prev.length;
      return [...prev, newTask];
    });

    if (isConfigured) {
      supabase
        .from('tasks')
        .insert(taskToRow(newTask, projectId))
        .then(() => touchProject());
    }

    return newTask;
  }, [projectId, touchProject]);

  const updateTask = useCallback((id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));

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

      if (Object.keys(row).length > 0) {
        supabase
          .from('tasks')
          .update(row)
          .eq('id', id)
          .then(() => touchProject());
      }
    }
  }, [touchProject]);

  const beginDrag = useCallback(() => {
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

    setTasks(
      snapshot.map((t) => {
        if (affectedIds.has(t.id)) {
          return {
            ...t,
            start: formatDate(addDays(new Date(t.start), daysDelta)),
            end: formatDate(addDays(new Date(t.end), daysDelta)),
          };
        }
        return t;
      })
    );
  }, []);

  const endDrag = useCallback(() => {
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;

    if (!snapshot || !isConfigured) return;

    setTasks((current) => {
      const changes = current.filter((t) => {
        const orig = snapshot.find((s) => s.id === t.id);
        return orig && (orig.start !== t.start || orig.end !== t.end);
      });

      for (const task of changes) {
        supabase
          .from('tasks')
          .update({ start_date: task.start, end_date: task.end })
          .eq('id', task.id)
          .then(() => {});
      }

      if (changes.length > 0) touchProject();
      return current;
    });
  }, [touchProject]);

  const deleteTask = useCallback((id) => {
    setTasks((prev) =>
      prev
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          dependencies: t.dependencies.filter((d) => d !== id),
        }))
    );

    if (isConfigured) {
      supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .then(() => touchProject());
    }
  }, [touchProject]);

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
      }
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
  };
}
