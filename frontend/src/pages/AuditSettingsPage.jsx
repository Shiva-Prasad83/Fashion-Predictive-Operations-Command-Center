import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { formatDateTime, hasMinRole } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { Page, Card, CardHeader, Badge, Empty, Pagination, Select } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const ACTION_BADGE = {
  login: 'green', logout: 'slate', login_failed: 'red', create: 'blue', update: 'yellow',
  delete: 'red', export: 'indigo', ai_execution: 'violet', ai_approval: 'green', ai_rejection: 'red',
  ai_override: 'orange', config_change: 'orange', password_change: 'yellow', role_change: 'violet',
};

export default function AuditSettingsPage() {
  const [tab, setTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entityType: '', outcome: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const { user } = useAuth();
  const isAdmin = user?.role === 'Operations Admin';
  const canView = hasMinRole(user, 'Manager');

  useEffect(() => { tab === 'logs' ? loadLogs() : loadSettings(); }, [tab, filters, pagination.page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const r = await auditAPI.getAuditLogs({ ...filters, page: pagination.page, limit: pagination.limit });
      if (r.data.success) { setLogs(r.data.data.logs); setPagination(p => ({ ...p, ...r.data.data.pagination })); }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const r = await auditAPI.getSettings();
      if (r.data.success) setSettings(r.data.data.settings);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const updateSetting = async (id, value) => {
    try { await auditAPI.updateSetting(id, value); toast.success('Saved'); loadSettings(); }
    catch { toast.error('Update failed'); }
  };

  return (
    <Page>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 12, width: 'fit-content' }}>
        {['logs', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all .15s', textTransform: 'capitalize', ...(tab === t ? { background: '#fff', color: '#4f46e5', boxShadow: '0 1px 3px rgb(0 0 0 / .1)' } : { background: 'transparent', color: '#64748b' }) }}>
            {t === 'logs' ? '📋 Audit Logs' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          {/* Filters */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <Select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
              <option value="">All Actions</option>
              {['login', 'logout', 'create', 'update', 'delete', 'export', 'ai_execution', 'ai_approval', 'ai_rejection', 'config_change'].map(a => <option key={a} value={a}>{a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </Select>
            <Select value={filters.entityType} onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}>
              <option value="">All Entities</option>
              {['User', 'Task', 'WorkflowQueue', 'AIRun', 'ForecastSeries', 'AnomalyEvent', 'SystemConfig'].map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
            <Select value={filters.outcome} onChange={e => setFilters(f => ({ ...f, outcome: e.target.value }))}>
              <option value="">All Outcomes</option>
              {['success', 'failure', 'blocked'].map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </Select>
            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="input" style={{ width: 'auto' }} />
            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="input" style={{ width: 'auto' }} />
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr>{['Timestamp', 'Action', 'Entity', 'Performed By', 'Role', 'Outcome', 'Reason'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7}><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div></td></tr>
                    : logs.length === 0 ? <tr><td colSpan={7}><Empty message="No audit logs found. Logs are created automatically when users perform actions." /></td></tr>
                      : logs.map(log => (
                        <tr key={log.auditId}>
                          <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</td>
                          <td><Badge variant={ACTION_BADGE[log.action] || 'slate'}>{log.action?.replace(/_/g, ' ')}</Badge></td>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{log.entityType}</td>
                          <td style={{ fontSize: 12 }}>{log.performedBy}</td>
                          <td><span className="badge badge-slate" style={{ fontSize: 10 }}>{log.performedByRole || '—'}</span></td>
                          <td><Badge variant={log.outcome === 'success' ? 'green' : log.outcome === 'failure' ? 'red' : 'yellow'}>{log.outcome}</Badge></td>
                          <td style={{ fontSize: 11, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.reason || '—'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} total={logs.length} limit={pagination.limit}
              onPrev={() => setPagination(p => ({ ...p, page: p.page - 1 }))} onNext={() => setPagination(p => ({ ...p, page: p.page + 1 }))} />
          </div>
        </>
      )}

      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!canView ? (
            <Card><div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>You do not have permission to view system settings.</div></Card>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : settings.length === 0 ? (
            <Card><Empty message="No settings configured yet. Use the seed script to populate default settings." /></Card>
          ) : (
            ['workflow', 'threshold', 'sla', 'ai', 'notification', 'retention'].map(cat => {
              const catSettings = settings.filter(s => s.category === cat);
              if (!catSettings.length) return null;
              const catIcons = { workflow: '🔄', threshold: '📊', sla: '⏱️', ai: '🤖', notification: '🔔', retention: '🗄️' };
              return (
                <div key={cat} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{catIcons[cat] || '⚙️'}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{cat.replace(/_/g, ' ')} Settings</span>
                  </div>
                  <div style={{ padding: '0 20px' }}>
                    {catSettings.map((s, i) => (
                      <div key={s.configId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < catSettings.length - 1 ? '1px solid #f8fafc' : 'none', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, c => c.toUpperCase())}</div>
                          {s.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.description}</div>}
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {s.dataType === 'boolean' ? (
                            <button disabled={!s.isEditable || !isAdmin} onClick={() => updateSetting(s.configId, !s.value)} style={{
                              position: 'relative', width: 44, height: 24, borderRadius: 99, border: 'none', cursor: s.isEditable && isAdmin ? 'pointer' : 'not-allowed',
                              background: s.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
                              transition: 'background .2s', opacity: s.isEditable && isAdmin ? 1 : .55, padding: 0,
                            }}>
                              <span style={{ position: 'absolute', top: 3, left: s.value ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgb(0 0 0 / .2)' }} />
                            </button>
                          ) : (
                            <input type={s.dataType === 'number' ? 'number' : 'text'} defaultValue={s.value}
                              disabled={!s.isEditable || !isAdmin}
                              onBlur={e => s.isEditable && isAdmin && updateSetting(s.configId, s.dataType === 'number' ? Number(e.target.value) : e.target.value)}
                              style={{ width: s.dataType === 'number' ? 80 : 160, padding: '5px 10px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: s.isEditable && isAdmin ? '#fff' : '#f8fafc', opacity: s.isEditable && isAdmin ? 1 : .7, cursor: s.isEditable && isAdmin ? 'text' : 'not-allowed' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </Page>
  );
}
