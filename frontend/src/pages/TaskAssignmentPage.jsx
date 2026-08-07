import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { formatDate, hasMinRole } from '../utils/helpers';
import { mockTasks, mockUsers } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import { Page, Card, Badge, Empty, Drawer, DetailRow, Pagination, SearchInput, Select, Modal, AICard } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const STATUS_BADGE = { pending: 'yellow', assigned: 'blue', in_progress: 'indigo', review: 'violet', completed: 'green', deferred: 'slate', cancelled: 'slate' };
const PRIORITY_BADGE = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' };

export default function TaskAssignmentPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [escalateModal, setEscalateModal] = useState(null);
  const [notes, setNotes] = useState('');
  const [escalateTo, setEscalateTo] = useState('');
  const [showScenario, setShowScenario] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const { user } = useAuth();
  const canApprove = hasMinRole(user, 'Manager');

  useEffect(() => { load(); }, [filters, pagination.page]);

  const load = async () => {
    setLoading(true);
    try {
      const p = { page: pagination.page, limit: pagination.limit };
      if (filters.status) p.status = filters.status;
      if (filters.priority) p.priority = filters.priority;
      if (filters.search) p.search = filters.search;
      const r = await taskAPI.getTasks(p);
      if (r.data.success && r.data.data.tasks.length) { setTasks(r.data.data.tasks); setPagination(prev => ({ ...prev, ...r.data.data.pagination })); }
      else setTasks(mockTasks);
    } catch { setTasks(mockTasks); } finally { setLoading(false); }
  };

  const handleApprove = async (decision) => {
    try { await taskAPI.approveTask(approveModal.taskId, decision, notes); toast.success(`Task ${decision}`); setApproveModal(null); setNotes(''); load(); }
    catch { toast.error('Action failed'); }
  };

  const handleEscalate = async () => {
    if (!escalateTo) return toast.error('Select a person to escalate to');
    try { await taskAPI.escalateTask(escalateModal.taskId, escalateTo, notes); toast.success('Task escalated'); setEscalateModal(null); setNotes(''); setEscalateTo(''); load(); }
    catch { toast.error('Escalation failed'); }
  };

  const display = tasks.filter(t => !filters.search || t.title?.toLowerCase().includes(filters.search.toLowerCase()));
  const stats = [
    ['Pending', tasks.filter(t => t.status === 'pending').length, '#fef9c3', '#854d0e', '⏳'],
    ['In Progress', tasks.filter(t => t.status === 'in_progress').length, '#dbeafe', '#1d4ed8', '🔄'],
    ['Critical', tasks.filter(t => t.priority === 'critical').length, '#fee2e2', '#b91c1c', '🚨'],
    ['Needs Approval', tasks.filter(t => t.requiresApproval && t.approvalStatus === 'pending').length, '#ede9fe', '#6d28d9', '✅'],
  ];

  return (
    <Page>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        {stats.map(([l, v, bg, color, icon]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div><div style={{ fontSize: 28, fontWeight: 800, color }}>{v}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{l}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search tasks…" style={{ flex: '1 1 200px', minWidth: 0 }} />
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['pending', 'assigned', 'in_progress', 'review', 'completed', 'deferred', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </Select>
        <Select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </Select>
        <button onClick={() => setShowScenario(s => !s)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, border: `1px solid ${showScenario ? '#6366f1' : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer', background: showScenario ? '#eef2ff' : '#fff', color: showScenario ? '#4f46e5' : '#64748b', transition: 'all .15s' }}>📐 Scenarios</button>
      </div>

      {/* Scenario panel */}
      {showScenario && (
        <div style={{ background: '#fff', border: '1px solid #c7d2fe', borderRadius: 14, padding: '20px', boxShadow: '0 4px 12px rgb(99 102 241 / .1)' }}>
          <CardHeader title="Scenario Comparison" subtitle="Compare response options side-by-side" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
            {[
              { title: 'Scenario A — Expedite', cost: '$12K', risk: 'Low', rec: true, desc: 'Airfreight critical batches. Prevents 3-day delay. Revenue saved: ~$85K.' },
              { title: 'Scenario B — Accept Delay', cost: '$0', risk: 'High', rec: false, desc: 'Revenue at risk: ~$85K. SLA breach likely on 2 active workflows.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${s.rec ? '#6366f1' : '#e2e8f0'}`, background: s.rec ? '#f5f3ff' : '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.title}</div>
                  {s.rec && <span className="badge badge-indigo">Recommended</span>}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8, lineHeight: 1.5 }}>{s.desc}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span>Cost: <strong style={{ color: '#0f172a' }}>{s.cost}</strong></span>
                  <span>Risk: <strong style={{ color: s.risk === 'High' ? '#dc2626' : '#16a34a' }}>{s.risk}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr>{['Task', 'Type', 'Priority', 'Status', 'Assigned To', 'Due', 'AI', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8}><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div></td></tr>
                : display.length === 0 ? <tr><td colSpan={8}><Empty message="No tasks found." /></td></tr>
                  : display.map(t => (
                    <tr key={t.taskId}>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{t.title}</div>
                        {t.requiresApproval && t.approvalStatus === 'pending' && <span className="badge badge-violet" style={{ marginTop: 3, fontSize: 10 }}>Approval needed</span>}
                      </td>
                      <td><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>{t.type?.replace(/_/g, ' ')}</span></td>
                      <td><Badge variant={PRIORITY_BADGE[t.priority] || 'slate'}>{t.priority}</Badge></td>
                      <td><Badge variant={STATUS_BADGE[t.status] || 'slate'}>{t.status?.replace(/_/g, ' ')}</Badge></td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{t.assigneeName || t.assignedTo || '—'}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{formatDate(t.dueDate)}</td>
                      <td>{t.aiGenerated && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#ede9fe', color: '#6d28d9', fontWeight: 700 }}>AI</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setSelected(t)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, border: 'none', background: '#eef2ff', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>View</button>
                          {canApprove && t.requiresApproval && t.approvalStatus === 'pending' && <button onClick={() => setApproveModal(t)} style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, border: 'none', background: '#dcfce7', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>Review</button>}
                          <button onClick={() => setEscalateModal(t)} style={{ fontSize: 12, color: '#c2410c', fontWeight: 700, border: 'none', background: '#ffedd5', padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>↑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pagination.page} pages={pagination.pages} total={display.length} limit={pagination.limit}
          onPrev={() => setPagination(p => ({ ...p, page: p.page - 1 }))} onNext={() => setPagination(p => ({ ...p, page: p.page + 1 }))} />
      </div>

      {/* Detail drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="Task Details">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{selected.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge variant={PRIORITY_BADGE[selected.priority] || 'slate'}>{selected.priority}</Badge>
                <Badge variant={STATUS_BADGE[selected.status] || 'slate'}>{selected.status?.replace(/_/g, ' ')}</Badge>
                {selected.aiGenerated && <span className="badge badge-violet">AI Generated</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Assigned To">{selected.assigneeName || selected.assignedTo || '—'}</DetailRow>
              <DetailRow label="Due Date">{formatDate(selected.dueDate)}</DetailRow>
              <DetailRow label="Type">{selected.type?.replace(/_/g, ' ')}</DetailRow>
              <DetailRow label="Approval">{selected.approvalStatus || '—'}</DetailRow>
            </div>
            {selected.expectedImpact && <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>Expected Impact</div><p style={{ fontSize: 12, color: '#166534' }}>{selected.expectedImpact}</p></div>}
            {selected.description && <DetailRow label="Description">{selected.description}</DetailRow>}
            {selected.aiGenerated && <AICard confidence={0.87} explanation="AI-generated recommendation. Requires human review and approval before execution." modelVersion="1.0" />}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              {canApprove && selected.requiresApproval && selected.approvalStatus === 'pending' && <button onClick={() => { setApproveModal(selected); setSelected(null); }} className="btn btn-success" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>Review & Approve</button>}
              <button onClick={() => { setEscalateModal(selected); setSelected(null); }} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg,#f97316,#fdba74)', color: '#fff', justifyContent: 'center' }}>Escalate</button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Approve modal */}
      <Modal isOpen={!!approveModal} onClose={() => { setApproveModal(null); setNotes(''); }} title="Review AI Task">
        {approveModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{approveModal.title}</p>
              {approveModal.expectedImpact && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>Impact: {approveModal.expectedImpact}</p>}
            </div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Decision Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add reason for your decision…" style={{ width: '100%', padding: '9px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button onClick={() => handleApprove('approved')} className="btn btn-success" style={{ justifyContent: 'center', padding: '10px' }}>Approve</button>
              <button onClick={() => handleApprove('rejected')} className="btn btn-danger" style={{ justifyContent: 'center', padding: '10px' }}>Reject</button>
              <button onClick={() => handleApprove('override')} className="btn btn-warning" style={{ justifyContent: 'center', padding: '10px' }}>Override</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Escalate modal */}
      <Modal isOpen={!!escalateModal} onClose={() => { setEscalateModal(null); setNotes(''); setEscalateTo(''); }} title="Escalate Task">
        {escalateModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#64748b' }}>{escalateModal.title}</p>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Escalate To</label>
              <select value={escalateTo} onChange={e => setEscalateTo(e.target.value)} className="input">
                <option value="">Select person…</option>
                {mockUsers.filter(u => ['Manager', 'Operations Admin'].includes(u.role)).map(u => <option key={u.userId} value={u.userId}>{u.firstName} {u.lastName} — {u.role}</option>)}
              </select>
            </div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Reason</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reason for escalation…" style={{ width: '100%', padding: '9px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleEscalate} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg,#f97316,#fdba74)', color: '#fff' }}>Escalate</button>
              <button onClick={() => { setEscalateModal(null); setNotes(''); setEscalateTo(''); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
