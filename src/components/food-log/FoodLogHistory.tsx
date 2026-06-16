import { Trash2, UtensilsCrossed } from 'lucide-react';
import { MEAL_TYPES, MACRO_COLORS } from '../../utils/constants';
import { getRelativeTime } from '../../utils/helpers';
import type { FoodLog } from '../../types';
import './FoodLog.css';

interface FoodLogHistoryProps {
  logs: FoodLog[];
  onDelete: (id: string) => void;
}

export default function FoodLogHistory({ logs, onDelete }: FoodLogHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <UtensilsCrossed size={48} strokeWidth={1} />
        <h3>No meals logged today</h3>
        <p>Start by describing what you ate above</p>
      </div>
    );
  }

  // Group by meal type
  const grouped = MEAL_TYPES.reduce((acc, meal) => {
    const items = logs.filter((l) => l.meal_type === meal.value);
    if (items.length > 0) acc.push({ ...meal, items });
    return acc;
  }, [] as (typeof MEAL_TYPES[number] & { items: FoodLog[] })[]);

  const getLogMacros = (log: FoodLog) => {
    if (!log.parsed_macros || !Array.isArray(log.parsed_macros)) return { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
    return log.parsed_macros.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein_g: acc.protein_g + (m.protein_g || 0),
        carbs_g: acc.carbs_g + (m.carbs_g || 0),
        fats_g: acc.fats_g + (m.fats_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
    );
  };

  const totalCalories = logs.reduce((sum, l) => sum + getLogMacros(l).calories, 0);
  const totalProtein = logs.reduce((sum, l) => sum + getLogMacros(l).protein_g, 0);
  const totalCarbs = logs.reduce((sum, l) => sum + getLogMacros(l).carbs_g, 0);
  const totalFats = logs.reduce((sum, l) => sum + getLogMacros(l).fats_g, 0);

  return (
    <div className="log-history">
      {grouped.map((group) => (
        <div key={group.value} className="log-group">
          <h4 className="log-group-title">
            <span>{group.emoji}</span> {group.label}
          </h4>
          {group.items.map((log, i) => (
            <div key={log.id} className="log-item animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="log-item-content">
                <p className="log-item-text">{log.raw_text}</p>
                <div className="log-item-meta">
                  {log.parsed_macros && log.parsed_macros.length > 0 && (() => {
                    const m = getLogMacros(log);
                    return (
                      <div className="log-item-macros">
                        <span style={{ color: MACRO_COLORS.calories }}>{Math.round(m.calories)} kcal</span>
                        <span style={{ color: MACRO_COLORS.protein }}>{Math.round(m.protein_g)}g P</span>
                        <span style={{ color: MACRO_COLORS.carbs }}>{Math.round(m.carbs_g)}g C</span>
                        <span style={{ color: MACRO_COLORS.fats }}>{Math.round(m.fats_g)}g F</span>
                      </div>
                    );
                  })()}
                  <span className="log-item-time">{getRelativeTime(log.logged_at)}</span>
                </div>
              </div>
              <button className="log-item-delete" onClick={() => onDelete(log.id)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Running total */}
      <div className="log-running-total">
        <h4>Today's Total</h4>
        <div className="log-total-grid">
          <div className="log-total-item">
            <span className="log-total-value" style={{ color: MACRO_COLORS.calories }}>{Math.round(totalCalories)}</span>
            <span className="log-total-label">kcal</span>
          </div>
          <div className="log-total-item">
            <span className="log-total-value" style={{ color: MACRO_COLORS.protein }}>{Math.round(totalProtein)}g</span>
            <span className="log-total-label">Protein</span>
          </div>
          <div className="log-total-item">
            <span className="log-total-value" style={{ color: MACRO_COLORS.carbs }}>{Math.round(totalCarbs)}g</span>
            <span className="log-total-label">Carbs</span>
          </div>
          <div className="log-total-item">
            <span className="log-total-value" style={{ color: MACRO_COLORS.fats }}>{Math.round(totalFats)}g</span>
            <span className="log-total-label">Fats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
