interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  healthy:       { label: 'Healthy',       className: 'badge-healthy' },
  'at-risk':     { label: 'At Risk',       className: 'badge-at-risk' },
  degraded:      { label: 'Degraded',      className: 'badge-degraded' },
  down:          { label: 'Down',          className: 'badge-down' },
  breached:      { label: 'Breached',      className: 'badge-breached' },
  critical:      { label: 'Critical',      className: 'badge-critical' },
  high:          { label: 'High',          className: 'badge-critical' },
  medium:        { label: 'Medium',        className: 'badge-warning' },
  low:           { label: 'Low',           className: 'badge-info' },
  warning:       { label: 'Warning',       className: 'badge-warning' },
  info:          { label: 'Info',          className: 'badge-info' },
  open:          { label: 'Open',          className: 'badge-open' },
  investigating: { label: 'Investigating', className: 'badge-investigating' },
  resolved:      { label: 'Resolved',      className: 'badge-resolved' },
};

const dotColors: Record<string, string> = {
  healthy: 'bg-success',
  'at-risk': 'bg-warning',
  degraded: 'bg-orange-400',
  down: 'bg-critical',
  breached: 'bg-critical',
};

export default function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-info' };
  const dotColor = dotColors[status] || 'bg-text-muted';
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : '';

  return (
    <span className={`badge ${config.className} ${sizeClass}`}>
      {showDot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {config.label}
    </span>
  );
}
