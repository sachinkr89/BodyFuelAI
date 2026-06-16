import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { UserProfile, OnboardingData } from '../types';
import { calculateTDEE, calculateDailyTargets } from '../utils/helpers';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<{ error: any }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any }>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isOnboarded: false,

  initialize: async () => {
    try {
      set({ isLoading: true });

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        });
        return;
      }

      set({ user, isAuthenticated: true });
      await get().fetchProfile();

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user, isAuthenticated: true });
          await get().fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isOnboarded: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          set({ user: session.user });
        }
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isOnboarded: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      set({ user: data.user, isAuthenticated: true });
      await get().fetchProfile();

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: err };
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        set({ user: data.user, isAuthenticated: true });
      }

      return { error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: err };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
      }

      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isOnboarded: false,
        isLoading: false,
      });
    } catch (err) {
      console.error('Sign out error:', err);
      set({ isLoading: false });
    }
  },

  completeOnboarding: async (data: OnboardingData) => {
    try {
      const { user } = get();
      if (!user) {
        return { error: new Error('No authenticated user') };
      }

      const tdee = calculateTDEE(data.weight_kg, data.height_cm, data.age, data.gender, data.activity_level);
      const dailyTargets = calculateDailyTargets(tdee, data.goal, data.weight_kg);

      const profileData: Partial<UserProfile> = {
        id: user.id,
        display_name: data.display_name,
        age: data.age,
        gender: data.gender,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        activity_level: data.activity_level,
        goal: data.goal,
        body_mode: data.body_mode,
        tdee,
        daily_calorie_target: dailyTargets.calories,
        daily_protein_target: dailyTargets.protein_g,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Onboarding upsert error:', error);
        return { error };
      }

      await get().fetchProfile();
      set({ isOnboarded: true });

      return { error: null };
    } catch (err) {
      console.error('Complete onboarding error:', err);
      return { error: err };
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    try {
      set({ isLoading: true });

      const { user } = get();
      if (!user) {
        set({ isLoading: false });
        return { error: new Error('No authenticated user') };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Update profile error:', error);
        set({ isLoading: false });
        return { error };
      }

      await get().fetchProfile();
      set({ isLoading: false });

      return { error: null };
    } catch (err) {
      console.error('Update profile error:', err);
      set({ isLoading: false });
      return { error: err };
    }
  },

  fetchProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile doesn't exist yet (not onboarded)
        if (error.code === 'PGRST116') {
          set({ profile: null, isOnboarded: false });
          return;
        }
        console.error('Fetch profile error:', error);
        return;
      }

      const isOnboarded = !!(data && data.age);
      set({ profile: data as UserProfile, isOnboarded });
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  },
}));
