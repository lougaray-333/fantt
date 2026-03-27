import { useState, useCallback, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import GanttEditor from './components/GanttEditor';
import ProjectDashboard from './components/ProjectDashboard';
import LandingPage from './components/LandingPage';
import GodMode from './components/GodMode';
import { useProjects } from './hooks/useProjects';

const EMAIL_KEY = 'fantt-user-email';
const STORAGE_KEY = 'gantt-v2-tasks';

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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

  const handleImportLocal = async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      if (tasks.length === 0) return;
      const project = await projectStore.createProject('Imported Project');
      setActiveProjectId(project.id);
      // Tasks will be imported inside GanttEditor via the store
    } catch {
      // stay on dashboard
    }
  };

  // God Mode admin dashboard
  if (hash === '#/godmode') {
    return <GodMode />;
  }

  // Landing page for new visitors
  if (showLanding && !email) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  // Email gate
  if (!email) {
    return <AuthGate onEnter={handleEnter} />;
  }

  // Project dashboard
  if (!activeProjectId) {
    return (
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
        hasLocalData={hasLocalData}
        userEmail={email}
      />
    );
  }

  // Gantt editor
  return (
    <GanttEditor
      projectId={activeProjectId}
      email={email}
      onBack={() => setActiveProjectId(null)}
    />
  );
}
