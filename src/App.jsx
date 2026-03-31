import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import AuthGate from './components/AuthGate';
const GanttEditor = lazy(() => import('./components/GanttEditor'));
const ProjectDashboard = lazy(() => import('./components/ProjectDashboard'));
import { useProjects } from './hooks/useProjects';

// Lazy-load routes that aren't needed on initial render
const LandingPage = lazy(() => import('./components/LandingPage'));
const GodMode = lazy(() => import('./components/GodMode'));

const EMAIL_KEY = 'fantt-user-email';
const STORAGE_KEY = 'gantt-v2-tasks';

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-amber-400" />
    </div>
  );
}

export default function App() {
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
  const [pendingImportTasks, setPendingImportTasks] = useState(null);
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
    setPendingImportTasks(tasks);
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
        initialTasks={pendingImportTasks}
        onConsumeInitialTasks={() => setPendingImportTasks(null)}
      />
    </Suspense>
  );
}
