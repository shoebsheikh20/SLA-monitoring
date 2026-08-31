interface SLAProgressProps {
  current: number;
  target: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showValues?: boolean;
}

export default function SLAProgress({
  current,
  target,
  label,
  size = 'md',
  showValues = true,
}: SLAProgressProps) {
  const radius = size === 'lg' ? 52 : size === 'md' ? 40 : 28;
  const strokeWidth = size === 'lg' ? 7 : size === 'md' ? 5.5 : 4;
  const circumference = 2 * Math.PI * radius;
  const svgSize = (radius + strokeWidth) * 2;

  const percentage = Math.min(100, Math.max(0, current));
  const offset = circumference - (percentage / 100) * circumference;

  const isHealthy = current >= target;
  const isAtRisk = current >= target - 0.5 && !isHealthy;

  const strokeColor = isHealthy
    ? '#22c55e'
    : isAtRisk
    ? '#f59e0b'
    : '#ef4444';

  const textSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="rotate-[-90deg]"
        >
          <defs>
            <linearGradient id="iris-pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C63FF" />
              <stop offset="100%" stopColor="#FF4F9A" />
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(108, 99, 255, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        {showValues && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-text-primary ${textSize}`}>
              {current.toFixed(current >= 99 ? 2 : 1)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-text-muted text-center">{label}</span>
      )}
    </div>
  );
}
