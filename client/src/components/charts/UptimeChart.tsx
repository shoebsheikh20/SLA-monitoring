import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Metric } from '../../types';
import { format } from 'date-fns';

interface UptimeChartProps {
  metrics: Metric[];
  slaTarget?: number;
  height?: number;
}

export default function UptimeChart({ metrics, slaTarget = 99.9, height = 200 }: UptimeChartProps) {
  const step = Math.max(1, Math.floor(metrics.length / 60));
  const data = metrics
    .filter((_, i) => i % step === 0)
    .map((m) => ({
      time: format(new Date(m.timestamp), 'MM/dd HH:mm'),
      uptime: Math.round(m.uptime * 1000) / 1000,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9BA8C7', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[Math.max(99, slaTarget - 1), 100]}
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
          formatter={(v: number) => [`${v.toFixed(3)}%`, 'Uptime']}
          labelStyle={{ color: '#9BA8C7' }}
        />
        <ReferenceLine
          y={slaTarget}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: `SLA ${slaTarget}%`, fill: '#ef4444', fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="uptime"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
