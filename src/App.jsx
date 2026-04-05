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
      <svg
        width="36" height="37"
        viewBox="0 0 129 130"
        fill="none"
        style={{ animation: 'fantt-shield-pulse 1.6s ease-in-out infinite' }}
      >
        <path
          d="M128.992248 24.2154558c0-7.837565-5.278685-17.83768403-17.043423-22.47559798-15.2381769-6.00684349-21.1734328 12.15235358-47.452701 12.15235358s-32.214524-18.15919707-47.4527007-12.15235358c-11.76473803 4.63791395-17.0434233 14.63803298-17.0434233 22.47559798 0 10.2510088 12.8466605 17.4455479 12.8466605 40.8021625 0 23.3569371-12.8466605 30.5514761-12.8466605 40.8024847 0 7.837565 5.27868527 17.838007 17.0434233 22.475598 15.2381767 6.006521 21.1734325-12.152353 47.4527007-12.152353s32.2145241 18.158874 47.452701 12.152353c11.764738-4.637591 17.043423-14.638033 17.043423-22.475598 0-10.2510086-12.84666-17.4455476-12.84666-40.8024847 0-23.3566146 12.84666-30.5511537 12.84666-40.8021625"
          fill="#E52222"
          fillRule="evenodd"
        />
      </svg>
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
      <Suspense fallback={null}>
        <LandingPage onGetStarted={() => setShowLanding(false)} />
      </Suspense>
    );
  }

  // Email gate
  if (!email) {
    return <AuthGate onEnter={handleEnter} />;
  }

  // Project dashboard — no spinner here, AppLoader already played
  if (!activeProjectId) {
    return (
      <Suspense fallback={null}>
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
