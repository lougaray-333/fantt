import { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

export function usePresence(projectId, identity) {
  const [otherCount, setOtherCount] = useState(0);
  const myKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!isConfigured || !projectId) return;

    const ch = supabase.channel(`presence:${projectId}`, {
      config: { presence: { key: myKey.current } },
    });

    ch.on('presence', { event: 'sync' }, () => {
      const count = Object.keys(ch.presenceState()).length;
      setOtherCount(Math.max(0, count - 1));
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ identity: identity || 'Collaborator', at: Date.now() });
      }
    });

    return () => { supabase.removeChannel(ch); };
  }, [projectId, identity]);

  return { otherCount };
}
