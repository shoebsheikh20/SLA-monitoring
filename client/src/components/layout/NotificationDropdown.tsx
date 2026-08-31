import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { alertsService } from '../../services/alertsService';
import { Alert } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationDropdownProps {
  onClose: () => void;
}

const severityIcon = {
  critical: <AlertCircle size={14} className="text-critical flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-warning flex-shrink-0" />,
  info: <Info size={14} className="text-iris-bright flex-shrink-0" />,
};

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    alertsService
      .getAlerts({ limit: 10, page: 1 })
      .then(({ alerts: a, unreadCount: u }) => {
        setAlerts(a);
        setUnreadCount(u);
      })
      .catch(() => {});

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    await alertsService.markAllRead().catch(() => {});
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[380px] glass-card-static rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-iris-bright" />
          <span className="text-sm font-semibold text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-pink/20 text-pink text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-text-muted hover:text-iris-bright flex items-center gap-1 transition-colors"
        >
          <CheckCheck size={12} />
          Mark all read
        </button>
      </div>

      {/* Alert list */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-glass-border">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={24} className="text-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-text-muted">No notifications</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`px-4 py-3 transition-colors cursor-pointer hover:bg-iris/5 ${
                !alert.isRead ? 'bg-iris/5' : ''
              }`}
              onClick={() => {
                alertsService.markRead(alert.id).catch(() => {});
                navigate('/alerts');
                onClose();
              }}
            >
              <div className="flex items-start gap-2.5">
                {severityIcon[alert.severity]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-muted uppercase">
                      {alert.service?.name}
                    </span>
                    {!alert.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-pink flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-snug mt-0.5 line-clamp-2">
                    {alert.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-glass-border">
        <button
          onClick={() => { navigate('/alerts'); onClose(); }}
          className="w-full text-xs text-iris-bright hover:text-iris flex items-center justify-center gap-1 transition-colors py-1"
        >
          View all alerts
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}
