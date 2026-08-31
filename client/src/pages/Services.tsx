import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Server } from 'lucide-react';
import { servicesService } from '../services/servicesService';
import { Service } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import SearchBar from '../components/ui/SearchBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ENVIRONMENTS = ['', 'production', 'staging', 'development'];
const STATUSES = ['', 'healthy', 'degraded', 'at-risk', 'down'];

const SERVICE_PRESETS = [
  {
    name: 'Stripe Payment Gateway',
    description: 'Global online payment processing & subscription billing API',
    url: 'https://api.stripe.com/v1/charges',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 250,
    pageLoadThreshold: 1.2,
    errorRateThreshold: 0.05,
  },
  {
    name: 'AWS S3 Object Storage',
    description: 'Scalable cloud storage for media assets and backups',
    url: 'https://s3.us-east-1.amazonaws.com',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 120,
    pageLoadThreshold: 0.8,
    errorRateThreshold: 0.01,
  },
  {
    name: 'Auth0 Identity Service',
    description: 'Enterprise OAuth2 / OIDC authentication & user sessions',
    url: 'https://auth.slapulse.auth0.com/oauth/token',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 180,
    pageLoadThreshold: 1.0,
    errorRateThreshold: 0.02,
  },
  {
    name: 'OpenAI GPT-4 API',
    description: 'Generative AI LLM inference & vector embedding pipeline',
    url: 'https://api.openai.com/v1/chat/completions',
    environment: 'production',
    region: 'us-west-2',
    slaTarget: 99.5,
    latencyThreshold: 1200,
    pageLoadThreshold: 3.5,
    errorRateThreshold: 1.5,
  },
  {
    name: 'SendGrid Email Engine',
    description: 'High-volume transactional email delivery & webhook dispatcher',
    url: 'https://api.sendgrid.com/v3/mail/send',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.9,
    latencyThreshold: 350,
    pageLoadThreshold: 2.0,
    errorRateThreshold: 0.2,
  },
  {
    name: 'Algolia Search Index',
    description: 'Ultra-fast real-world product & content search index engine',
    url: 'https://slapulse-dsn.algolia.net/1/indexes',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 80,
    pageLoadThreshold: 0.6,
    errorRateThreshold: 0.02,
  },
  {
    name: 'Twilio SMS & Voice Gateway',
    description: 'Multi-channel SMS, 2FA verification & voice dispatching',
    url: 'https://api.twilio.com/2010-04-01/Accounts',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.95,
    latencyThreshold: 300,
    pageLoadThreshold: 1.8,
    errorRateThreshold: 0.1,
  },
  {
    name: 'Cloudflare Edge CDN',
    description: 'Global Anycast CDN caching, DDoS mitigation & WAF edge security',
    url: 'https://api.cloudflare.com/client/v4/zones',
    environment: 'production',
    region: 'global',
    slaTarget: 99.999,
    latencyThreshold: 45,
    pageLoadThreshold: 0.4,
    errorRateThreshold: 0.01,
  },
  {
    name: 'MongoDB Atlas Cluster',
    description: 'Fully managed distributed NoSQL document database cluster',
    url: 'https://cloud.mongodb.com/api/atlas/v1.0',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.95,
    latencyThreshold: 75,
    pageLoadThreshold: 0.5,
    errorRateThreshold: 0.05,
  },
  {
    name: 'Redis Cloud Cache',
    description: 'High-speed in-memory session cache & API rate limiter',
    url: 'https://redis.cloud/api/v1/clusters',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.99,
    latencyThreshold: 20,
    pageLoadThreshold: 0.2,
    errorRateThreshold: 0.01,
  },
  {
    name: 'Datadog Telemetry Pipeline',
    description: 'Cloud-scale APM metrics, distributed trace & log ingestion',
    url: 'https://http-intake.logs.datadoghq.com/v1/input',
    environment: 'production',
    region: 'us-east-1',
    slaTarget: 99.9,
    latencyThreshold: 400,
    pageLoadThreshold: 2.0,
    errorRateThreshold: 0.3,
  },
  {
    name: 'GitHub Webhook Relay',
    description: 'CI/CD automation & automated code deployment webhooks',
    url: 'https://api.github.com/repos/slapulse/app/hooks',
    environment: 'production',
    region: 'us-west-2',
    slaTarget: 99.9,
    latencyThreshold: 280,
    pageLoadThreshold: 1.4,
    errorRateThreshold: 0.1,
  },
];

function ServiceForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Service>;
  onSubmit: (data: Partial<Service>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    url: initial?.url || '',
    environment: initial?.environment || 'production',
    region: initial?.region || 'us-east-1',
    slaTarget: initial?.slaTarget || 99.9,
    latencyThreshold: initial?.latencyThreshold || 500,
    pageLoadThreshold: initial?.pageLoadThreshold || 2.0,
    errorRateThreshold: initial?.errorRateThreshold || 1.0,
    monitoringEnabled: initial?.monitoringEnabled ?? true,
  });

  const f = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  const applyPreset = (presetName: string) => {
    const p = SERVICE_PRESETS.find((item) => item.name === presetName);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      name: p.name,
      description: p.description,
      url: p.url,
      environment: p.environment,
      region: p.region,
      slaTarget: p.slaTarget,
      latencyThreshold: p.latencyThreshold,
      pageLoadThreshold: p.pageLoadThreshold,
      errorRateThreshold: p.errorRateThreshold,
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {!initial?.id && (
        <div className="bg-iris/10 border border-iris/20 p-3 rounded-xl mb-3">
          <label className="block text-xs font-semibold text-iris-bright mb-1.5 uppercase tracking-wide">
            ⚡ Quick Fill from Real-World Service Preset
          </label>
          <select
            onChange={(e) => applyPreset(e.target.value)}
            defaultValue=""
            className="input-glass text-sm text-text-primary bg-background-card"
          >
            <option value="" disabled>-- Select a Real-World Service Template --</option>
            {SERVICE_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.region})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Service Name *</label>
          <input type="text" value={form.name} onChange={(e) => f('name', e.target.value)} required className="input-glass" placeholder="e.g. Stripe Payment Gateway" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">URL / Endpoint *</label>
          <input type="url" value={form.url} onChange={(e) => f('url', e.target.value)} required className="input-glass" placeholder="https://api.stripe.com/v1" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Description</label>
        <textarea value={form.description} onChange={(e) => f('description', e.target.value)} rows={2} className="input-glass resize-none" placeholder="Brief description of this service..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Environment</label>
          <select value={form.environment} onChange={(e) => f('environment', e.target.value)} className="input-glass">
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Region</label>
          <input type="text" value={form.region} onChange={(e) => f('region', e.target.value)} className="input-glass" placeholder="us-east-1" />
        </div>
      </div>
      <div className="border-t border-glass-border pt-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">SLA Thresholds</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Availability SLA (%)</label>
            <input type="number" value={form.slaTarget} onChange={(e) => f('slaTarget', parseFloat(e.target.value))} min={0} max={100} step={0.01} className="input-glass" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Latency Threshold (ms)</label>
            <input type="number" value={form.latencyThreshold} onChange={(e) => f('latencyThreshold', parseInt(e.target.value))} min={1} className="input-glass" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Page Load SLA (s)</label>
            <input type="number" value={form.pageLoadThreshold} onChange={(e) => f('pageLoadThreshold', parseFloat(e.target.value))} min={0.1} step={0.1} className="input-glass" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Error Rate SLA (%)</label>
            <input type="number" value={form.errorRateThreshold} onChange={(e) => f('errorRateThreshold', parseFloat(e.target.value))} min={0} max={100} step={0.1} className="input-glass" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="monitoring-enabled" checked={form.monitoringEnabled} onChange={(e) => f('monitoringEnabled', e.target.checked)} className="accent-iris w-4 h-4" />
        <label htmlFor="monitoring-enabled" className="text-sm text-text-muted">Enable monitoring</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {initial?.id ? 'Save Changes' : 'Create Service'}
        </button>
      </div>
    </form>
  );
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEnv, setFilterEnv] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesService.getServices({
        search: search || undefined,
        status: filterStatus || undefined,
        environment: filterEnv || undefined,
        page,
        limit: 15,
      });
      setServices(res.services);
      setTotalPages(res.pagination.pages);
    } catch {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterEnv, page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleCreate = async (data: Partial<Service>) => {
    setActionLoading(true);
    try {
      await servicesService.createService(data);
      setShowModal(false);
      fetchServices();
      showToast('success', 'Service created successfully');
    } catch {
      showToast('error', 'Failed to create service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<Service>) => {
    if (!editService) return;
    setActionLoading(true);
    try {
      await servicesService.updateService(editService.id, data);
      setEditService(null);
      fetchServices();
      showToast('success', 'Service updated successfully');
    } catch {
      showToast('error', 'Failed to update service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await servicesService.deleteService(deleteId);
      setDeleteId(null);
      fetchServices();
      showToast('success', 'Service deleted');
    } catch {
      showToast('error', 'Failed to delete service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMonitoring = async (svc: Service) => {
    try {
      await servicesService.toggleMonitoring(svc.id, !svc.monitoringEnabled);
      fetchServices();
    } catch {
      showToast('error', 'Failed to toggle monitoring');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const toast = (window as unknown as { __toast: { success: (m: string) => void; error: (m: string) => void } }).__toast;
    if (toast) toast[type](message);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Services</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage and monitor your services</p>
        </div>
        <button onClick={() => { setEditService(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Filters */}
      <GlassCard nohover className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search services..." className="flex-1 min-w-[200px]" />
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input-glass w-auto">
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <select value={filterEnv} onChange={(e) => { setFilterEnv(e.target.value); setPage(1); }} className="input-glass w-auto">
          {ENVIRONMENTS.map((e) => <option key={e} value={e}>{e || 'All Environments'}</option>)}
        </select>
      </GlassCard>

      {error && <div className="text-critical text-sm p-3 bg-critical/10 border border-critical/20 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : services.length === 0 ? (
        <EmptyState
          title="No services found"
          description="Add your first service or adjust your search filters."
          action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={14} /> Add Service</button>}
        />
      ) : (
        <GlassCard nohover className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Uptime</th>
                  <th>SLA Target</th>
                  <th>Monitoring</th>
                  <th>Last Checked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id}>
                    <td>
                      <div>
                        <div className="font-semibold text-text-primary">{svc.name}</div>
                        <div className="text-xs text-text-muted truncate max-w-[200px]">{svc.url}</div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-text-muted capitalize">{svc.environment}</span>
                      <div className="text-xs text-text-muted/60">{svc.region}</div>
                    </td>
                    <td><StatusBadge status={svc.status} size="sm" /></td>
                    <td className="font-mono text-sm">{svc.latestMetric ? `${svc.latestMetric.latency.toFixed(0)}ms` : '—'}</td>
                    <td className="font-mono text-sm">{svc.latestMetric ? `${svc.latestMetric.uptime.toFixed(2)}%` : '—'}</td>
                    <td className="text-sm">{svc.slaTarget}%</td>
                    <td>
                      <button onClick={() => handleToggleMonitoring(svc)} className={`flex items-center gap-1 text-xs transition-colors ${svc.monitoringEnabled ? 'text-success' : 'text-text-muted'}`}>
                        {svc.monitoringEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        <span className="hidden sm:block">{svc.monitoringEnabled ? 'On' : 'Off'}</span>
                      </button>
                    </td>
                    <td className="text-xs text-text-muted">
                      {svc.latestMetric ? formatDistanceToNow(new Date(svc.latestMetric.timestamp), { addSuffix: true }) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/services/${svc.id}`)} className="p-1.5 rounded-lg hover:bg-iris/10 text-text-muted hover:text-iris-bright transition-colors" title="View details">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => { setEditService(svc); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-iris/10 text-text-muted hover:text-iris-bright transition-colors" title="Edit">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => setDeleteId(svc.id)} className="p-1.5 rounded-lg hover:bg-critical/10 text-text-muted hover:text-critical transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-glass-border">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">← Prev</button>
              <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </GlassCard>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditService(null); }}
        title={editService ? `Edit ${editService.name}` : 'Add New Service'}
        size="lg"
      >
        <ServiceForm
          initial={editService || undefined}
          onSubmit={editService ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setEditService(null); }}
          loading={actionLoading}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Service" size="sm">
        <p className="text-text-muted text-sm mb-2">Are you sure you want to delete this service? This will remove all associated metrics, incidents, and alerts.</p>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={actionLoading} className="btn-danger">
            {actionLoading ? <div className="w-4 h-4 border-2 border-critical/30 border-t-critical rounded-full animate-spin" /> : <Trash2 size={14} />}
            Delete Service
          </button>
        </div>
      </Modal>
    </div>
  );
}
