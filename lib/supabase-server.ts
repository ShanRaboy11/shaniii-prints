import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ============================================
// SUPABASE SERVER CLIENT (for Server Components / Route Handlers)
// ============================================

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
