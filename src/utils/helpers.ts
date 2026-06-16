// ──────────────────────────────────────────────
// BodyFuel AI — Helper / Utility Functions
// ──────────────────────────────────────────────

import type { DailySummary, MealType, UserProfile } from '../types';
import { ACTIVITY_MULTIPLIERS, DAILY_RECOMMENDED } from './constants';

/**
 * Calculate Total Daily Energy Expenditure using the Mifflin-St Jeor equation.
 *
 * Male  : BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
 * Female: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
 * Other : average of male & female BMR
 *
 * TDEE = BMR × activity multiplier
 */
export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
): number {
  const baseMale = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const baseFemale = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  let bmr: number;
  switch (gender) {
    case 'male':
      bmr = baseMale;
      break;
    case 'female':
      bmr = baseFemale;
      break;
    case 'other':
    default:
      bmr = (baseMale + baseFemale) / 2;
      break;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activity_level];
  return Math.round(bmr * multiplier);
}

/**
 * Derive daily calorie & protein targets from TDEE and the user's goal.
 *
 * Goal      │ Calorie adjustment │ Protein (g/kg)
 * ──────────┼────────────────────┼───────────────
 * lose      │ TDEE − 500         │ 2.2
 * maintain  │ TDEE               │ 1.8
 * gain      │ TDEE + 300         │ 2.0
 * bulk      │ TDEE + 500         │ 2.0
 * cut       │ TDEE − 600         │ 2.2
 */
export function calculateDailyTargets(
  tdee: number,
  goal: 'lose' | 'maintain' | 'gain' | 'bulk' | 'cut',
  weight_kg: number,
): { calories: number; protein_g: number } {
  const calorieMap: Record<typeof goal, number> = {
    lose: tdee - 500,
    maintain: tdee,
    gain: tdee + 300,
    bulk: tdee + 500,
    cut: tdee - 600,
  };

  const proteinMultiplierMap: Record<typeof goal, number> = {
    lose: 2.2,
    maintain: 1.8,
    gain: 2.0,
    bulk: 2.0,
    cut: 2.2,
  };

  return {
    calories: Math.round(calorieMap[goal]),
    protein_g: Math.round(weight_kg * proteinMultiplierMap[goal]),
  };
}

/**
 * Compute a 0–100 energy score reflecting how close the user's actual
 * intake is to their targets.  Penalises both over- and under-eating.
 *
 * Components (weighted):
 *  40% — calorie accuracy
 *  30% — protein accuracy
 *  15% — fiber vs. recommended
 *  15% — hydration vs. recommended
 */
export function calculateEnergyScore(
  summary: DailySummary,
  profile: UserProfile,
): number {
  const calorieTarget = profile.daily_calorie_target ?? 2000;
  const proteinTarget = profile.daily_protein_target ?? 120;

  // Accuracy = 100 − |deviation%|, clamped to [0, 100]
  const calorieAccuracy = Math.max(
    0,
    100 - Math.abs(((summary.total_calories - calorieTarget) / calorieTarget) * 100),
  );

  const proteinAccuracy = Math.max(
    0,
    100 - Math.abs(((summary.total_protein_g - proteinTarget) / proteinTarget) * 100),
  );

  const fiberAccuracy = Math.min(
    100,
    (summary.total_fiber_g / DAILY_RECOMMENDED.fiber_g) * 100,
  );

  const waterAccuracy = Math.min(
    100,
    (summary.total_water_ml / DAILY_RECOMMENDED.water_ml) * 100,
  );

  const score =
    calorieAccuracy * 0.4 +
    proteinAccuracy * 0.3 +
    fiberAccuracy * 0.15 +
    waterAccuracy * 0.15;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Format an ISO date string into a human-readable form.
 * e.g. "16 Jun 2026"
 */
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Round a number to `decimals` places and return as a locale-formatted string.
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Return a time-of-day greeting.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

/**
 * Auto-detect the most likely meal type based on the current wall-clock time.
 */
export function getMealTypeFromTime(): MealType {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 12) return 'snack';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 19) return 'pre_workout';
  if (hour >= 19 && hour < 22) return 'dinner';
  return 'snack';
}

/**
 * Convert an ISO timestamp into a friendly relative string such as
 * "just now", "2 minutes ago", "3 hours ago", "Yesterday", etc.
 */
export function getRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) === 1 ? '' : 's'} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) === 1 ? '' : 's'} ago`;
}
