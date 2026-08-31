import { useEffect, useState, useCallback } from 'react';
import { metricsService } from '../services/metricsService';
import { servicesService } from '../services/servicesService';
import { Metric, Service } from '../types';
import GlassCard from '../components/ui/GlassCard';
import LatencyChart from '../components/charts/LatencyChart';
import PageLoadChart from '../components/charts/PageLoadChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Activity, RefreshCw } from 'lucide-react';
import usePolling from '../hooks/usePolling';

export default function Performance() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, servicesRes] = await Promise.all([
        metricsService.getMetrics({ serviceId: selectedService || undefined, range, limit: 300 }),
        servicesService.getServices({ limit: 100 }),
      ]);
      setMetrics(metricsRes.metrics);
      setServices(servicesRes.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedService, range]);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 30000);

  // Compute aggregates from current metrics
  const latencies = metrics.map((m) => m.latency).sort((a, b) => a - b);
  const pageTimes = metrics.map((m) => m.pageLoadTime).sort((a, b) => a - b);

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const percentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p)] || arr[arr.length - 1] || 0;

  const stats = {
    avgLatency: avg(latencies),
    p95Latency: percentile(latencies, 0.95),
    p99Latency: percentile(latencies, 0.99),
    maxLatency: latencies[latencies.length - 1] || 0,
    avgPageLoad: avg(pageTimes),
    p95PageLoad: percentile(pageTimes, 0.95),
  };

  const selectedSvc = services.find((s) => s.id === selectedService);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Performance Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">Deep-dive into latency, throughput, and page load</p>
        </div>
        <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <GlassCard nohover className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="input-glass w-auto min-w-[200px]"
        >
          <option value="">All Services</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['1h', '6h', '24h', '7d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === r ? 'bg-iris text-white' : 'bg-iris/10 text-text-muted hover:bg-iris/20'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Avg Latency', value: `${stats.avgLatency.toFixed(0)}ms`, color: 'text-iris-bright' },
              { label: 'P95 Latency', value: `${stats.p95Latency.toFixed(0)}ms`, color: 'text-pink-light' },
              { label: 'P99 Latency', value: `${stats.p99Latency.toFixed(0)}ms`, color: 'text-pink' },
              { label: 'Max Latency', value: `${stats.maxLatency.toFixed(0)}ms`, color: stats.maxLatency > (selectedSvc?.latencyThreshold || 500) ? 'text-critical' : 'text-text-primary' },
              { label: 'Avg Page Load', value: `${stats.avgPageLoad.toFixed(2)}s`, color: stats.avgPageLoad > 2 ? 'text-warning' : 'text-success' },
              { label: 'P95 Page Load', value: `${stats.p95PageLoad.toFixed(2)}s`, color: 'text-text-primary' },
            ].map((stat) => (
              <GlassCard key={stat.label} className="text-center">
                <div className="metric-label mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              </GlassCard>
            ))}
          </div>

          {/* Latency Chart */}
          <GlassCard nohover>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-iris-bright" />
              <h3 className="text-sm font-semibold text-text-primary">Response Latency</h3>
              <span className="badge badge-info ml-auto text-[10px]">{metrics.length} data points</span>
            </div>
            <LatencyChart
              metrics={metrics}
              slaThreshold={selectedSvc?.latencyThreshold}
              height={280}
            />
          </GlassCard>

          {/* Page Load Chart */}
          <GlassCard nohover>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Page Load Time</h3>
            <PageLoadChart
              metrics={metrics}
              slaThreshold={selectedSvc?.pageLoadThreshold || 2.0}
              height={260}
            />
          </GlassCard>
        </>
      )}
    </div>
  );
}
