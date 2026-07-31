import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { seedDefaultTemplates } from '../utils/seedTemplates';

const MAX_PROJECTS = 20;

export function useProjects(email) {
  const [projects, setProjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    const [{ data: pData, error: pErr }, { data: sharedData }, { data: fData, error: fErr }] = await Promise.all([
      supabase.from('projects').select('*').eq('email', email).order('updated_at', { ascending: false }),
      supabase.from('projects').select('*').eq('is_template', true).eq('is_shared', true).order('name', { ascending: true }),
      supabase.from('folders').select('*').eq('email', email).order('sort_order', { ascending: true }),
    ]);
    if (!pErr) {
      const owned = pData || [];
      const extra = (sharedData || []).filter((t) => !owned.find((p) => p.id === t.id));
      setProjects([...owned, ...extra]);
    }
    if (!fErr) setFolders(fData || []);
    setLoading(false);
  }, [email]);

  useEffect(() => {
    let cancelled = false;
    if (!email) { setLoading(false); return; }
    setLoading(true);

    (async () => {
      const [{ data: pData, error: pErr }, { data: sharedData }, { data: fData, error: fErr }] = await Promise.all([
        supabase.from('projects').select('*').eq('email', email).order('updated_at', { ascending: false }),
        supabase.from('projects').select('*').eq('is_template', true).eq('is_shared', true).order('name', { ascending: true }),
        supabase.from('folders').select('*').eq('email', email).order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;
      if (!pErr) {
        const owned = pData || [];
        const extra = (sharedData || []).filter((t) => !owned.find((p) => p.id === t.id));
        setProjects([...owned, ...extra]);
      }
      if (!fErr) setFolders(fData || []);

      // Seed the 3 default shared templates once globally if none exist yet
      if (!seededRef.current) {
        seededRef.current = true;
        if ((sharedData || []).length === 0) {
          await seedDefaultTemplates();
          const { data: freshShared } = await supabase
            .from('projects')
            .select('*')
            .eq('is_template', true)
            .eq('is_shared', true)
            .order('name', { ascending: true });
          if (!cancelled && freshShared) {
            const owned = pData || [];
            const extra = freshShared.filter((t) => !owned.find((p) => p.id === t.id));
            setProjects([...owned, ...extra]);
          }
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [email]);

  const canCreateMore = projects.length < MAX_PROJECTS;

  // ── Projects ────────────────────────────────────────────────────

  const createProject = useCallback(async (name = 'Untitled Project', folderId = null) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ email, name, folder_id: folderId || null })
      .select()
      .single();
    if (error) { console.error('[useProjects] create error:', error); throw error; }
    setProjects((prev) => [data, ...prev]);
    return data;
  }, [email]);

  const deleteProject = useCallback(async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renameProject = useCallback(async (id, name) => {
    const { error } = await supabase
      .from('projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const moveProjectToFolder = useCallback(async (projectId, folderId) => {
    const { error } = await supabase
      .from('projects')
      .update({ folder_id: folderId || null })
      .eq('id', projectId);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, folder_id: folderId || null } : p));
  }, []);

  const toggleFavorite = useCallback(async (projectId, isFavorite) => {
    const { error } = await supabase.from('projects').update({ is_favorite: isFavorite }).eq('id', projectId);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, is_favorite: isFavorite } : p));
  }, []);

  const toggleTemplate = useCallback(async (projectId, isTemplate) => {
    const updates = { is_template: isTemplate, ...(isTemplate ? { folder_id: null } : {}) };
    const { error } = await supabase.from('projects').update(updates).eq('id', projectId);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, ...updates } : p));
  }, []);

  const shareTemplate = useCallback(async (projectId) => {
    const { error } = await supabase.from('projects').update({ is_shared: true }).eq('id', projectId);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, is_shared: true } : p));
  }, []);

  const unshareTemplate = useCallback(async (projectId) => {
    const { error } = await supabase.from('projects').update({ is_shared: false }).eq('id', projectId);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, is_shared: false } : p));
  }, []);

  const updateProjectColor = useCallback(async (id, color) => {
    const { error } = await supabase.from('projects').update({ color: color || null }).eq('id', id);
    if (error) throw error;
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, color: color || null } : p));
  }, []);

  const updateFolderColor = useCallback(async (id, color) => {
    const { error } = await supabase.from('folders').update({ color: color || null }).eq('id', id);
    if (error) throw error;
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, color: color || null } : f));
  }, []);

  const duplicateProject = useCallback(async (id) => {
    const source = projects.find((p) => p.id === id);
    if (!source) return;

    // 1. Create new project row
    const { data: newProject, error: projError } = await supabase
      .from('projects')
      .insert({
        email,
        name: source.name + ' Copy',
        folder_id: source.is_template ? null : (source.folder_id || null),
        holidays: source.holidays || [],
        is_template: false,
      })
      .select()
      .single();
    if (projError) throw projError;

    // 2. Fetch source tasks
    const { data: sourceTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });

    if (sourceTasks?.length > 0) {
      // 3. Remap UUIDs
      const idMap = {};
      for (const t of sourceTasks) idMap[t.id] = crypto.randomUUID();

      // 4. Insert with remapped dependencies
      const newTasks = sourceTasks.map((t) => ({
        id: idMap[t.id],
        project_id: newProject.id,
        name: t.name,
        start_date: t.start_date,
        end_date: t.end_date,
        group: t.group,
        progress: t.progress,
        dependencies: (t.dependencies || []).map((d) => idMap[d] || d),
        color: t.color,
        sort_order: t.sort_order,
        assignees: t.assignees,
        in_slide: t.in_slide,
      }));
      await supabase.from('tasks').insert(newTasks);
    }

    // 5. Copy budget if it exists
    const { data: budget } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();
    if (budget) {
      await supabase.from('project_budgets').insert({
        project_id: newProject.id,
        resource_hours: budget.resource_hours,
        oop_expenses: budget.oop_expenses,
        hidden_roles: budget.hidden_roles,
        role_names: budget.role_names,
        role_rates: budget.role_rates,
      });
    }

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, [email, projects]);

  // ── Folders ────────────────────────────────────────────────────

  const createFolder = useCallback(async (name, parentId = null) => {
    const sortOrder = folders.length;
    const { data, error } = await supabase
      .from('folders')
      .insert({ email, name, sort_order: sortOrder, parent_id: parentId || null })
      .select()
      .single();
    if (error) throw error;
    setFolders((prev) => [...prev, data]);
    return data;
  }, [email, folders.length]);

  const renameFolder = useCallback(async (id, name) => {
    const { error } = await supabase.from('folders').update({ name }).eq('id', id);
    if (error) throw error;
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
  }, []);

  const deleteFolder = useCallback(async (id) => {
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) throw error;
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Projects with this folder_id become null (uncategorized) via ON DELETE SET NULL in DB
    setProjects((prev) => prev.map((p) => p.folder_id === id ? { ...p, folder_id: null } : p));
  }, []);

  return {
    projects,
    folders,
    loading,
    canCreateMore,
    maxProjects: MAX_PROJECTS,
    createProject,
    deleteProject,
    renameProject,
    moveProjectToFolder,
    toggleFavorite,
    toggleTemplate,
    duplicateProject,
    createFolder,
    renameFolder,
    deleteFolder,
    shareTemplate,
    unshareTemplate,
    updateProjectColor,
    updateFolderColor,
    refetch: fetchAll,
  };
}
