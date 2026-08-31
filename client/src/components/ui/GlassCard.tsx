import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  nohover?: boolean;
}

export default function GlassCard({ children, className = '', onClick, nohover }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`${nohover ? 'glass-card-static' : 'glass-card'} p-5 ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </div>
  );
}
