import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Server, Activity, Clock, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { servicesService } from '../services/servicesService';
import { metricsService } from '../services/metricsService';
import { Service, Metric, MetricAggregates } from '../types';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LatencyChart from '../components/charts/LatencyChart';
import PageLoadChart from '../components/charts/PageLoadChart';
import UptimeChart from '../components/charts/UptimeChart';
import ErrorRateChart from '../components/charts/ErrorRateChart';

function StatRow({ label, value, unit = '', color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className={`text-sm font-semibold font-mono ${color || 'text-text-primary'}`}>
        {value}{unit}
      </span>
    </div>
  );
}

function SLABar({ label, current, limit, unit }: { label: string; current: number; limit: number; unit: string }) {
  const pct = Math.min(100, (current / limit) * 100);
  const isOk = current <= limit;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <span className="text-text-muted">{label}</span>
        <span className={`font-semibold ${isOk ? 'text-success' : 'text-critical'}`}>
          {current.toFixed(unit === 'ms' ? 0 : unit === 's' ? 2 : 2)}{unit}
          <span className="text-text-muted font-normal"> / {limit}{unit} SLA</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-glass-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isOk ? 'bg-iris' : 'bg-critical'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [aggregates, setAggregates] = useState<MetricAggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('24h');

  const fetchData = async () => {
    if (!id) return;
    try {
      const [svcRes, metRes] = await Promise.all([
        servicesService.getService(id),
        metricsService.getServiceMetrics(id, range),
      ]);
      setService(svcRes.service as Service);
      setMetrics(metRes.metrics);
      setAggregates(metRes.aggregates);
    } catch {
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, range]);

  if (loading) {
    return <div className="flex justify-center py-32"><LoadingSpinner size="lg" label="Loading service..." /></div>;
  }

  if (!service) return null;

  const latest = metrics[metrics.length - 1];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={() => navigate('/services')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-iris-bright transition-colors mt-1">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{service.name}</h1>
            <StatusBadge status={service.status} />
          </div>
          <p className="text-text-muted text-sm mt-0.5">{service.description}</p>
        </div>
        <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Info + current metrics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Service Info */}
        <GlassCard nohover>
          <div className="flex items-center gap-2 mb-4">
            <Server size={16} className="text-iris-bright" />
            <h3 className="text-sm font-semibold text-text-primary">Service Info</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Globe size={14} className="text-text-muted mt-0.5" />
              <a href={service.url} target="_blank" rel="noopener noreferrer" className="text-iris-bright hover:underline break-all text-xs">{service.url}</a>
            </div>
            <StatRow label="Environment" value={service.environment} />
            <StatRow label="Region" value={service.region} />
            <StatRow label="SLA Target" value={`${service.slaTarget}%`} />
            <StatRow label="Latency SLA" value={`${service.latencyThreshold}ms`} />
            <StatRow label="Page Load SLA" value={`${service.pageLoadThreshold}s`} />
            <StatRow label="Error Rate SLA" value={`${service.errorRateThreshold}%`} />
          </div>
        </GlassCard>

        {/* Current Metrics */}
        <GlassCard nohover>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-iris-bright" />
            <h3 className="text-sm font-semibold text-text-primary">Current Metrics</h3>
          </div>
          <div className="space-y-3">
            <StatRow
              label="Current Latency"
              value={`${latest?.latency.toFixed(0) || '—'}ms`}
              color={latest && latest.latency > service.latencyThreshold ? 'text-critical' : 'text-success'}
            />
            <StatRow label="Avg Latency" value={`${aggregates?.avgLatency.toFixed(0) || '—'}ms`} />
            <StatRow label="P95 Latency" value={`${aggregates?.p95Latency.toFixed(0) || '—'}ms`} />
            <StatRow label="P99 Latency" value={`${aggregates?.p99Latency.toFixed(0) || '—'}ms`} />
            <StatRow label="Avg Page Load" value={`${aggregates?.avgPageLoad.toFixed(2) || '—'}s`} />
            <StatRow label="Avg Uptime" value={`${aggregates?.avgUptime.toFixed(3) || '—'}%`} />
            <StatRow label="Avg Error Rate" value={`${aggregates?.avgErrorRate.toFixed(2) || '—'}%`} />
          </div>
        </GlassCard>

        {/* SLA Status */}
        <GlassCard nohover>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-iris-bright" />
            <h3 className="text-sm font-semibold text-text-primary">SLA Threshold Status</h3>
          </div>
          <div className="space-y-4">
            {latest ? (
              <>
                <SLABar label="Response Latency" current={latest.latency} limit={service.latencyThreshold} unit="ms" />
                <SLABar label="Page Load Time" current={latest.pageLoadTime} limit={service.pageLoadThreshold} unit="s" />
                <SLABar label="Error Rate" current={latest.errorRate} limit={service.errorRateThreshold} unit="%" />
                <div className="mt-4 text-center">
                  <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-block ${
                    service.status === 'healthy' ? 'bg-success/15 text-success' :
                    service.status === 'at-risk' ? 'bg-warning/15 text-warning' :
                    'bg-critical/15 text-critical'
                  }`}>
                    {service.status === 'healthy' ? '✓ All SLAs Met' :
                     service.status === 'at-risk' ? '⚠ Approaching SLA' :
                     '✗ SLA Breached'}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-text-muted text-sm text-center py-4">No metrics yet</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Range Selector */}
      <div className="flex gap-1.5">
        {['1h', '6h', '24h', '7d', '30d'].map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === r ? 'bg-iris text-white' : 'bg-iris/10 text-text-muted hover:bg-iris/20'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard nohover>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-iris-bright" />
            <h3 className="text-sm font-semibold text-text-primary">Response Latency</h3>
          </div>
          <LatencyChart metrics={metrics} slaThreshold={service.latencyThreshold} height={220} />
        </GlassCard>

        <GlassCard nohover>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Page Load Time</h3>
          <PageLoadChart metrics={metrics} slaThreshold={service.pageLoadThreshold} height={220} />
        </GlassCard>

        <GlassCard nohover>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Uptime History</h3>
          <UptimeChart metrics={metrics} slaTarget={service.slaTarget} height={200} />
        </GlassCard>

        <GlassCard nohover>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-warning" />
            <h3 className="text-sm font-semibold text-text-primary">Error Rate</h3>
          </div>
          <ErrorRateChart metrics={metrics} slaThreshold={service.errorRateThreshold} height={200} />
        </GlassCard>
      </div>
    </div>
  );
}
