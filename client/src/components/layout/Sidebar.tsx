import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Activity,
  Shield,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  Zap,
  ChevronLeft,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/services', label: 'Services', icon: Server },
  { path: '/performance', label: 'Performance', icon: Activity },
  { path: '/sla-monitoring', label: 'SLA Monitor', icon: Shield },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`
        flex-shrink-0 flex flex-col
        transition-all duration-300 ease-in-out
        bg-dark-navy border-r border-glass-border
        fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
        ${collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'}
        ${mobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-glass-border">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-glass-border p-1 flex items-center justify-center shadow-lg backdrop-blur-sm">
          <img src="/logo.png" alt="SLA Pulse Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-base text-text-primary leading-tight whitespace-nowrap">SLA Pulse</div>
            <div className="text-[10px] text-text-muted whitespace-nowrap">Performance Monitor</div>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="ml-auto lg:hidden text-text-muted hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onCloseMobile}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Demo badge */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-iris/10 border border-iris/20 px-3 py-2 text-center">
            <div className="text-xs text-iris-bright font-semibold">DEMO MODE</div>
            <div className="text-[10px] text-text-muted mt-0.5">Simulated monitoring data</div>
          </div>
        </div>
      )}
    </aside>
  );
}
