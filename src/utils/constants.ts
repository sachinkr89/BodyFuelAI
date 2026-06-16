// ──────────────────────────────────────────────
// BodyFuel AI — Constants & Configuration
// ──────────────────────────────────────────────

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', timeRange: '6:00 - 10:00' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️', timeRange: '12:00 - 15:00' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙', timeRange: '19:00 - 22:00' },
  { value: 'snack', label: 'Snack', emoji: '🍎', timeRange: 'Anytime' },
  { value: 'pre_workout', label: 'Pre-Workout', emoji: '💪', timeRange: 'Before gym' },
  { value: 'post_workout', label: 'Post-Workout', emoji: '🏋️', timeRange: 'After gym' },
] as const;

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

export const MACRO_COLORS = {
  calories: '#f97316',
  protein: '#6366f1',
  carbs: '#f59e0b',
  fats: '#ef4444',
  fiber: '#10b981',
  sugar: '#ec4899',
  iron: '#8b5cf6',
  calcium: '#14b8a6',
} as const;

export const DAILY_RECOMMENDED = {
  fiber_g: 25,
  sugar_g: 36,
  iron_mg: 18,
  calcium_mg: 1000,
  vitamin_d_mcg: 15,
  sodium_mg: 2300,
  water_ml: 3000,
} as const;

export const ENERGY_SCORE_LABELS = [
  { min: 0, max: 20, label: 'Critical', color: '#ef4444' },
  { min: 21, max: 40, label: 'Low', color: '#f97316' },
  { min: 41, max: 60, label: 'Moderate', color: '#f59e0b' },
  { min: 61, max: 80, label: 'Good', color: '#10b981' },
  { min: 81, max: 100, label: 'Excellent', color: '#06b6d4' },
] as const;
