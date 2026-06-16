import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Charts.css';

interface TrendLineChartProps {
  data: any[];
  lines: { dataKey: string; color: string; name: string }[];
  xAxisKey?: string;
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
          <strong>{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function TrendLineChart({ data, lines, xAxisKey = 'date', title }: TrendLineChartProps) {
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey={xAxisKey} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Tooltip content={<CustomTooltip />} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'rgba(255,255,255,0.3)' }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
