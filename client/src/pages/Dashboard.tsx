import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Server,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { metricsService } from '../services/metricsService';
import { DashboardData, Metric } from '../types';
import MetricCard from '../components/ui/MetricCard';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import SLAProgress from '../components/ui/SLAProgress';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LatencyChart from '../components/charts/LatencyChart';
import PageLoadChart from '../components/charts/PageLoadChart';
import usePolling from '../hooks/usePolling';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [dashData, metricsData] = await Promise.all([
        dashboardService.getDashboard(),
        metricsService.getMetrics({ range: '24h', limit: 200 }),
      ]);
      setData(dashData);
      setMetrics(metricsData.metrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 30000);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (!data) return null;

  const { kpis, services, incidents, serviceHealth } = data;
  const uptimeDiff = (kpis.uptime - kpis.uptimeSlaTarget).toFixed(3);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Overview</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-full">
            <Wifi size={12} />
            Live monitoring
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Uptime */}
        <MetricCard
          title="Overall Uptime"
          value={kpis.uptime.toFixed(2)}
          unit="%"
          subtitle={`Target: ${kpis.uptimeSlaTarget}% SLA`}
          trend={parseFloat(uptimeDiff) >= 0 ? 'up' : 'down'}
          trendValue={`${parseFloat(uptimeDiff) >= 0 ? '+' : ''}${uptimeDiff}% from SLA`}
          icon={<Activity size={18} className="text-iris-bright" />}
          statusColor={kpis.uptime >= kpis.uptimeSlaTarget ? 'success' : 'critical'}
        >
          <div className="mt-3 flex items-center justify-between">
            <span className={`badge ${kpis.uptime >= kpis.uptimeSlaTarget ? 'badge-healthy' : 'badge-breached'}`}>
              {kpis.uptime >= kpis.uptimeSlaTarget ? '✓ SLA HEALTHY' : '✗ SLA BREACHED'}
            </span>
          </div>
        </MetricCard>

        {/* Avg Latency */}
        <MetricCard
          title="Avg Response Time"
          value={kpis.avgLatency.toFixed(0)}
          unit="ms"
          trend="down"
          trendValue="↓ real-time"
          icon={<Clock size={18} className="text-iris-bright" />}
          statusColor={kpis.avgLatency < 300 ? 'success' : kpis.avgLatency < 500 ? 'warning' : 'critical'}
        />

        {/* Page Load */}
        <MetricCard
          title="Avg Page Load Time"
          value={kpis.avgPageLoad.toFixed(2)}
          unit="s"
          trend={kpis.avgPageLoad < 2 ? 'up' : 'down'}
          trendValue={kpis.avgPageLoad < 2 ? 'Within SLA' : 'Above SLA'}
          icon={<TrendingUp size={18} className="text-iris-bright" />}
          statusColor={kpis.avgPageLoad < 2 ? 'success' : 'warning'}
        />

        {/* SLA Compliance */}
        <GlassCard className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="metric-label">SLA Compliance</div>
            <Shield size={18} className="text-iris-bright" />
          </div>
          <div className="flex items-center gap-4">
            <SLAProgress
              current={kpis.slaCompliance}
              target={99}
              size="md"
            />
            <div>
              <div className={`metric-value ${kpis.slaCompliance >= 99 ? 'text-success' : 'text-warning'}`}>
                {kpis.slaCompliance.toFixed(2)}%
              </div>
              <div className="text-xs text-text-muted mt-1">
                {kpis.slaCompliance >= 99 ? 'Within SLA' : 'Review required'}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Active Incidents */}
        <GlassCard className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="metric-label">Active Incidents</div>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="metric-value text-warning mb-3">{incidents.total}</div>
          <div className="space-y-1.5">
            {incidents.critical > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-critical">● Critical</span>
                <span className="font-semibold text-text-primary">{incidents.critical}</span>
              </div>
            )}
            {incidents.high > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-warning">● High</span>
                <span className="font-semibold text-text-primary">{incidents.high}</span>
              </div>
            )}
            {incidents.medium > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-iris-bright">● Medium</span>
                <span className="font-semibold text-text-primary">{incidents.medium}</span>
              </div>
            )}
            {incidents.total === 0 && (
              <p className="text-xs text-success">No active incidents</p>
            )}
          </div>
        </GlassCard>

        {/* Monitored Services */}
        <GlassCard className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="metric-label">Monitored Services</div>
            <Server size={18} className="text-iris-bright" />
          </div>
          <div className="metric-value text-iris-bright mb-3">{services.total}</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-success">● Healthy</span>
              <span className="font-semibold text-text-primary">{services.healthy}</span>
            </div>
            {services.degraded > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-warning">● Degraded</span>
                <span className="font-semibold text-text-primary">{services.degraded}</span>
              </div>
            )}
            {services.down > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-critical">● Down</span>
                <span className="font-semibold text-text-primary">{services.down}</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard nohover className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Response Latency</h3>
              <p className="text-xs text-text-muted">Avg · P95 · P99 across all services</p>
            </div>
            <div className="badge badge-info">LIVE</div>
          </div>
          <LatencyChart metrics={metrics} height={240} />
        </GlassCard>

        <GlassCard nohover className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Page Load Time</h3>
              <p className="text-xs text-text-muted">Average · P95 · SLA threshold</p>
            </div>
            <span className="text-xs text-text-muted">SLA: 2.0s</span>
          </div>
          <PageLoadChart metrics={metrics} slaThreshold={2.0} height={240} />
        </GlassCard>
      </div>

      {/* Service Health */}
      <GlassCard nohover>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Service Health Overview</h3>
          <button
            onClick={() => navigate('/services')}
            className="text-xs text-iris-bright hover:text-iris transition-colors"
          >
            View all services →
          </button>
        </div>
        <div className="space-y-2">
          {serviceHealth.slice(0, 8).map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-iris/5 transition-colors cursor-pointer group"
              onClick={() => navigate(`/services/${svc.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    svc.status === 'healthy' ? 'bg-success status-pulse-healthy' :
                    svc.status === 'at-risk' ? 'bg-warning' :
                    svc.status === 'degraded' ? 'bg-orange-400' : 'bg-critical status-pulse-critical'
                  }`}
                />
                <span className="text-sm font-medium text-text-primary truncate group-hover:text-iris-bright transition-colors">
                  {svc.name}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xs text-text-muted hidden sm:block">
                  {svc.latency.toFixed(0)}ms
                </span>
                <span className="text-xs text-text-muted hidden md:block">
                  {svc.uptime.toFixed(2)}% uptime
                </span>
                <StatusBadge status={svc.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
