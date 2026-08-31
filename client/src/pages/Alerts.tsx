import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, RefreshCw, AlertCircle, AlertTriangle, Info, Filter } from 'lucide-react';
import { alertsService } from '../services/alertsService';
import { Alert } from '../types';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import usePolling from '../hooks/usePolling';
import { formatDistanceToNow } from 'date-fns';

const severityIcon = {
  critical: <AlertCircle size={16} className="text-critical flex-shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning flex-shrink-0" />,
  info: <Info size={16} className="text-iris-bright flex-shrink-0" />,
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const showToast = (type: 'success' | 'error', message: string) => {
    const t = (window as unknown as { __toast: { success: (m: string) => void; error: (m: string) => void } }).__toast;
    if (t) t[type](message);
  };

  const fetchData = useCallback(async () => {
    try {
      const params: { severity?: string; isRead?: boolean; page: number; limit: number } = { page, limit: 20 };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterRead === 'read') params.isRead = true;
      if (filterRead === 'unread') params.isRead = false;
      const res = await alertsService.getAlerts(params);
      setAlerts(res.alerts);
      setUnreadCount(res.unreadCount);
      setTotalPages(res.pagination.pages);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterRead, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 30000);

  const handleMarkRead = async (id: string) => {
    await alertsService.markRead(id).catch(() => {});
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await alertsService.markAllRead().catch(() => {});
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
    showToast('success', 'All alerts marked as read');
  };

  const handleDelete = async (id: string) => {
    await alertsService.deleteAlert(id).catch(() => showToast('error', 'Failed to delete alert'));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    showToast('success', 'Alert deleted');
  };

  const handleClear = async () => {
    await alertsService.clearAlerts({ isRead: true }).catch(() => showToast('error', 'Failed to clear alerts'));
    fetchData();
    showToast('success', 'Read alerts cleared');
  };

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Alert Center</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-pink/20 text-pink text-xs font-bold rounded-full border border-pink/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-0.5">Monitor and manage system alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs"><RefreshCw size={13} /></button>
          <button onClick={handleMarkAllRead} className="btn-secondary py-1.5 px-3 text-xs"><CheckCheck size={13} /> Mark all read</button>
          <button onClick={handleClear} className="btn-danger py-1.5 px-3 text-xs"><Trash2 size={13} /> Clear read</button>
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-3">
          <AlertCircle size={20} className="text-critical" />
          <div><div className="text-xl font-bold text-critical">{counts.critical}</div><div className="text-xs text-text-muted">Critical</div></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-warning" />
          <div><div className="text-xl font-bold text-warning">{counts.warning}</div><div className="text-xs text-text-muted">Warning</div></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Info size={20} className="text-iris-bright" />
          <div><div className="text-xl font-bold text-iris-bright">{counts.info}</div><div className="text-xs text-text-muted">Info</div></div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard nohover className="flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-text-muted" />
        <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }} className="input-glass w-auto">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select value={filterRead} onChange={(e) => { setFilterRead(e.target.value); setPage(1); }} className="input-glass w-auto">
          <option value="">All Alerts</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <EmptyState title="No alerts" description="No alerts match your filters. Alerts are generated automatically by the monitoring system." icon={<Bell size={28} className="text-iris-bright" />} />
      ) : (
        <GlassCard nohover className="p-0 overflow-hidden">
          <div className="divide-y divide-glass-border">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-iris/5 ${!alert.isRead ? 'bg-iris/5' : ''}`}
              >
                {severityIcon[alert.severity]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={alert.severity} size="sm" showDot={false} />
                    <span className="text-xs text-text-muted">{alert.service?.name}</span>
                    {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-pink" />}
                  </div>
                  <p className="text-sm text-text-primary">{alert.message}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!alert.isRead && (
                    <button onClick={() => handleMarkRead(alert.id)} className="p-1.5 rounded-lg hover:bg-iris/10 text-text-muted hover:text-iris-bright transition-colors" title="Mark as read">
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(alert.id)} className="p-1.5 rounded-lg hover:bg-critical/10 text-text-muted hover:text-critical transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-glass-border">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Prev</button>
              <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
