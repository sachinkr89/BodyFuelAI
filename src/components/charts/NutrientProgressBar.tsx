import { useEffect, useState } from 'react';
import './Charts.css';

interface NutrientProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
  icon?: React.ReactNode;
}

export default function NutrientProgressBar({ label, current, target, color, unit = 'g', icon }: NutrientProgressBarProps) {
  const [animated, setAnimated] = useState(false);
  const percentage = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const isOver = percentage > 120;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="nutrient-progress">
      <div className="nutrient-progress-header">
        <div className="nutrient-progress-label">
          {icon && <span className="nutrient-icon">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="nutrient-progress-values">
          <strong style={{ color: isOver ? 'var(--color-warning)' : 'var(--text-primary)' }}>
            {Math.round(current)}
          </strong>
          <span className="nutrient-progress-sep">/</span>
          <span>{Math.round(target)} {unit}</span>
        </span>
      </div>
      <div className="nutrient-progress-bar">
        <div
          className="nutrient-progress-fill"
          style={{
            width: animated ? `${Math.min(percentage, 100)}%` : '0%',
            background: isOver ? 'var(--color-warning)' : color,
          }}
        />
      </div>
    </div>
  );
}
