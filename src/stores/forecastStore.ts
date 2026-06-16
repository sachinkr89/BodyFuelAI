import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateHealthForecast } from '../services/geminiService';
import type { HealthForecast, DailySummary, UserProfile } from '../types';

interface ForecastState {
  currentForecast: HealthForecast | null;
  isGenerating: boolean;

  generateForecast: (userId: string, profile: UserProfile) => Promise<void>;
  fetchLatestForecast: (userId: string) => Promise<void>;
}

export const useForecastStore = create<ForecastState>((set) => ({
  currentForecast: null,
  isGenerating: false,

  generateForecast: async (userId: string, profile: UserProfile) => {
    try {
      set({ isGenerating: true });

      // Fetch the last 14 days of daily summaries
      const now = new Date();
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(now.getDate() - 13); // Include today = 14 days
      const startDate = fourteenDaysAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const { data: summaries, error: fetchError } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('Fetch summaries for forecast error:', fetchError);
        set({ isGenerating: false });
        return;
      }

      const dailySummaries = (summaries as DailySummary[]) || [];

      if (dailySummaries.length === 0) {
        console.error('No daily summaries available to generate forecast');
        set({ isGenerating: false });
        return;
      }

      // Generate the health forecast via Gemini AI
      const forecastResult = await generateHealthForecast(dailySummaries, profile);

      if (!forecastResult) {
        console.error('Failed to generate health forecast');
        set({ isGenerating: false });
        return;
      }

      // Store the forecast in the database
      const { data: savedForecast, error: insertError } = await supabase
        .from('health_forecasts')
        .insert({
          user_id: userId,
          forecast_data: forecastResult.forecast_data,
          insight_message: forecastResult.insight_message,
          predicted_energy_trend: forecastResult.predicted_energy_trend,
          alerts: forecastResult.alerts,
          predicted_weight_kg: forecastResult.predicted_weight_kg,
          date_generated: new Date().toISOString(),
          forecast_days: 30,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert forecast error:', insertError);
        set({ isGenerating: false });
        return;
      }

      set({
        currentForecast: savedForecast as HealthForecast,
        isGenerating: false,
      });
    } catch (err) {
      console.error('Generate forecast error:', err);
      set({ isGenerating: false });
    }
  },

  fetchLatestForecast: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('health_forecasts')
        .select('*')
        .eq('user_id', userId)
        .order('date_generated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No forecast exists yet
        if (error.code === 'PGRST116') {
          set({ currentForecast: null });
          return;
        }
        console.error('Fetch latest forecast error:', error);
        return;
      }

      set({ currentForecast: data as HealthForecast });
    } catch (err) {
      console.error('Fetch latest forecast error:', err);
    }
  },
}));
