import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import FantasyLogo from './FantasyLogo';

const GanttEditor = lazy(() => import('./GanttEditor'));

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#E52222]" />
    </div>
  );
}

export default function EditView({ token }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'invalid'
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    supabase
      .from('projects')
      .select('id, name')
      .eq('edit_token', token)
      .eq('edit_enabled', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return; }
        setProject(data);
        setStatus('ready');
      });
  }, [token]);

  if (status === 'loading') return <Spinner />;

  if (status === 'invalid') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg">
        <FantasyLogo height={28} />
        <p className="text-sm text-text-muted">This edit link is invalid or has been disabled.</p>
        <p className="text-xs text-text-muted/60">Ask the project owner for a new link.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<Spinner />}>
      <GanttEditor
        projectId={project.id}
        projectName={project.name}
        email={null}
        isCollaborator={true}
        onBack={() => { window.location.hash = ''; }}
      />
    </Suspense>
  );
}
