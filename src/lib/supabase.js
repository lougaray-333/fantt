import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://piswrdbefkzdusutfwvt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FcJ9pDFLDDzkztw4zpA3yQ_HHqRn069';

export const isConfigured = supabaseUrl && supabaseAnonKey
  && supabaseUrl.startsWith('http');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
