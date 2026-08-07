import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { getRelativeTime } from '../../utils/helpers';
import { mockNotifications } from '../../utils/mockData';
import toast from 'react-hot-toast';

const severityStyle = {
  critical: { bg: '#fee2e2', color: '#b91c1c' },
  warning: { bg: '#ffedd5', color: '#c2410c' },
  info: { bg: '#dbeafe', color: '#1d4ed8' },
};

const typeIcon = (type, urgent) => {
  if (urgent || type === 'alert') return (
    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  );
  if (type === 'assignment') return (
    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  );
  if (type === 'ai_result') return (
    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  );
  return (
    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  );
};

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await notificationAPI.getNotifications({ limit: 25 });
      setNotifications(r.data.data.notifications.length ? r.data.data.notifications : mockNotifications);
    } catch { setNotifications(mockNotifications); }
    finally { setLoading(false); }
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

  if (!isOpen) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Notifications</div>
              {unread > 0 && <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{unread} unread</div>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unread > 0 && <button onClick={markAll} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>Mark all read</button>}
            <button onClick={() => { onClose(); navigate('/notifications'); }} style={{ fontSize: 12, color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>View all</button>
            <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
              <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="drawer-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <svg style={{ width: 48, height: 48 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <p>You're all caught up!</p>
            </div>
          ) : notifications.map(n => {
            const sev = severityStyle[n.severity] || severityStyle.info;
            return (
              <div key={n.notificationId} style={{
                display: 'flex', gap: 12, padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: n.status === 'unread' ? 'linear-gradient(to right, #eef2ff 0%, #fff 40%)' : '#fff',
                transition: 'background .15s',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: sev.bg, color: sev.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {typeIcon(n.type, n.urgent)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{n.title}</span>
                    {n.status === 'unread' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 6px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{getRelativeTime(n.createdAt)}</span>
                    {n.urgent && <span className="badge badge-red" style={{ fontSize: 10 }}>Urgent</span>}
                    {n.status === 'unread' && <button onClick={() => markRead(n.notificationId)} style={{ fontSize: 11, color: '#4f46e5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Mark read</button>}
                    <button onClick={() => del(n.notificationId)} style={{ fontSize: 11, color: '#94a3b8', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
