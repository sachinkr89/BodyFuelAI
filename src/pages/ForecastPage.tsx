import { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, Brain, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useForecastStore } from '../stores/forecastStore';
import TrendLineChart from '../components/charts/TrendLineChart';
import './ForecastPage.css';

export default function ForecastPage() {
  const { profile } = useAuthStore();
  const { currentForecast, isGenerating, generateForecast, fetchLatestForecast } = useForecastStore();

  useEffect(() => {
    if (profile?.id) fetchLatestForecast(profile.id);
  }, [profile?.id]);

  const handleGenerate = async () => {
    if (profile?.id && profile) {
      await generateForecast(profile.id, profile);
    }
  };

  const trendIcon = currentForecast?.predicted_energy_trend === 'improving'
    ? <TrendingUp size={20} /> : currentForecast?.predicted_energy_trend === 'declining'
    ? <TrendingDown size={20} /> : <Minus size={20} />;

  const trendColor = currentForecast?.predicted_energy_trend === 'improving'
    ? '#10b981' : currentForecast?.predicted_energy_trend === 'declining'
    ? '#ef4444' : '#f59e0b';

  const chartData = currentForecast?.forecast_data?.map((d) => ({
    date: `Day ${d.day}`,
    weight: d.predicted_weight,
    energy: d.predicted_energy,
  })) || [];

  return (
    <div className="forecast-page animate-fade-in">
      <div className="forecast-header">
        <div>
          <h1 className="forecast-main-title">
            <Brain size={28} className="gradient-icon" /> Health Forecast
          </h1>
          <p className="forecast-desc">AI-powered 30-day prediction based on your nutrition data</p>
        </div>
        <button className="btn-primary generate-btn" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <><Loader2 size={18} className="animate-spin" /> Generating...</>
          ) : (
            <><RefreshCw size={18} /> {currentForecast ? 'Regenerate' : 'Generate Forecast'}</>
          )}
        </button>
      </div>

      {isGenerating && (
        <div className="forecast-loading">
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
          <div className="forecast-loading-text">
            <Loader2 size={20} className="animate-spin" />
            <span>AI is analyzing your nutrition history...</span>
          </div>
        </div>
      )}

      {!isGenerating && !currentForecast && (
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <Brain size={64} strokeWidth={1} />
          <h3>No forecast generated yet</h3>
          <p>Log at least 3 days of meals, then generate your 30-day health prediction.</p>
        </div>
      )}

      {!isGenerating && currentForecast && (
        <>
          {/* Stats Row */}
          <div className="forecast-stats">
            <div className="forecast-stat-card">
              <span className="forecast-stat-value" style={{ color: '#6366f1' }}>
                {currentForecast.predicted_weight_kg ? `${currentForecast.predicted_weight_kg} kg` : '--'}
              </span>
              <span className="forecast-stat-label">Predicted Weight (30d)</span>
            </div>
            <div className="forecast-stat-card">
              <span className="forecast-stat-value" style={{ color: trendColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {trendIcon} {currentForecast.predicted_energy_trend}
              </span>
              <span className="forecast-stat-label">Energy Trend</span>
            </div>
            <div className="forecast-stat-card">
              <span className="forecast-stat-value" style={{ color: '#06b6d4' }}>
                {currentForecast.forecast_days}d
              </span>
              <span className="forecast-stat-label">Forecast Range</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="forecast-chart-section">
              <TrendLineChart
                data={chartData}
                lines={[
                  { dataKey: 'weight', color: '#6366f1', name: 'Weight (kg)' },
                  { dataKey: 'energy', color: '#10b981', name: 'Energy Score' },
                ]}
                xAxisKey="date"
                title="30-Day Prediction"
              />
            </div>
          )}

          {/* AI Insight */}
          <div className="forecast-insight">
            <Brain size={20} style={{ color: '#6366f1', flexShrink: 0 }} />
            <div>
              <strong>AI Insight</strong>
              <p>{currentForecast.insight_message}</p>
            </div>
          </div>

          {/* Micro-nutrient Alerts */}
          {currentForecast.alerts && currentForecast.alerts.length > 0 && (
            <div className="forecast-alerts-section">
              <h3 className="forecast-alerts-title">⚠️ Nutrient Alerts</h3>
              <div className="forecast-alerts">
                {currentForecast.alerts.map((alert, i) => (
                  <div key={i} className={`forecast-alert ${alert.severity}`}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{alert.nutrient}</strong>
                      <p>{alert.message}</p>
                      <span className="forecast-alert-values">
                        Current avg: {alert.current_avg} | Recommended: {alert.recommended}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
