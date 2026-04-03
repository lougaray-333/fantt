import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import AuthGate from './components/AuthGate';
import AppLoader from './components/AppLoader';
const GanttEditor = lazy(() => import('./components/GanttEditor'));
const ProjectDashboard = lazy(() => import('./components/ProjectDashboard'));
import { useProjects } from './hooks/useProjects';
import { supabase, isConfigured } from './lib/supabase';

// Lazy-load routes that aren't needed on initial render
const LandingPage = lazy(() => import('./components/LandingPage'));
const GodMode = lazy(() => import('./components/GodMode'));
const SharedView = lazy(() => import('./components/SharedView'));

const EMAIL_KEY = 'fantt-user-email';
const STORAGE_KEY = 'gantt-v2-tasks';

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#E52222]" />
    </div>
  );
}

export default function App() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Swap favicon for God Mode
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    link.href = hash === '#/godmode' ? '/favicon-gold.svg' : '/favicon.svg';
  }, [hash]);

  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem(EMAIL_KEY));
  const projectStore = useProjects(email);

  const handleEnter = (userEmail) => {
    localStorage.setItem(EMAIL_KEY, userEmail);
    setEmail(userEmail);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem(EMAIL_KEY);
    setEmail('');
    setActiveProjectId(null);
    setShowLanding(true);
  }, []);

  const hasLocalData = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      return tasks.length > 0;
    } catch {
      return false;
    }
  })();

  const handleImportWBS = async (tasks, name) => {
    const project = await projectStore.createProject(name);
    if (isConfigured) {
      const rows = tasks.map((t, i) => ({
        id: crypto.randomUUID(),
        project_id: project.id,
        name: t.name,
        start_date: t.start,
        end_date: t.end,
        group: t.group || '',
        progress: t.progress || 0,
        dependencies: t.dependencies || [],
        color: t.color || '',
        sort_order: i,
        assignees: t.assignees || [],
      }));
      await supabase.from('tasks').insert(rows).select();
    }
    setActiveProjectId(project.id);
  };

  const handleImportLocal = async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      if (tasks.length === 0) return;
      const project = await projectStore.createProject('Imported Project');
      setActiveProjectId(project.id);
    } catch {
      // stay on dashboard
    }
  };

  // Skip loader for shared/godmode routes — show it only for main app
  const isSpecialRoute = hash.startsWith('#/share/') || hash === '#/godmode';
  if (!loaderDone && !isSpecialRoute) {
    return <AppLoader onComplete={() => setLoaderDone(true)} />;
  }

  // Public shared project view (no auth required)
  if (hash.startsWith('#/share/')) {
    const token = hash.replace('#/share/', '');
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SharedView token={token} />
      </Suspense>
    );
  }

  // God Mode admin dashboard
  if (hash === '#/godmode') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <GodMode />
      </Suspense>
    );
  }

  // Landing page for new visitors
  if (showLanding && !email) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LandingPage onGetStarted={() => setShowLanding(false)} />
      </Suspense>
    );
  }

  // Email gate
  if (!email) {
    return <AuthGate onEnter={handleEnter} />;
  }

  // Project dashboard
  if (!activeProjectId) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ProjectDashboard
          projects={projectStore.projects}
          loading={projectStore.loading}
          canCreateMore={projectStore.canCreateMore}
          maxProjects={projectStore.maxProjects}
          onCreate={projectStore.createProject}
          onOpen={setActiveProjectId}
          onDelete={projectStore.deleteProject}
          onRename={projectStore.renameProject}
          onSignOut={handleLogout}
          onImportLocal={handleImportLocal}
          onImportWBS={handleImportWBS}
          hasLocalData={hasLocalData}
          userEmail={email}
        />
      </Suspense>
    );
  }

  // Gantt editor
  const activeProject = projectStore.projects.find(p => p.id === activeProjectId);
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GanttEditor
        projectId={activeProjectId}
        projectName={activeProject?.name || ''}
        email={email}
        onBack={() => setActiveProjectId(null)}
      />
    </Suspense>
  );
}
