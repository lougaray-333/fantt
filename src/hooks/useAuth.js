import { useState, useEffect, useCallback } from 'react';
import { supabase, isConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email) => {
    if (!isConfigured) throw new Error('Supabase is not configured. Add your credentials to .env.local');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { user, loading, signInWithEmail, signOut };
}
