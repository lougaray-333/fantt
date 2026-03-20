import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MAX_PROJECTS = 20;

export function useProjects(userId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!error) setProjects(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const canCreateMore = projects.length < MAX_PROJECTS;

  const createProject = useCallback(async (name = 'Untitled Project') => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => [data, ...prev]);
    return data;
  }, [userId]);

  const deleteProject = useCallback(async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renameProject = useCallback(async (id, name) => {
    const { error } = await supabase
      .from('projects')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }, []);

  return {
    projects,
    loading,
    canCreateMore,
    maxProjects: MAX_PROJECTS,
    createProject,
    deleteProject,
    renameProject,
    refetch: fetchProjects,
  };
}
