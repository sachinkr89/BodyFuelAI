import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { MACRO_COLORS } from '../../utils/constants';
import './Charts.css';

interface MacroBarChartProps {
  data: { name: string; protein: number; carbs: number; fats: number }[];
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="custom-tooltip">
      <p className="custom-tooltip-label">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="custom-tooltip-row">
          <span className="custom-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}: </span>
          <strong>{entry.value}g</strong>
        </div>
      ))}
    </div>
  );
}

export default function MacroBarChart({ data, title }: MacroBarChartProps) {
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
          <Bar dataKey="protein" fill={MACRO_COLORS.protein} radius={[4, 4, 0, 0]} />
          <Bar dataKey="carbs" fill={MACRO_COLORS.carbs} radius={[4, 4, 0, 0]} />
          <Bar dataKey="fats" fill={MACRO_COLORS.fats} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
