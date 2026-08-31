import { useEffect, useState, useCallback } from 'react';
import { Shield, RefreshCw, Edit, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { slaService } from '../services/slaService';
import { SLAStatus, SLAConfig } from '../types';
import GlassCard from '../components/ui/GlassCard';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import usePolling from '../hooks/usePolling';

function SLAConfigModal({ sla, onClose, onSave }: { sla: SLAStatus; onClose: () => void; onSave: (data: Partial<SLAConfig>) => Promise<void> }) {
  const [form, setForm] = useState({
    availabilitySLA: sla.slaTarget,
    responseTimeSLA: sla.latencyLimit,
    pageLoadSLA: sla.pageLoadLimit,
    errorRateSLA: sla.errorRateLimit,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.availabilitySLA < 0 || form.availabilitySLA > 100) e.availability = 'Must be 0–100%';
    if (form.responseTimeSLA < 1) e.latency = 'Must be ≥ 1ms';
    if (form.pageLoadSLA < 0.1) e.pageLoad = 'Must be ≥ 0.1s';
    if (form.errorRateSLA < 0 || form.errorRateSLA > 100) e.errorRate = 'Must be 0–100%';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Configure SLA — ${sla.serviceName}`} size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
            Save Config
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Availability SLA (%)</label>
          <input type="number" value={form.availabilitySLA} onChange={(e) => setForm((p) => ({ ...p, availabilitySLA: parseFloat(e.target.value) }))} step={0.01} min={0} max={100} className="input-glass" />
          {errors.availability && <p className="text-xs text-critical mt-1">{errors.availability}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Response Time SLA (ms)</label>
          <input type="number" value={form.responseTimeSLA} onChange={(e) => setForm((p) => ({ ...p, responseTimeSLA: parseInt(e.target.value) }))} min={1} className="input-glass" />
          {errors.latency && <p className="text-xs text-critical mt-1">{errors.latency}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Page Load SLA (s)</label>
          <input type="number" value={form.pageLoadSLA} onChange={(e) => setForm((p) => ({ ...p, pageLoadSLA: parseFloat(e.target.value) }))} step={0.1} min={0.1} className="input-glass" />
          {errors.pageLoad && <p className="text-xs text-critical mt-1">{errors.pageLoad}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Error Rate SLA (%)</label>
          <input type="number" value={form.errorRateSLA} onChange={(e) => setForm((p) => ({ ...p, errorRateSLA: parseFloat(e.target.value) }))} step={0.1} min={0} max={100} className="input-glass" />
          {errors.errorRate && <p className="text-xs text-critical mt-1">{errors.errorRate}</p>}
        </div>
      </div>
    </Modal>
  );
}

export default function SLAMonitoring() {
  const [slaData, setSlaData] = useState<SLAStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editSla, setEditSla] = useState<SLAStatus | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await slaService.getSLAStatus();
      setSlaData(res.slaData);
    } catch {
      console.error('SLA fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 30000);

  const handleSaveSLA = async (data: Partial<SLAConfig>) => {
    if (!editSla) return;
    await slaService.updateSLAConfig(editSla.serviceId, data);
    setEditSla(null);
    fetchData();
    const t = (window as unknown as { __toast: { success: (m: string) => void } }).__toast;
    if (t) t.success('SLA configuration updated');
  };

  const filtered = slaData.filter((s) => {
    const matchSearch = s.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = {
    healthy: slaData.filter((s) => s.status === 'healthy').length,
    atRisk: slaData.filter((s) => s.status === 'at-risk').length,
    breached: slaData.filter((s) => s.status === 'breached').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">SLA Monitoring</h1>
          <p className="text-text-muted text-sm mt-0.5">Service Level Agreement compliance dashboard</p>
        </div>
        <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="text-center">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center mx-auto mb-2">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-success">{summary.healthy}</div>
          <div className="text-xs text-text-muted mt-0.5">Healthy</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div className="text-2xl font-bold text-warning">{summary.atRisk}</div>
          <div className="text-xs text-text-muted mt-0.5">At Risk</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="w-10 h-10 rounded-xl bg-critical/15 flex items-center justify-center mx-auto mb-2">
            <XCircle size={20} className="text-critical" />
          </div>
          <div className="text-2xl font-bold text-critical">{summary.breached}</div>
          <div className="text-xs text-text-muted mt-0.5">Breached</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard nohover className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search services..." className="flex-1 min-w-[200px]" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-glass w-auto">
          <option value="">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="at-risk">At Risk</option>
          <option value="breached">Breached</option>
        </select>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <GlassCard nohover className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>SLA Target</th>
                  <th>Uptime</th>
                  <th>Latency</th>
                  <th>Page Load</th>
                  <th>Error Rate</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                  <th>Config</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sla) => (
                  <tr key={sla.serviceId}>
                    <td>
                      <div className="font-semibold text-text-primary">{sla.serviceName}</div>
                      <div className="text-xs text-text-muted">{sla.environment} · {sla.region}</div>
                    </td>
                    <td className="font-mono text-sm">{sla.slaTarget}%</td>
                    <td>
                      <div className={`font-mono text-sm font-semibold ${sla.uptimeOk ? 'text-success' : 'text-critical'}`}>
                        {sla.currentUptime.toFixed(3)}%
                      </div>
                    </td>
                    <td>
                      <div className={`font-mono text-sm font-semibold ${sla.latencyOk ? 'text-success' : 'text-critical'}`}>
                        {sla.currentLatency.toFixed(0)}ms
                      </div>
                      <div className="text-xs text-text-muted">SLA: {sla.latencyLimit}ms</div>
                    </td>
                    <td>
                      <div className={`font-mono text-sm ${sla.pageLoadOk ? 'text-success' : 'text-critical'}`}>
                        {sla.currentPageLoad.toFixed(2)}s
                      </div>
                      <div className="text-xs text-text-muted">SLA: {sla.pageLoadLimit}s</div>
                    </td>
                    <td>
                      <div className={`font-mono text-sm ${sla.errorRateOk ? 'text-success' : 'text-critical'}`}>
                        {sla.currentErrorRate.toFixed(2)}%
                      </div>
                    </td>
                    <td><StatusBadge status={sla.status} size="sm" /></td>
                    <td className="text-xs text-text-muted">
                      {sla.lastChecked ? new Date(sla.lastChecked).toLocaleTimeString() : '—'}
                    </td>
                    <td>
                      <button onClick={() => setEditSla(sla)} className="p-1.5 rounded-lg hover:bg-iris/10 text-text-muted hover:text-iris-bright transition-colors" title="Configure SLA">
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {editSla && (
        <SLAConfigModal sla={editSla} onClose={() => setEditSla(null)} onSave={handleSaveSLA} />
      )}
    </div>
  );
}
