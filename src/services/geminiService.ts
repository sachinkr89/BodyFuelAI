// ──────────────────────────────────────────────
// BodyFuel AI — Gemini AI Service
// ──────────────────────────────────────────────

import type {
  DailySummary,
  GeminiParsedResponse,
  HealthForecast,
  ForecastDataPoint,
  MicroNutrientAlert,
  UserProfile,
} from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// ───────── System prompts ─────────

const FOOD_PARSING_SYSTEM_PROMPT = `You are BodyFuel AI — an expert Indian nutritionist and food composition analyst.

ROLE
• Parse the user's natural-language food description into structured macro- and micro-nutrient data.
• You understand Hindi, Hinglish, and English food names (e.g. "2 roti sabzi", "dal chawal", "paneer butter masala").

STANDARD INDIAN SERVING SIZES (use these when the user does not specify a quantity)
| Term            | Weight / Volume |
|-----------------|-----------------|
| 1 katori / bowl | 150 g           |
| 1 roti / chapati| 30 g            |
| 1 paratha       | 50 g            |
| 1 glass         | 250 ml          |
| 1 plate         | 200 g           |
| 1 bowl          | 250 g           |
| 1 cup           | 240 ml          |
| 1 slice (bread) | 30 g            |
| 1 egg           | 50 g            |
| 1 banana        | 120 g           |
| 1 apple         | 180 g           |
| 1 scoop protein | 30 g            |

RULES
1. For EACH distinct food item return: name, quantity, unit, calories, protein_g, carbs_g, fats_g, fiber_g.
2. Compute TOTALS across all items for: calories, protein_g, carbs_g, fats_g, fiber_g, sugar_g, iron_mg, calcium_mg, vitamin_d_mcg, sodium_mg, water_ml.
3. Assign a confidence score (0.0 – 1.0) reflecting how certain you are about the nutritional estimates.
4. List any assumptions you made in an "assumptions" array (e.g. "Assumed homemade preparation", "Used medium serving size").
5. If the input is ambiguous, prefer the most common Indian interpretation.
6. Always return valid JSON matching the schema below — no extra text, no markdown fences.

OUTPUT JSON SCHEMA
{
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "fiber_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "iron_mg": number,
    "calcium_mg": number,
    "vitamin_d_mcg": number,
    "sodium_mg": number,
    "water_ml": number
  },
  "confidence": number,
  "assumptions": ["string"]
}`;

const HEALTH_FORECAST_SYSTEM_PROMPT = `You are BodyFuel AI — an expert health analytics engine.

Given a user's profile and their recent daily nutrition summaries, generate a 30-day health forecast.

INSTRUCTIONS
1. Analyse calorie surplus/deficit trends against the user's TDEE to project weight changes.
   - Use the rule: 7,700 kcal surplus/deficit ≈ 1 kg body weight change.
2. Compute an energy trend: "improving", "stable", or "declining" based on energy scores.
3. For each of the 30 forecast days, predict: weight (kg), energy score (0-100), and expected calorie intake.
4. Identify micro-nutrient deficiency alerts if the user's recent averages fall below recommended levels:
   - Iron < 18 mg, Calcium < 1000 mg, Fiber < 25 g, Water < 3000 ml.
   - Severity: "high" if < 50% of recommended, "medium" if 50-75%, "low" if 75-100%.
5. Write a concise, motivating insight_message (2-3 sentences) summarising the outlook.
6. Return ONLY valid JSON — no markdown, no extra text.

OUTPUT JSON SCHEMA
{
  "predicted_weight_kg": number | null,
  "predicted_energy_trend": "improving" | "stable" | "declining",
  "insight_message": "string",
  "forecast_data": [
    { "day": number, "date": "YYYY-MM-DD", "predicted_weight": number, "predicted_energy": number, "predicted_calories": number }
  ],
  "alerts": [
    { "nutrient": "string", "current_avg": number, "recommended": number, "severity": "low" | "medium" | "high", "message": "string" }
  ]
}`;

// ───────── Helpers ─────────

/**
 * Extract the first JSON object or array from Gemini's textual response,
 * which may be wrapped in markdown code fences or other prose.
 */
