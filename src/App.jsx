import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { isConfigured } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { supabase } from './lib/supabase';
import AuthGate from './components/AuthGate';
import ProjectDashboard from './components/ProjectDashboard';
import GanttEditor from './components/GanttEditor';

const LOCAL_TASKS_KEY = 'gantt-v2-tasks';
const LOCAL_PROJECT_KEY = 'gantt-v2-project';

function hasLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_KEY);
    const tasks = raw ? JSON.parse(raw) : [];
    return tasks.length > 0;
  } catch {
    return false;
  }
}

// Set to true to bypass auth and use localStorage (for testing)
const SKIP_AUTH = true;

export default function App() {
  if (!isConfigured || SKIP_AUTH) {
    return <GanttEditor projectId={null} onBack={null} />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { user, loading: authLoading, signInWithEmail, signOut } = useAuth();
  const {
    projects,
    loading: projectsLoading,
    canCreateMore,
    maxProjects,
    createProject,
    deleteProject,
    renameProject,
    refetch,
  } = useProjects(user?.id);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [localDataAvailable, setLocalDataAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      setLocalDataAvailable(hasLocalData());
    }
  }, [user]);

  const handleImportLocal = useCallback(async () => {
    try {
      const raw = localStorage.getItem(LOCAL_TASKS_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      if (tasks.length === 0) return;

      const projectRaw = localStorage.getItem(LOCAL_PROJECT_KEY);
      const projectMeta = projectRaw ? JSON.parse(projectRaw) : {};
      const projectName = projectMeta.name || 'Imported Project';

      const project = await createProject(projectName);

      const rows = tasks.map((t, i) => ({
        id: crypto.randomUUID(),
        project_id: project.id,
        name: t.name,
        start_date: t.start,
        end_date: t.end,
        group: t.group || '',
        progress: t.progress || 0,
        dependencies: [],
        color: t.color || '',
        sort_order: i,
      }));

      await supabase.from('tasks').insert(rows);

      localStorage.removeItem(LOCAL_TASKS_KEY);
      localStorage.removeItem(LOCAL_PROJECT_KEY);
      setLocalDataAvailable(false);

      setActiveProjectId(project.id);
    } catch (err) {
      console.error('Import failed:', err);
    }
  }, [createProject]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <AuthGate onSignIn={signInWithEmail} />;
  }

  if (activeProjectId) {
    return (
      <GanttEditor
        projectId={activeProjectId}
        onBack={() => {
          setActiveProjectId(null);
          refetch();
        }}
      />
    );
  }

  return (
    <ProjectDashboard
      projects={projects}
      loading={projectsLoading}
      canCreateMore={canCreateMore}
      maxProjects={maxProjects}
      onCreate={createProject}
      onOpen={setActiveProjectId}
      onDelete={deleteProject}
      onRename={renameProject}
      onSignOut={signOut}
      onImportLocal={handleImportLocal}
      hasLocalData={localDataAvailable}
      userEmail={user.email}
    />
  );
}
