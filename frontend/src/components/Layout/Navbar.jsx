import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';

const pageMeta = {
  '/dashboard': { title: 'Operations Dashboard', breadcrumb: ['Home', 'Dashboard'] },
  '/workflows': { title: 'Live Workflow Queues', breadcrumb: ['Home', 'Workflows'] },
  '/forecast': { title: 'Forecast, Capacity & Risk', breadcrumb: ['Home', 'Forecast'] },
  '/tasks': { title: 'Tasks & Escalation', breadcrumb: ['Home', 'Tasks'] },
  '/predictions': { title: 'Demand & Workload Predictions', breadcrumb: ['Home', 'Predictions'] },
  '/anomalies': { title: 'Anomaly & Risk Explanations', breadcrumb: ['Home', 'Anomalies'] },
  '/preventive-actions': { title: 'Preventive Actions & Outcomes', breadcrumb: ['Home', 'Preventive Actions'] },
  '/reports': { title: 'Reports & Analytics', breadcrumb: ['Home', 'Reports'] },
  '/notifications': { title: 'Notifications', breadcrumb: ['Home', 'Notifications'] },
  '/users': { title: 'User & Role Management', breadcrumb: ['Home', 'Users'] },
  '/audit': { title: 'Audit Logs & Settings', breadcrumb: ['Home', 'Audit'] },
};

const ChevronRight = () => (
  <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function Navbar({ onNotificationsOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState('');
  const meta = pageMeta[location.pathname] || { title: 'Fashion Ops', breadcrumb: ['Home'] };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await notificationAPI.getNotifications({ status: 'unread', limit: 1 });
        if (r.data.success) setUnreadCount(r.data.data.unreadCount || 0);
      } catch { /* silent */ }
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px', background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky', top: 0, zIndex: 30,
      boxShadow: '0 1px 0 0 #e2e8f0',
    }}>
      {/* Breadcrumb + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          {meta.breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              {i > 0 && <ChevronRight />}
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</h1>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', width: 240, flexShrink: 0, display: 'flex' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', color: '#0f172a', transition: 'all .15s' }}
          onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgb(99 102 241 / .1)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }} />
      </div>

      {/* Time */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: window.innerWidth > 1024 ? 'block' : 'none' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {/* Notification bell */}
      <button onClick={onNotificationsOpen} style={{ position: 'relative', padding: 8, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
        <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 18, height: 18, borderRadius: 99,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', lineHeight: 1,
            border: '2px solid #fff',
          }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0 }}>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        <div style={{ display: window.innerWidth > 900 ? 'block' : 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{user?.role}</div>
        </div>
      </div>
    </header>
  );
}
