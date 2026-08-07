import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { getRelativeTime } from '../utils/helpers';
import { mockNotifications } from '../utils/mockData';
import { Page, Card, Badge, Empty, SearchInput, Select } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const SEV_STYLES = {
  critical: { bg: '#fee2e2', color: '#b91c1c', icon: '🚨' },
  warning: { bg: '#ffedd5', color: '#c2410c', icon: '⚠️' },
  info: { bg: '#dbeafe', color: '#1d4ed8', icon: '🔔' },
};

const TYPE_LABELS = { assignment: 'Assignment', exception: 'Exception', approval: 'Approval', alert: 'Alert', due_date: 'Due Date', ai_result: 'AI Result', system: 'System', escalation: 'Escalation' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await notificationAPI.getNotifications({ ...filters, limit: 50 });
      if (r.data.success && r.data.data.notifications.length) setNotifications(r.data.data.notifications);
      else setNotifications(mockNotifications);
    } catch { setNotifications(mockNotifications); } finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await notificationAPI.markAsRead(id); } catch { /* optimistic */ }
    setNotifications(p => p.map(n => n.notificationId === id ? { ...n, status: 'read' } : n));
  };

  const markAll = async () => {
    try { await notificationAPI.markAllAsRead(); toast.success('All marked as read'); } catch { /* optimistic */ }
    setNotifications(p => p.map(n => ({ ...n, status: 'read' })));
  };

  const del = async (id) => {
    try { await notificationAPI.deleteNotification(id); } catch { /* optimistic */ }
    setNotifications(p => p.filter(n => n.notificationId !== id));
  };

  const unread = notifications.filter(n => n.status === 'unread').length;
  const display = notifications.filter(n => {
    if (filters.search && !n.title.toLowerCase().includes(filters.search.toLowerCase()) && !n.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && n.status !== filters.status) return false;
    if (filters.type && n.type !== filters.type) return false;
    return true;
  });

  return (
    <Page>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>All Notifications</div>
          {unread > 0 && <span style={{ padding: '2px 10px', background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{unread} unread</span>}
        </div>
        {unread > 0 && <button onClick={markAll} className="btn btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>Mark all as read</button>}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search notifications…" style={{ flex: '1 1 200px', minWidth: 0 }} />
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          {['unread', 'read', 'cleared'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>

      {/* Notification list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : display.length === 0 ? (
        <Card><Empty message="No notifications found." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {display.map(n => {
            const sev = SEV_STYLES[n.severity] || SEV_STYLES.info;
            return (
              <div key={n.notificationId} style={{
                background: '#fff', border: `1px solid ${n.status === 'unread' ? '#c7d2fe' : '#e2e8f0'}`,
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                boxShadow: n.status === 'unread' ? '0 0 0 3px rgb(99 102 241 / .06)' : '0 1px 3px rgb(0 0 0 / .04)',
                background: n.status === 'unread' ? 'linear-gradient(to right, #fafafe, #fff)' : '#fff',
                transition: 'box-shadow .15s',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{sev.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{n.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {n.status === 'unread' && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1' }} />}
                      {n.urgent && <Badge variant="red">Urgent</Badge>}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 8 }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{getRelativeTime(n.createdAt)}</span>
                    <span className="badge badge-slate" style={{ fontSize: 10 }}>{TYPE_LABELS[n.type] || n.type}</span>
                    {n.status === 'unread' && <button onClick={() => markRead(n.notificationId)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Mark as read</button>}
                    <button onClick={() => del(n.notificationId)} style={{ fontSize: 12, color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
