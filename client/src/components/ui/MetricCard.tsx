import { ReactNode } from 'react';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
  statusColor?: 'success' | 'warning' | 'critical' | 'iris';
  children?: ReactNode;
  className?: string;
}

const statusColors = {
  success: 'text-success',
  warning: 'text-warning',
  critical: 'text-critical',
  iris: 'text-iris-bright',
};

const trendColors = {
  up: 'text-success',
  down: 'text-critical',
  neutral: 'text-text-muted',
};

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendValue,
  icon,
  statusColor = 'iris',
  children,
  className = '',
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <GlassCard className={`animate-fade-in ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="metric-label">{title}</div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-iris/10 border border-iris/20 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5 mb-2">
        <span className={`metric-value ${statusColors[statusColor]}`}>{value}</span>
        {unit && <span className="text-text-muted text-base mb-0.5">{unit}</span>}
      </div>

      {subtitle && (
        <p className="text-xs text-text-muted mb-2">{subtitle}</p>
      )}

      {trend && trendValue && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
          <TrendIcon size={13} />
          <span>{trendValue}</span>
        </div>
      )}

      {children}
    </GlassCard>
  );
}
