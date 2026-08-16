import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT (Browser)
// Set your keys in .env.local
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Gracefully handle missing config (build-time / SSR prerender)
function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here') {
    // Return a dummy client that won't crash during build
    // At runtime with proper env vars, this won't execute
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSafeClient();
