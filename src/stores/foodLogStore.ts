import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { parseFoodInput } from '../services/geminiService';
import type { FoodLog, DailySummary, MealType, GeminiParsedResponse } from '../types';

interface FoodLogState {
  todaysLogs: FoodLog[];
  todaysSummary: DailySummary | null;
  isLogging: boolean;
  isParsing: boolean;
  lastParsedResult: GeminiParsedResponse | null;

  logFood: (rawText: string, mealType: MealType, userId: string, imageBase64?: string) => Promise<{ error: any }>;
  fetchTodaysLogs: (userId: string) => Promise<void>;
  fetchTodaysSummary: (userId: string) => Promise<void>;
  deleteLog: (logId: string, userId: string) => Promise<void>;
  clearLastParsed: () => void;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  todaysLogs: [],
  todaysSummary: null,
  isLogging: false,
  isParsing: false,
  lastParsedResult: null,

  logFood: async (rawText: string, mealType: MealType, userId: string, imageBase64?: string) => {
    try {
      set({ isParsing: true, isLogging: true });

      // Step 1: Parse the food input via Gemini AI (supports image base64)
      const parsedResult = await parseFoodInput(rawText, imageBase64);
      set({ lastParsedResult: parsedResult, isParsing: false });

      if (!parsedResult || !parsedResult.items || parsedResult.items.length === 0) {
        set({ isLogging: false });
        return { error: new Error('Could not parse food input') };
      }

      // Step 2: Insert the food log entry
      const { data: foodLog, error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: userId,
          raw_text: rawText,
          meal_type: mealType,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (logError || !foodLog) {
        console.error('Food log insert error:', logError);
        set({ isLogging: false });
        return { error: logError };
      }

      // Step 3: Insert parsed macros for each food item
      const macroInserts = parsedResult.items.map((item) => ({
        food_log_id: foodLog.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fats_g: item.fats_g,
        fiber_g: item.fiber_g || 0,
      }));

      const { error: macroError } = await supabase
        .from('parsed_macros')
        .insert(macroInserts);

      if (macroError) {
        console.error('Parsed macros insert error:', macroError);
        // Clean up the food log if macros fail
        await supabase.from('food_logs').delete().eq('id', foodLog.id);
        set({ isLogging: false });
        return { error: macroError };
      }

      // Step 4: Update the daily summary by recalculating from all today's macros
      await recalculateDailySummary(userId);

      // Step 5: Refetch today's logs and summary
      await get().fetchTodaysLogs(userId);
      await get().fetchTodaysSummary(userId);

      set({ isLogging: false });
      return { error: null };
    } catch (err) {
      console.error('Log food error:', err);
      set({ isParsing: false, isLogging: false });
      return { error: err };
    }
  },

  fetchTodaysLogs: async (userId: string) => {
    try {
      const today = getTodayDateString();
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('food_logs')
        .select(`
          *,
          parsed_macros (*)
        `)
        .eq('user_id', userId)
        .gte('logged_at', startOfDay)
        .lte('logged_at', endOfDay)
        .order('logged_at', { ascending: false });

      if (error) {
        console.error('Fetch today\'s logs error:', error);
        return;
      }

      set({ todaysLogs: (data as FoodLog[]) || [] });
    } catch (err) {
      console.error('Fetch today\'s logs error:', err);
    }
  },

  fetchTodaysSummary: async (userId: string) => {
    try {
      const today = getTodayDateString();

      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error) {
        // No summary for today yet — that's fine
        if (error.code === 'PGRST116') {
          set({ todaysSummary: null });
          return;
        }
        console.error('Fetch today\'s summary error:', error);
        return;
      }

      set({ todaysSummary: data as DailySummary });
    } catch (err) {
      console.error('Fetch today\'s summary error:', err);
    }
  },

  deleteLog: async (logId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', logId);

      if (error) {
        console.error('Delete log error:', error);
        return;
      }

      // Recalculate daily summary after deletion
      await recalculateDailySummary(userId);

      // Refetch today's data
      await get().fetchTodaysLogs(userId);
      await get().fetchTodaysSummary(userId);
    } catch (err) {
      console.error('Delete log error:', err);
    }
  },

  clearLastParsed: () => {
    set({ lastParsedResult: null });
  },
}));

/**
 * Recalculates the daily summary by summing all parsed macros
 * from today's food logs for the given user.
 */
export async function recalculateDailySummary(userId: string): Promise<void> {
  try {
    const today = getTodayDateString();
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    console.log(`[recalculate] Fetching logs for ${today} between ${startOfDay} and ${endOfDay}`);

    // Fetch all today's food logs with their parsed macros
    const { data: logs, error: fetchError } = await supabase
      .from('food_logs')
      .select(`
        id,
        parsed_macros (
          calories,
          protein_g,
          carbs_g,
          fats_g,
          fiber_g
        )
      `)
      .eq('user_id', userId)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay);

    if (fetchError) {
      console.error('Recalculate daily summary fetch error:', fetchError);
      return;
    }

    console.log(`[recalculate] Found ${logs?.length || 0} logs for today`);

    // Sum all macros across all food logs
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalFiber = 0;

    if (logs) {
      for (const log of logs) {
        const macros = log.parsed_macros as any[];
        console.log(`[recalculate] Log ${log.id} has ${macros?.length || 0} macros`);
        if (macros) {
          for (const macro of macros) {
            totalCalories += Number(macro.calories) || 0;
            totalProtein += Number(macro.protein_g) || 0;
            totalCarbs += Number(macro.carbs_g) || 0;
            totalFats += Number(macro.fats_g) || 0;
            totalFiber += Number(macro.fiber_g) || 0;
          }
        }
      }
    }

    console.log(`[recalculate] Totals calculated: Cal=${totalCalories}, Pro=${totalProtein}, Carbs=${totalCarbs}, Fats=${totalFats}`);

    const payload = {
      user_id: userId,
      date: today,
      total_calories: Math.round(totalCalories),
      total_protein_g: Math.round(totalProtein * 10) / 10,
      total_carbs_g: Math.round(totalCarbs * 10) / 10,
      total_fats_g: Math.round(totalFats * 10) / 10,
      total_fiber_g: Math.round(totalFiber * 10) / 10,
      meal_count: logs?.length || 0,
    };

    console.log(`[recalculate] Upserting summary:`, payload);

    // Upsert the daily summary
    const { error: upsertError } = await supabase
      .from('daily_summaries')
      .upsert(payload, { onConflict: 'user_id,date' });

    if (upsertError) {
      console.error('Recalculate daily summary upsert error:', upsertError);
    } else {
      console.log(`[recalculate] Upsert successful!`);
    }
  } catch (err) {
    console.error('Recalculate daily summary error:', err);
  }
}