function extractJSON(raw: string): string {
  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the first { … } or [ … ] block
  const start = raw.search(/[{[]/);
  if (start === -1) return raw.trim();

  const openChar = raw[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;

  for (let i = start; i < raw.length; i++) {
    if (raw[i] === openChar) depth++;
    if (raw[i] === closeChar) depth--;
    if (depth === 0) return raw.slice(start, i + 1);
  }

  return raw.slice(start);
}

/**
 * Call the OpenRouter REST endpoint.
 */
async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      'OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY in your environment.',
    );
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin, // Required by OpenRouter
      'X-Title': 'BodyFuel AI', // Required by OpenRouter
    },
    body: JSON.stringify({
      model: 'google/gemma-4-31b-it:free', // Using extremely fast and stable model (1s latency) to maximize user speed
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      top_p: 0.8,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  const text: string | undefined = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(
      'OpenRouter returned an empty response. The model may have been blocked by safety filters.',
    );
  }

  return text;
}

// ───────── Public API ─────────

/**
 * Parse a free-text food description into structured nutritional data.
 */
export async function parseFoodInput(text: string): Promise<GeminiParsedResponse> {
  const raw = await callOpenRouter(
    FOOD_PARSING_SYSTEM_PROMPT,
    `Parse the following food entry and return the nutritional breakdown:\n\n"${text}"`,
  );

  const json = extractJSON(raw);

  try {
    const parsed = JSON.parse(json) as GeminiParsedResponse;

    // Sanity-check required fields and provide defaults
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      totals: {
        calories: parsed.totals?.calories ?? 0,
        protein_g: parsed.totals?.protein_g ?? 0,
        carbs_g: parsed.totals?.carbs_g ?? 0,
        fats_g: parsed.totals?.fats_g ?? 0,
        fiber_g: parsed.totals?.fiber_g ?? 0,
        sugar_g: parsed.totals?.sugar_g ?? 0,
        iron_mg: parsed.totals?.iron_mg ?? 0,
        calcium_mg: parsed.totals?.calcium_mg ?? 0,
        vitamin_d_mcg: parsed.totals?.vitamin_d_mcg ?? 0,
        sodium_mg: parsed.totals?.sodium_mg ?? 0,
        water_ml: parsed.totals?.water_ml ?? 0,
      },
      confidence: parsed.confidence ?? 0.5,
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
    };
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini food response as JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Generate a 30-day health forecast from recent daily summaries.
 */
export async function generateHealthForecast(
  summaries: DailySummary[],
  profile: UserProfile,
): Promise<HealthForecast> {
  const userPrompt = `
USER PROFILE
• Weight: ${profile.weight_kg ?? 'unknown'} kg
• Height: ${profile.height_cm ?? 'unknown'} cm
• Age: ${profile.age ?? 'unknown'}
• Gender: ${profile.gender ?? 'unknown'}
• Activity level: ${profile.activity_level ?? 'unknown'}
• Goal: ${profile.goal ?? 'maintain'}
• Daily calorie target: ${profile.daily_calorie_target ?? 'not set'} kcal
• Daily protein target: ${profile.daily_protein_target ?? 'not set'} g

RECENT DAILY SUMMARIES (most recent first)
${JSON.stringify(summaries.slice(0, 30), null, 2)}

Generate a 30-day health forecast with weight predictions, energy trend, nutrient alerts, and a motivating insight message.`;

  const raw = await callOpenRouter(HEALTH_FORECAST_SYSTEM_PROMPT, userPrompt);
  const json = extractJSON(raw);

  try {
    const parsed = JSON.parse(json) as {
      predicted_weight_kg: number | null;
      predicted_energy_trend: 'improving' | 'stable' | 'declining';
      insight_message: string;
      forecast_data: ForecastDataPoint[];
      alerts: MicroNutrientAlert[];
    };

    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      user_id: profile.id,
      date_generated: now,
      forecast_days: 30,
      predicted_weight_kg: parsed.predicted_weight_kg ?? null,
      predicted_energy_trend: parsed.predicted_energy_trend ?? 'stable',
      insight_message:
        parsed.insight_message ?? 'Keep tracking your meals for a more accurate forecast.',
      forecast_data: Array.isArray(parsed.forecast_data)
        ? parsed.forecast_data
        : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
    };
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini forecast response as JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
