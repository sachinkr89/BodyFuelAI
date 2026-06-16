import { useMemo } from 'react';
import { ENERGY_SCORE_LABELS } from '../../utils/constants';
import './Charts.css';

interface EnergyRingChartProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function EnergyRingChart({ score, size = 200, strokeWidth = 14 }: EnergyRingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  const scoreInfo = useMemo(() => {
    return ENERGY_SCORE_LABELS.find((s) => score >= s.min && score <= s.max) || ENERGY_SCORE_LABELS[0];
  }, [score]);

  return (
    <div className="energy-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="energy-ring-svg">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={scoreInfo.color} />
            <stop offset="100%" stopColor={scoreInfo.color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="energy-ring-progress"
          style={{ '--ring-offset': circumference, '--ring-target': offset } as React.CSSProperties}
        />
      </svg>
      <div className="energy-ring-center">
        <span className="energy-ring-score" style={{ color: scoreInfo.color }}>{Math.round(score)}</span>
        <span className="energy-ring-label" style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
      </div>
    </div>
  );
}
