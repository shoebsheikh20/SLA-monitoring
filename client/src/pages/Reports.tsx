import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, FileText, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { Report } from '../types';
import GlassCard from '../components/ui/GlassCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

export default function Reports() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState('7d');

  const showToast = (type: 'success' | 'error', message: string) => {
    const t = (window as unknown as { __toast: { success: (m: string) => void; error: (m: string) => void } }).__toast;
    if (t) t[type](message);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsService.getReport({ range });
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsService.exportCSV({ range });
      showToast('success', 'Report exported successfully');
    } catch {
      showToast('error', 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-text-muted text-sm mt-0.5">SLA compliance and performance reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs"><RefreshCw size={13} /></button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary py-2 px-4 text-sm">
            {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={15} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Range Selector */}
      <GlassCard nohover className="flex items-center gap-4 flex-wrap">
        <FileText size={16} className="text-iris-bright" />
        <span className="text-sm text-text-muted">Report period:</span>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r.value ? 'bg-iris text-white' : 'bg-iris/10 text-text-muted hover:bg-iris/20'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {report && (
          <span className="text-xs text-text-muted ml-auto">
            {new Date(report.period.from).toLocaleDateString()} — {new Date(report.period.to).toLocaleDateString()}
          </span>
        )}
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlassCard className="text-center">
              <div className="w-10 h-10 rounded-xl bg-iris/15 flex items-center justify-center mx-auto mb-2"><Shield size={20} className="text-iris-bright" /></div>
              <div className="text-2xl font-bold gradient-text">{report.summary.overallSLACompliance.toFixed(2)}%</div>
              <div className="text-xs text-text-muted mt-1">Overall SLA Compliance</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center mx-auto mb-2"><TrendingUp size={20} className="text-success" /></div>
              <div className="text-2xl font-bold text-success">{report.summary.avgUptime.toFixed(3)}%</div>
              <div className="text-xs text-text-muted mt-1">Average Uptime</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="w-10 h-10 rounded-xl bg-iris/15 flex items-center justify-center mx-auto mb-2"><TrendingUp size={20} className="text-iris-bright" /></div>
              <div className="text-2xl font-bold text-iris-bright">{report.summary.avgLatency.toFixed(0)}ms</div>
              <div className="text-xs text-text-muted mt-1">Average Latency</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center mx-auto mb-2"><AlertTriangle size={20} className="text-warning" /></div>
              <div className="text-2xl font-bold text-warning">{report.summary.totalIncidents}</div>
              <div className="text-xs text-text-muted mt-1">Total Incidents ({report.summary.resolvedIncidents} resolved)</div>
            </GlassCard>
          </div>

          {/* Service breakdown table */}
          <GlassCard nohover className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-glass-border">
              <h3 className="text-sm font-semibold text-text-primary">Service SLA Report</h3>
              <p className="text-xs text-text-muted mt-0.5">{report.period.range} · {report.serviceReports.length} services</p>
            </div>
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>SLA Target</th>
                    <th>SLA Compliance</th>
                    <th>Avg Latency</th>
                    <th>Avg Page Load</th>
                    <th>Avg Uptime</th>
                    <th>Avg Error Rate</th>
                    <th>Incidents</th>
                    <th>SLA Breaches</th>
                  </tr>
                </thead>
                <tbody>
                  {report.serviceReports.map((row) => (
                    <tr key={row.serviceId}>
                      <td>
                        <div className="font-semibold text-text-primary">{row.serviceName}</div>
                        <div className="text-xs text-text-muted">{row.environment}</div>
                      </td>
                      <td className="font-mono text-sm">{row.slaTarget}%</td>
                      <td>
                        <div className={`font-mono text-sm font-bold ${row.slaCompliance >= row.slaTarget ? 'text-success' : 'text-critical'}`}>
                          {row.slaCompliance.toFixed(2)}%
                        </div>
                      </td>
                      <td className="font-mono text-sm">{row.avgLatency.toFixed(0)}ms</td>
                      <td className="font-mono text-sm">{row.avgPageLoad.toFixed(2)}s</td>
                      <td className="font-mono text-sm">{row.avgUptime.toFixed(3)}%</td>
                      <td className="font-mono text-sm">{row.avgErrorRate.toFixed(2)}%</td>
                      <td className="text-sm">{row.incidentCount}</td>
                      <td className={`font-semibold text-sm ${row.slaBreaches > 0 ? 'text-critical' : 'text-success'}`}>
                        {row.slaBreaches}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : null}
    </div>
  );
}
