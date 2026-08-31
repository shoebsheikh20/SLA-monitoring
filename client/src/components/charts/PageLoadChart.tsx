import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Metric } from '../../types';
import { format } from 'date-fns';

interface PageLoadChartProps {
  metrics: Metric[];
  slaThreshold?: number;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-navy/95 border border-iris/20 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-text-muted mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-semibold text-text-primary">{entry.value?.toFixed(2)}s</span>
        </div>
      ))}
    </div>
  );
};

export default function PageLoadChart({ metrics, slaThreshold = 2.0, height = 240 }: PageLoadChartProps) {
  const step = Math.max(1, Math.floor(metrics.length / 80));
  const data = metrics
    .filter((_, i) => i % step === 0)
    .map((m) => ({
      time: format(new Date(m.timestamp), 'HH:mm'),
      avg: Math.round(m.pageLoadTime * 100) / 100,
    }));

  // Compute min/max/p95 from all metrics
  const sorted = [...metrics].sort((a, b) => a.pageLoadTime - b.pageLoadTime);
  const minVal = sorted[0]?.pageLoadTime || 0;
  const maxVal = sorted[sorted.length - 1]?.pageLoadTime || 0;
  const p95Val = sorted[Math.floor(sorted.length * 0.95)]?.pageLoadTime || 0;

  const enriched = data.map((d) => ({
    ...d,
    min: Math.round(minVal * 100) / 100,
    max: Math.round(maxVal * 100) / 100,
    p95: Math.round(p95Val * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={enriched} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B7CFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8B7CFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9BA8C7', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#9BA8C7', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}s`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#9BA8C7', paddingTop: '8px' }} />
        <ReferenceLine
          y={slaThreshold}
          stroke="#ef4444"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: `SLA ${slaThreshold}s`, fill: '#ef4444', fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="avg"
          name="Avg Load"
          stroke="#8B7CFF"
          strokeWidth={2}
          fill="url(#loadGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#8B7CFF' }}
        />
        <Area
          type="monotone"
          dataKey="p95"
          name="P95"
          stroke="#FF4F9A"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="5 3"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
