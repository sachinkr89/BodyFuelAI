import './Charts.css';

interface CalorieGaugeProps {
  consumed: number;
  target: number;
  size?: number;
}

export default function CalorieGauge({ consumed, target, size = 180 }: CalorieGaugeProps) {
  const percentage = target > 0 ? Math.min((consumed / target) * 100, 120) : 0;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const totalArc = 270;
  const circumference = (totalArc / 360) * 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const rotation = -135;

  const getColor = () => {
    if (percentage > 110) return '#f43f5e';
    if (percentage > 100) return '#f59e0b';
    if (percentage > 75) return '#10b981';
    return '#06b6d4';
  };

  const remaining = Math.max(target - consumed, 0);

  return (
    <div className="calorie-gauge-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor={getColor()} />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${2 * Math.PI * radius - circumference}`}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          className="calorie-gauge-arc"
        />
      </svg>
      <div className="calorie-gauge-text">
        <span className="calorie-gauge-value">{Math.round(consumed)}</span>
        <span className="calorie-gauge-unit">kcal</span>
        <span className="calorie-gauge-remaining">{remaining > 0 ? `${Math.round(remaining)} left` : 'Target reached!'}</span>
      </div>
    </div>
  );
}
