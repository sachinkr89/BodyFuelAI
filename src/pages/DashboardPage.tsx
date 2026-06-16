import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Lightbulb, Flame, Droplets, Leaf, Dumbbell, Pill } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { getGreeting, formatDate } from '../utils/helpers';
import { MACRO_COLORS, DAILY_RECOMMENDED } from '../utils/constants';
import EnergyRingChart from '../components/charts/EnergyRingChart';
import CalorieGauge from '../components/charts/CalorieGauge';
import NutrientProgressBar from '../components/charts/NutrientProgressBar';
import MacroBarChart from '../components/charts/MacroBarChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import './DashboardPage.css';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { todaysSummary, fetchTodaysSummary } = useFoodLogStore();
  const { weeklyData, fetchWeeklyData } = useDashboardStore();

  useEffect(() => {
    if (profile?.id) {
      fetchTodaysSummary(profile.id);
      fetchWeeklyData(profile.id);
    }
  }, [profile?.id]);

  const isGym = profile?.body_mode === 'gym';
  const greeting = getGreeting();
  const today = formatDate(new Date().toISOString());
  const name = profile?.display_name?.split(' ')[0] || 'there';

  const summary = todaysSummary || {
    total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fats_g: 0,
    total_fiber_g: 0, total_sugar_g: 0, total_iron_mg: 0, total_calcium_mg: 0,
    total_water_ml: 0, meal_count: 0, energy_score: 0,
  };

  const calorieTarget = profile?.daily_calorie_target || 2000;
  const proteinTarget = profile?.daily_protein_target || 120;

  // Build weekly chart data
  const weeklyChartData = weeklyData.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    calories: Math.round(d.total_calories),
    protein: Math.round(d.total_protein_g),
  }));

  const macroChartData = [
    { name: 'Today', protein: Math.round(summary.total_protein_g), carbs: Math.round(summary.total_carbs_g), fats: Math.round(summary.total_fats_g) },
  ];

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <h1>{greeting}, <span className="gradient-text">{name}</span>! 👋</h1>
        <p>{today}</p>
      </div>

      {!isGym ? (
        /* ===== GENERAL / WELLNESS DASHBOARD ===== */
        <div className="dashboard-content">
          {/* Energy Score + Calories */}
          <div className="dashboard-grid energy-section">
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Energy Score</h3>
              <EnergyRingChart score={summary.energy_score || 0} size={180} />
            </div>
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Calorie Intake</h3>
              <CalorieGauge consumed={summary.total_calories} target={calorieTarget} size={180} />
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="dashboard-card delay-1">
            <h3 className="dashboard-card-title">Today's Nutrition</h3>
            <div className="nutrient-list">
              <NutrientProgressBar label="Protein" current={summary.total_protein_g} target={proteinTarget} color={MACRO_COLORS.protein} />
              <NutrientProgressBar label="Carbs" current={summary.total_carbs_g} target={calorieTarget * 0.5 / 4} color={MACRO_COLORS.carbs} />
              <NutrientProgressBar label="Fats" current={summary.total_fats_g} target={calorieTarget * 0.3 / 9} color={MACRO_COLORS.fats} />
              <NutrientProgressBar label="Fiber" current={summary.total_fiber_g} target={DAILY_RECOMMENDED.fiber_g} color={MACRO_COLORS.fiber} icon={<Leaf size={14} />} />
              <NutrientProgressBar label="Water" current={summary.total_water_ml} target={DAILY_RECOMMENDED.water_ml} color="#3b82f6" unit="ml" icon={<Droplets size={14} />} />
            </div>
          </div>

          {/* Insight Banner */}
          <div className="insight-banner delay-2">
            <Lightbulb size={20} className="insight-icon" />
            <div>
              <strong>AI Insight</strong>
              <p>
                {summary.total_fiber_g < 10
                  ? 'Your fiber intake is low today. Try adding more veggies, dal, or fruits to your meals! 🥗'
                  : summary.total_protein_g < proteinTarget * 0.5
                  ? 'You\'re behind on protein. Consider adding paneer, eggs, or a protein shake. 💪'
                  : 'You\'re doing great today! Keep up the balanced nutrition. 🌟'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ===== GYM / ATHLETE DASHBOARD ===== */
        <div className="dashboard-content">
          {/* Calorie Gauge + Deficit/Surplus */}
          <div className="dashboard-grid energy-section">
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Calorie Tracker</h3>
              <CalorieGauge consumed={summary.total_calories} target={calorieTarget} size={180} />
              <div className="deficit-indicator" style={{ marginTop: 16, textAlign: 'center' }}>
                {summary.total_calories < calorieTarget ? (
                  <span className="badge badge-info">Deficit: {Math.round(calorieTarget - summary.total_calories)} kcal</span>
                ) : (
                  <span className="badge badge-success">Surplus: +{Math.round(summary.total_calories - calorieTarget)} kcal</span>
                )}
              </div>
            </div>
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Protein Focus</h3>
              <div className="protein-focus-number">
                <span className="gradient-text">{Math.round(summary.total_protein_g)}</span>
                <span className="protein-target">/ {proteinTarget}g</span>
              </div>
              <NutrientProgressBar label="Daily Target" current={summary.total_protein_g} target={proteinTarget} color={MACRO_COLORS.protein} />
            </div>
          </div>

          {/* Macro Chart */}
          <div className="dashboard-card delay-1">
            <MacroBarChart data={macroChartData} title="Macro Distribution" />
          </div>

          {/* Weekly Trend */}
          {weeklyChartData.length > 1 && (
            <div className="dashboard-card delay-2">
              <TrendLineChart
                data={weeklyChartData}
                lines={[
                  { dataKey: 'calories', color: MACRO_COLORS.calories, name: 'Calories' },
                  { dataKey: 'protein', color: MACRO_COLORS.protein, name: 'Protein (g)' },
                ]}
                xAxisKey="date"
                title="Weekly Trends"
              />
            </div>
          )}

          {/* Supplement Reminders */}
          <div className="dashboard-grid supplement-row delay-3">
            <div className="supplement-card">
              <Pill size={20} style={{ color: '#818cf8' }} />
              <div>
                <strong>Creatine</strong>
                <p>5g daily</p>
              </div>
            </div>
            <div className="supplement-card">
              <Dumbbell size={20} style={{ color: '#06b6d4' }} />
              <div>
                <strong>Whey Protein</strong>
                <p>Post-workout</p>
              </div>
            </div>
            <div className="supplement-card">
              <Flame size={20} style={{ color: '#f97316' }} />
              <div>
                <strong>Pre-Workout</strong>
                <p>Before gym</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <Link to="/log" className="quick-add-btn" title="Log Food">
        <Plus size={28} />
      </Link>
    </div>
  );
}
