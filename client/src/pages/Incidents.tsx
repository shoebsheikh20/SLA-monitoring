import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { incidentsService } from '../services/incidentsService';
import { servicesService } from '../services/servicesService';
import { Incident, Service } from '../types';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { formatDistanceToNow, format } from 'date-fns';

function IncidentForm({
  initial,
  services,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Incident>;
  services: Service[];
  onSubmit: (data: Partial<Incident>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    serviceId: initial?.serviceId || '',
    severity: initial?.severity || 'medium',
    title: initial?.title || '',
    description: initial?.description || '',
    status: initial?.status || 'open',
    notes: initial?.notes || '',
    slaImpact: initial?.slaImpact || 0,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Service *</label>
        <select value={form.serviceId} onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))} required className="input-glass">
          <option value="">Select service...</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Severity</label>
          <select value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as Incident['severity'] }))} className="input-glass">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Incident['status'] }))} className="input-glass">
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Title *</label>
        <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="input-glass" placeholder="Brief incident summary..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-glass resize-none" placeholder="Detailed description of the incident..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Notes / Resolution</label>
        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="input-glass resize-none" placeholder="Investigation notes or resolution steps..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">SLA Impact (%)</label>
        <input type="number" value={form.slaImpact} onChange={(e) => setForm((p) => ({ ...p, slaImpact: parseFloat(e.target.value) }))} step={0.01} min={0} max={100} className="input-glass" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {initial?.id ? 'Update Incident' : 'Create Incident'}
        </button>
      </div>
    </form>
  );
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    const t = (window as unknown as { __toast: { success: (m: string) => void; error: (m: string) => void } }).__toast;
    if (t) t[type](message);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, svcRes] = await Promise.all([
        incidentsService.getIncidents({
          status: filterStatus || undefined,
          severity: filterSeverity || undefined,
          page, limit: 15,
        }),
        servicesService.getServices({ limit: 100 }),
      ]);
      setIncidents(incRes.incidents);
      setTotalPages(incRes.pagination.pages);
      setServices(svcRes.services);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (data: Partial<Incident>) => {
    setActionLoading(true);
    try { await incidentsService.createIncident(data as Parameters<typeof incidentsService.createIncident>[0]); setShowModal(false); fetchData(); showToast('success', 'Incident created'); }
    catch { showToast('error', 'Failed to create incident'); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (data: Partial<Incident>) => {
    if (!editIncident) return;
    setActionLoading(true);
    try { await incidentsService.updateIncident(editIncident.id, data); setEditIncident(null); fetchData(); showToast('success', 'Incident updated'); }
    catch { showToast('error', 'Failed to update incident'); }
    finally { setActionLoading(false); }
  };

  const handleResolve = async (id: string) => {
    try { await incidentsService.updateIncident(id, { status: 'resolved' }); fetchData(); showToast('success', 'Incident resolved'); }
    catch { showToast('error', 'Failed to resolve incident'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try { await incidentsService.deleteIncident(deleteId); setDeleteId(null); fetchData(); showToast('success', 'Incident deleted'); }
    catch { showToast('error', 'Failed to delete incident'); }
    finally { setActionLoading(false); }
  };

  const counts = {
    open: incidents.filter((i) => i.status === 'open').length,
    investigating: incidents.filter((i) => i.status === 'investigating').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Incidents</h1>
          <p className="text-text-muted text-sm mt-0.5">Track and manage service incidents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary py-1.5 px-3 text-xs"><RefreshCw size={13} /></button>
          <button onClick={() => { setEditIncident(null); setShowModal(true); }} className="btn-primary"><Plus size={16} /> New Incident</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-critical/15 flex items-center justify-center"><AlertTriangle size={18} className="text-critical" /></div>
          <div><div className="text-xl font-bold text-critical">{counts.open}</div><div className="text-xs text-text-muted">Open</div></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center"><AlertTriangle size={18} className="text-warning" /></div>
          <div><div className="text-xl font-bold text-warning">{counts.investigating}</div><div className="text-xs text-text-muted">Investigating</div></div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-critical/15 flex items-center justify-center"><AlertTriangle size={18} className="text-critical" /></div>
          <div><div className="text-xl font-bold text-critical">{counts.critical}</div><div className="text-xs text-text-muted">Critical</div></div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard nohover className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input-glass w-auto">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }} className="input-glass w-auto">
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : incidents.length === 0 ? (
        <EmptyState title="No incidents found" description="No incidents match your filters." />
      ) : (
        <GlassCard nohover className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Service</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>SLA Impact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => {
                  const duration = inc.resolvedAt
                    ? formatDistanceToNow(new Date(inc.startedAt), { addSuffix: false })
                    : formatDistanceToNow(new Date(inc.startedAt), { addSuffix: false });
                  return (
                    <tr key={inc.id}>
                      <td>
                        <div className="font-semibold text-text-primary max-w-[200px] truncate">{inc.title}</div>
                        {inc.notes && <div className="text-xs text-text-muted truncate max-w-[200px]">{inc.notes}</div>}
                      </td>
                      <td className="text-sm">{inc.service?.name || '—'}</td>
                      <td><StatusBadge status={inc.severity} size="sm" /></td>
                      <td><StatusBadge status={inc.status} size="sm" /></td>
                      <td className="text-xs text-text-muted">{format(new Date(inc.startedAt), 'MMM dd HH:mm')}</td>
                      <td className="text-xs text-text-muted">{duration}</td>
                      <td className="font-mono text-sm">{inc.slaImpact > 0 ? `-${inc.slaImpact.toFixed(3)}%` : '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {inc.status !== 'resolved' && (
                            <button onClick={() => handleResolve(inc.id)} className="p-1.5 rounded-lg hover:bg-success/10 text-text-muted hover:text-success transition-colors" title="Resolve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => { setEditIncident(inc); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-iris/10 text-text-muted hover:text-iris-bright transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeleteId(inc.id)} className="p-1.5 rounded-lg hover:bg-critical/10 text-text-muted hover:text-critical transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditIncident(null); }} title={editIncident ? 'Update Incident' : 'Create Incident'} size="lg">
        <IncidentForm initial={editIncident || undefined} services={services} onSubmit={editIncident ? handleUpdate : handleCreate} onCancel={() => { setShowModal(false); setEditIncident(null); }} loading={actionLoading} />
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Incident" size="sm">
        <p className="text-text-muted text-sm">Are you sure you want to delete this incident?</p>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={actionLoading} className="btn-danger"><Trash2 size={14} /> Delete</button>
        </div>
      </Modal>
    </div>
  );
}
