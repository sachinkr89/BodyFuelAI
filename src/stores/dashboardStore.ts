import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { DailySummary } from '../types';

interface DashboardState {
  weeklyData: DailySummary[];
  isLoading: boolean;

  fetchWeeklyData: (userId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  weeklyData: [],
  isLoading: false,

  fetchWeeklyData: async (userId: string) => {
    try {
      set({ isLoading: true });

      // Calculate the date 7 days ago
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6); // Include today = 7 days total
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Fetch weekly data error:', error);
        set({ weeklyData: [], isLoading: false });
        return;
      }

      set({
        weeklyData: (data as DailySummary[]) || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Fetch weekly data error:', err);
      set({ weeklyData: [], isLoading: false });
    }
  },
}));
