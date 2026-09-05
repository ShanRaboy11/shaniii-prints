'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, getUserProfile } from '@/lib/auth';

// ============================================
// AUTH CONTEXT PROVIDER
// Provides current user + profile (with role) to all components
// ============================================

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isCustomer: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOwner: false,
  isCustomer: false,
  isAuthenticated: false,
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(currentUser: User | null) {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const p = await getUserProfile(currentUser.id);
    setProfile(p);
  }

  async function refresh() {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    await fetchProfile(u);
  }

  useEffect(() => {
    // Track the currently-applied user id so we can ignore redundant auth
    // events (Supabase fires SIGNED_IN / TOKEN_REFRESHED on tab focus and on
    // periodic token refresh — re-setting state on those caused the app to
    // spuriously reload data while idle).
    let currentUserId: string | null = null;
    let active = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      const u = session?.user ?? null;
      currentUserId = u?.id ?? null;
      setUser(u);
      fetchProfile(u).finally(() => setLoading(false));
    });

    // Listen for auth changes — only react when the signed-in user actually
    // changes (sign in / sign out / account switch), not on token refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        const u = session?.user ?? null;
        const nextId = u?.id ?? null;

        // Same user as before → ignore. This prevents the identity object from
        // being replaced on every focus/refresh event downstream.
        if (nextId === currentUserId) {
          setLoading(false);
          return;
        }

        currentUserId = nextId;
        setUser(u);
        await fetchProfile(u);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isOwner: profile?.role === 'owner',
    isCustomer: profile?.role === 'customer',
    isAuthenticated: !!user,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
