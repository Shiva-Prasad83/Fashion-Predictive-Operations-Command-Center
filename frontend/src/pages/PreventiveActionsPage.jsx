import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { mockTasks } from '../utils/mockData';
import { Page, Badge, Empty, Card, CardHeader, AICard } from '../components/ui/index.jsx';

const PRIORITY_BADGE = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' };
const STATUS_BADGE = { pending: 'yellow', assigned: 'blue', in_progress: 'indigo', completed: 'green', deferred: 'slate', cancelled: 'slate' };

export default function PreventiveActionsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await taskAPI.getTasks({ type: 'preventive', limit: 50 });
        if (r.data.success && r.data.data.tasks.length) setActions(r.data.data.tasks);
        else setActions(mockTasks.filter(t => t.type === 'preventive' || t.aiGenerated));
      } catch { setActions(mockTasks.filter(t => t.type === 'preventive' || t.aiGenerated)); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const aiGenerated = actions.filter(a => a.aiGenerated);
  const completed = actions.filter(a => a.status === 'completed');
  const pending = actions.filter(a => ['pending', 'assigned'].includes(a.status));

  const stats = [
    { label: 'Total Actions', value: actions.length, icon: '📋', bg: '#f1f5f9', color: '#475569' },
    { label: 'AI Recommended', value: aiGenerated.length, icon: '🤖', bg: '#ede9fe', color: '#6d28d9' },
    { label: 'Completed', value: completed.length, icon: '✅', bg: '#dcfce7', color: '#16a34a' },
    { label: 'Pending', value: pending.length, icon: '⏳', bg: '#fef9c3', color: '#854d0e' },
  ];

  return (
    <Page>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div><div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* AI Recommended actions */}
      {aiGenerated.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '3px 10px', background: 'linear-gradient(135deg,#ede9fe,#f5f3ff)', color: '#6d28d9', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>🤖 AI Recommendations</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
            {aiGenerated.map(a => (
              <div key={a.taskId} style={{ background: '#fff', border: '1px solid #c7d2fe', borderRadius: 14, padding: '16px', boxShadow: '0 4px 12px rgb(99 102 241 / .08)', transition: 'box-shadow .15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{a.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge variant={PRIORITY_BADGE[a.priority] || 'slate'}>{a.priority}</Badge>
                      <Badge variant={STATUS_BADGE[a.status] || 'slate'}>{a.status?.replace(/_/g, ' ')}</Badge>
                      {a.requiresApproval && a.approvalStatus === 'pending' && <span className="badge badge-violet" style={{ fontSize: 10 }}>Needs approval</span>}
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', background: '#ede9fe', color: '#6d28d9', fontSize: 10, fontWeight: 700, borderRadius: 99, flexShrink: 0 }}>AI</span>
                </div>
                {a.expectedImpact && (
                  <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 3 }}>Expected Impact</div>
                    <p style={{ fontSize: 12, color: '#166534' }}>{a.expectedImpact}</p>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Due {formatDate(a.dueDate)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: '#dcfce7', color: '#16a34a' }}>Approve</button>
                    <button style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: '#fee2e2', color: '#dc2626' }}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All actions table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}><div className="section-title">All Preventive Actions</div></div>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
          : actions.length === 0 ? <Empty message="No preventive actions. Generate AI recommendations from the Demand Predictions page." />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr>{['Action', 'Priority', 'Status', 'Expected Impact', 'Due Date', 'AI', 'Outcome'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {actions.map(a => (
                      <tr key={a.taskId}>
                        <td style={{ maxWidth: 240 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{a.title}</div></td>
                        <td><Badge variant={PRIORITY_BADGE[a.priority] || 'slate'}>{a.priority}</Badge></td>
                        <td><Badge variant={STATUS_BADGE[a.status] || 'slate'}>{a.status?.replace(/_/g, ' ')}</Badge></td>
                        <td style={{ maxWidth: 200 }}><div style={{ fontSize: 12, color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{a.expectedImpact || '—'}</div></td>
                        <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(a.dueDate)}</td>
                        <td>{a.aiGenerated ? <span className="badge badge-violet" style={{ fontSize: 10 }}>AI</span> : '—'}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{a.actualOutcome || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>
    </Page>
  );
}
