import { useState, useEffect } from 'react';
import { workflowAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { mockWorkflows } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import { Page, Badge, Empty, Drawer, DetailRow, Pagination, SearchInput, Select, Modal } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const STATUS_BADGE = { pending: 'yellow', in_progress: 'blue', review: 'violet', blocked: 'red', completed: 'green', cancelled: 'slate' };
const PRIORITY_BADGE = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' };
const SLA_BADGE = { on_track: 'green', at_risk: 'orange', breached: 'red' };
const TYPE_COLORS = {
  trend_planning: '#6366f1', design: '#8b5cf6', sourcing: '#06b6d4',
  sampling: '#f59e0b', production: '#22c55e', allocation: '#ec4899',
  selling: '#f97316', markdown: '#ef4444', return: '#64748b', replenishment: '#0ea5e9',
};
const TYPES = ['all', 'trend_planning', 'design', 'sourcing', 'sampling', 'production', 'allocation', 'selling', 'markdown', 'return', 'replenishment'];
const typeLabel = t => t === 'all' ? 'All Types' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function WorkflowQueuesPage() {
  const [workflows, setWorkflows] = useState([]);
  const [sla, setSla] = useState({ onTrack: 12, atRisk: 4, breached: 2 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWf, setNewWf] = useState({ title: '', type: 'trend_planning', priority: 'medium', slaStatus: 'on_track', dueDate: '' });
  const [filters, setFilters] = useState({ type: 'all', status: '', priority: '', slaStatus: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const { user } = useAuth();

  useEffect(() => { load(); loadSla(); }, [filters, pagination.page]);

  const load = async () => {
    setLoading(true);
    try {
      const p = { page: pagination.page, limit: pagination.limit };
      if (filters.type !== 'all') p.type = filters.type;
      if (filters.status) p.status = filters.status;
      if (filters.priority) p.priority = filters.priority;
      if (filters.slaStatus) p.slaStatus = filters.slaStatus;
      if (filters.search) p.search = filters.search;
      const r = await workflowAPI.getWorkflows(p);
      if (r.data.success) { setWorkflows(r.data.data.workflows.length ? r.data.data.workflows : mockWorkflows); setPagination(prev => ({ ...prev, ...r.data.data.pagination })); }
      else setWorkflows(mockWorkflows);
    } catch { setWorkflows(mockWorkflows); } finally { setLoading(false); }
  };

  const loadSla = async () => {
    try { const r = await workflowAPI.getSLAStats(); if (r.data.success) setSla(r.data.data); } catch { /* use default */ }
  };

  const handleCreate = async () => {
    if (!newWf.title.trim()) return toast.error('Title is required.');
    if (!newWf.dueDate) return toast.error('Due date is required.');
    setCreating(true);
    try {
      await workflowAPI.createWorkflow({
        ...newWf,
        ownerId: user.userId,
        status: 'pending',
        slaDeadline: newWf.dueDate,
      });
      toast.success('Workflow created successfully!');
      setShowCreate(false);
      setNewWf({ title: '', type: 'trend_planning', priority: 'medium', slaStatus: 'on_track', dueDate: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workflow.');
    } finally {
      setCreating(false);
    }
  };

  const display = workflows.filter(w => !filters.search || w.title?.toLowerCase().includes(filters.search.toLowerCase()));

  return (
    <Page>
      {/* SLA summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'On Track', value: sla.onTrack, bg: 'linear-gradient(135deg,#22c55e,#86efac)', icon: '✅' },
          { label: 'At Risk', value: sla.atRisk, bg: 'linear-gradient(135deg,#f97316,#fdba74)', icon: '⚠️' },
          { label: 'SLA Breached', value: sla.breached, bg: 'linear-gradient(135deg,#ef4444,#fca5a5)', icon: '🚨' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div><div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{s.value}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search workflows…" style={{ flex: '1 1 200px', minWidth: 0 }} />
        <Select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}</Select>
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['pending', 'in_progress', 'review', 'blocked', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </Select>
        <Select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Select>
        <Select value={filters.slaStatus} onChange={e => setFilters(f => ({ ...f, slaStatus: e.target.value }))}>
          <option value="">All SLA</option>
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="breached">Breached</option>
        </Select>
        <button onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgb(79 70 229 / .3)' }}>
          <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Workflow
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {['Workflow', 'Type', 'Owner', 'Priority', 'Status', 'SLA', 'Due Date', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div></td></tr>
              ) : display.length === 0 ? (
                <tr><td colSpan={8}><Empty message="No workflows found." /></td></tr>
              ) : display.map(w => (
                <tr key={w.queueId}>
                  <td style={{ maxWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 6, height: 36, borderRadius: 99, background: TYPE_COLORS[w.type] || '#94a3b8', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{w.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{typeLabel(w.type)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${TYPE_COLORS[w.type]}18`, color: TYPE_COLORS[w.type] || '#64748b', fontWeight: 600 }}>{typeLabel(w.type)}</span></td>
                  <td><div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{w.ownerName || w.ownerId || '—'}</div></td>
                  <td><Badge variant={PRIORITY_BADGE[w.priority] || 'slate'}>{w.priority?.charAt(0).toUpperCase() + w.priority?.slice(1)}</Badge></td>
                  <td><Badge variant={STATUS_BADGE[w.status] || 'slate'}>{w.status?.replace(/_/g, ' ')}</Badge></td>
                  <td><Badge variant={SLA_BADGE[w.slaStatus] || 'slate'} dot>{w.slaStatus?.replace(/_/g, ' ')}</Badge></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(w.dueDate)}</td>
                  <td>
                    <button onClick={() => setSelected(w)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, border: 'none', background: '#eef2ff', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pagination.page} pages={pagination.pages} total={display.length} limit={pagination.limit}
          onPrev={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          onNext={() => setPagination(p => ({ ...p, page: p.page + 1 }))} />
      </div>

      {/* Create Workflow Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setNewWf({ title: '', type: 'trend_planning', priority: 'medium', slaStatus: 'on_track', dueDate: '' }); }} title="New Workflow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={newWf.title} onChange={e => setNewWf(w => ({ ...w, title: e.target.value }))} placeholder="e.g. SS26 Sourcing — Supplier Shortlist" className="input" />
          </div>

          {/* Type + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Type</label>
              <select value={newWf.type} onChange={e => setNewWf(w => ({ ...w, type: e.target.value }))} className="input">
                {TYPES.filter(t => t !== 'all').map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Priority</label>
              <select value={newWf.priority} onChange={e => setNewWf(w => ({ ...w, priority: e.target.value }))} className="input">
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Due date + SLA row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Due Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={newWf.dueDate} onChange={e => setNewWf(w => ({ ...w, dueDate: e.target.value }))} className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>SLA Status</label>
              <select value={newWf.slaStatus} onChange={e => setNewWf(w => ({ ...w, slaStatus: e.target.value }))} className="input">
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="breached">Breached</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Description <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={newWf.description || ''} onChange={e => setNewWf(w => ({ ...w, description: e.target.value }))} rows={3} placeholder="Provide context or instructions for this workflow item…" style={{ width: '100%', padding: '9px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', resize: 'none', fontFamily: 'inherit' }} onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgb(99 102 241 / .12)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={handleCreate} disabled={creating} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: creating ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: creating ? .7 : 1, boxShadow: '0 4px 12px rgb(79 70 229 / .3)' }}>
              {creating ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Creating…</> : 'Create Workflow'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#fff', color: '#64748b' }}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Detail drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="Workflow Details">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{selected.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge variant={PRIORITY_BADGE[selected.priority] || 'slate'}>{selected.priority}</Badge>
                <Badge variant={STATUS_BADGE[selected.status] || 'slate'}>{selected.status?.replace(/_/g, ' ')}</Badge>
                <Badge variant={SLA_BADGE[selected.slaStatus] || 'slate'}>{selected.slaStatus?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Type">{typeLabel(selected.type)}</DetailRow>
              <DetailRow label="Owner">{selected.ownerName || selected.ownerId}</DetailRow>
              <DetailRow label="Due Date">{formatDate(selected.dueDate)}</DetailRow>
              <DetailRow label="SLA">{selected.slaStatus?.replace(/_/g, ' ')}</DetailRow>
            </div>
            {selected.description && <DetailRow label="Description">{selected.description}</DetailRow>}
            {selected.activityHistory?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 10 }}>Activity History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.activityHistory.slice(-5).reverse().map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 5 }} />
                      <span><strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{a.action}</strong> by {a.performedBy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Page>
  );
}
