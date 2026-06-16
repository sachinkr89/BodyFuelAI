// ──────────────────────────────────────────────
// BodyFuel AI — Core Type Definitions
// ──────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string | null;
  body_mode: 'general' | 'gym';
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: 'male' | 'female' | 'other' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  tdee: number | null;
  goal: 'lose' | 'maintain' | 'gain' | 'bulk' | 'cut' | null;
  daily_calorie_target: number | null;
  daily_protein_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  raw_text: string;
  meal_type: MealType;
  logged_at: string;
  created_at: string;
  parsed_macros?: ParsedMacros[];
}

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout';

export interface ParsedMacros {
  id: string;
  food_log_id: string;
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sugar_g: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_d_mcg: number;
  sodium_mg: number;
  water_ml: number;
  parsed_items: ParsedFoodItem[];
  confidence_score: number;
  created_at: string;
}

export interface ParsedFoodItem {
  name: string;
  quantity: string;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fats_g: number;
  total_fiber_g: number;
  total_sugar_g: number;
  total_iron_mg: number;
  total_calcium_mg: number;
  total_water_ml: number;
  meal_count: number;
  energy_score: number | null;
}

export interface HealthForecast {
  id: string;
  user_id: string;
  date_generated: string;
  forecast_days: number;
  predicted_weight_kg: number | null;
  predicted_energy_trend: 'improving' | 'stable' | 'declining';
  insight_message: string;
  forecast_data: ForecastDataPoint[];
  alerts: MicroNutrientAlert[];
}

export interface ForecastDataPoint {
  day: number;
  date: string;
  predicted_weight: number;
  predicted_energy: number;
  predicted_calories: number;
}

export interface MicroNutrientAlert {
  nutrient: string;
  current_avg: number;
  recommended: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface GeminiParsedResponse {
  items: ParsedFoodItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
    sugar_g: number;
    iron_mg: number;
    calcium_mg: number;
    vitamin_d_mcg: number;
    sodium_mg: number;
    water_ml: number;
  };
  confidence: number;
  assumptions: string[];
}

export interface OnboardingData {
  display_name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain' | 'bulk' | 'cut';
  body_mode: 'general' | 'gym';
}
