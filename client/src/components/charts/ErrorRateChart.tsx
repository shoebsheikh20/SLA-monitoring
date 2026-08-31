import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Metric } from '../../types';
import { format } from 'date-fns';

interface ErrorRateChartProps {
  metrics: Metric[];
  slaThreshold?: number;
  height?: number;
}

export default function ErrorRateChart({ metrics, slaThreshold = 1.0, height = 200 }: ErrorRateChartProps) {
  const step = Math.max(1, Math.floor(metrics.length / 60));
  const data = metrics
    .filter((_, i) => i % step === 0)
    .map((m) => ({
      time: format(new Date(m.timestamp), 'HH:mm'),
      errorRate: Math.round(m.errorRate * 100) / 100,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="errGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9BA8C7', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#9BA8C7', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(11,25,48,0.95)',
            border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: '10px',
            fontSize: '12px',
          }}
          formatter={(v: number) => [`${v.toFixed(2)}%`, 'Error Rate']}
          labelStyle={{ color: '#9BA8C7' }}
        />
        <ReferenceLine
          y={slaThreshold}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: `SLA ${slaThreshold}%`, fill: '#f59e0b', fontSize: 10 }}
        />
        <Area
          type="monotone"
          dataKey="errorRate"
          name="Error Rate"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#errGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#ef4444' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
