import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppState {
  session: Session | null;
  loading: boolean;
  lastSyncAt: Record<string, string>;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  updateSyncTime: (module: string) => void;
  signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  session: null,
  loading: false,
  lastSyncAt: {},

  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  updateSyncTime: (module) =>
    set((state) => ({
      lastSyncAt: { ...state.lastSyncAt, [module]: new Date().toISOString() },
    })),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, lastSyncAt: {} });
  },
}));

// Initialize session from storage
supabase.auth.getSession().then(({ data }) => {
  useAppStore.getState().setSession(data.session);
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAppStore.getState().setSession(session);
});
