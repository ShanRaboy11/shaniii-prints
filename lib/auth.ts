import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// ============================================
// AUTH UTILITIES
// ============================================

export type UserRole = 'owner' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

// --- Sign Up ---
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = 'customer'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) throw error;
  return data;
}

// --- Sign In ---
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// --- Sign Out ---
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// --- Get Current User ---
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// --- Get User Profile (with role) ---
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// --- Check if user is owner ---
export async function isOwner(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const profile = await getUserProfile(user.id);
  return profile?.role === 'owner';
}

// --- Listen to Auth State Changes ---
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
