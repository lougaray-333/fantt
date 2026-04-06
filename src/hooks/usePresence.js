import { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

export function usePresence(projectId, identity) {
  const [others, setOthers] = useState([]); // [{ key, identity }]
  const myKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!isConfigured || !projectId) return;

    const ch = supabase.channel(`presence:${projectId}`, {
      config: { presence: { key: myKey.current } },
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const list = Object.entries(state)
        .filter(([key]) => key !== myKey.current)
        .map(([key, presences]) => ({
          key,
          identity: presences[0]?.identity || 'Collaborator',
        }));
      setOthers(list);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ identity: identity || 'Collaborator', at: Date.now() });
      }
    });

    return () => { supabase.removeChannel(ch); };
  }, [projectId, identity]);

  return { others };
}
