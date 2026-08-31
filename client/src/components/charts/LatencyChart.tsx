import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Metric } from '../../types';
import { format } from 'date-fns';

interface LatencyChartProps {
  metrics: Metric[];
  slaThreshold?: number;
  height?: number;
}

const TIME_RANGES = [
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

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
          <span className="font-semibold text-text-primary">{entry.value?.toFixed(1)} ms</span>
        </div>
      ))}
    </div>
  );
};

export default function LatencyChart({ metrics, slaThreshold, height = 260 }: LatencyChartProps) {
  const [activeRange, setActiveRange] = useState('24h');

  // Process metrics into chart data — downsample to max 100 points for performance
  const rangeMs: Record<string, number> = {
    '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000,
  };
  const since = Date.now() - rangeMs[activeRange];
  const filtered = metrics.filter((m) => new Date(m.timestamp).getTime() >= since);

  const step = Math.max(1, Math.floor(filtered.length / 80));
  const data = filtered
    .filter((_, i) => i % step === 0)
    .map((m) => {
      const ts = new Date(m.timestamp);
      return {
        time: format(ts, activeRange === '7d' || activeRange === '30d' ? 'MM/dd HH:mm' : 'HH:mm'),
        avg: Math.round(m.latency * 10) / 10,
      };
    });

  // Calculate p95 and p99 from full filtered set
  const sorted = [...filtered].sort((a, b) => a.latency - b.latency);
  const p95Val = sorted[Math.floor(sorted.length * 0.95)]?.latency || 0;
  const p99Val = sorted[Math.floor(sorted.length * 0.99)]?.latency || 0;

  const dataWithPercentiles = data.map((d) => ({
    ...d,
    p95: Math.round(p95Val * 10) / 10,
    p99: Math.round(p99Val * 10) / 10,
  }));

  return (
    <div>
      {/* Range selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TIME_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeRange === r.value
                ? 'bg-iris text-white'
                : 'bg-iris/10 text-text-muted hover:bg-iris/20'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={dataWithPercentiles} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4F9A" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FF4F9A" stopOpacity={0} />
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
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#9BA8C7', paddingTop: '8px' }}
          />
          {slaThreshold && (
            <ReferenceLine
              y={slaThreshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `SLA ${slaThreshold}ms`, fill: '#ef4444', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="avg"
            name="Avg Latency"
            stroke="#6C63FF"
            strokeWidth={2}
            fill="url(#avgGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#6C63FF' }}
          />
          <Area
            type="monotone"
            dataKey="p95"
            name="P95 Latency"
            stroke="#FF4F9A"
            strokeWidth={1.5}
            fill="url(#p95Gradient)"
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, fill: '#FF4F9A' }}
          />
          <Area
            type="monotone"
            dataKey="p99"
            name="P99 Latency"
            stroke="#FF8FC7"
            strokeWidth={1}
            fill="none"
            strokeDasharray="2 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
