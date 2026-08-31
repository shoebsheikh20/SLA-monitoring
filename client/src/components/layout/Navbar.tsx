import { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  sidebarCollapsed: boolean;
}

export default function Navbar({ onToggleSidebar, onToggleMobileSidebar, sidebarCollapsed }: NavbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-4 lg:px-6 bg-dark-navy border-b border-glass-border relative z-20">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-iris/10 transition-colors"
        >
          <Menu size={20} />
        </button>
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-iris/10 transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="hidden md:block">
          <h1 className="text-sm font-semibold text-text-primary">System Performance Monitor</h1>
          <p className="text-xs text-text-muted">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* System status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <div className="w-1.5 h-1.5 rounded-full bg-success status-pulse-healthy" />
          <span className="text-xs font-medium text-success">
            {isOnline ? 'System Operational' : 'Offline'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-btn"
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-iris/10 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-pink rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              !
            </span>
          </button>
          {notifOpen && (
            <NotificationDropdown onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            id="profile-btn"
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-iris/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-iris-pink flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</div>
              <div className="text-[10px] text-text-muted">{user?.role}</div>
            </div>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card-static rounded-xl overflow-hidden shadow-xl z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-glass-border">
                <div className="text-xs font-semibold text-text-primary">{user?.name}</div>
                <div className="text-xs text-text-muted">{user?.email}</div>
              </div>
              <button
                onClick={() => { setProfileOpen(false); window.location.href = '/settings'; }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-iris/10 transition-colors"
              >
                <User size={14} />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-pink hover:bg-pink/10 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
