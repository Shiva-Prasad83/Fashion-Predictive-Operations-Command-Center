/* ─── Shared UI Primitives ─────────────────────────────────────── */

// Spinner
export const Spinner = ({ size = 18, color = '#6366f1' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid ${color}30`,
    borderTopColor: color,
    animation: 'spin .7s linear infinite',
    flexShrink: 0,
  }} />
);

// Page wrapper
export const Page = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {children}
  </div>
);

// Stat card
export const StatCard = ({ label, value, change, changeUnit = '%', icon, gradient, onClick }) => {
  const pos = change === undefined ? null : change >= 0;
  return (
    <div onClick={onClick} className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: gradient || 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgb(99 102 241 / .25)' }}>
          {icon}
        </div>
        {pos !== null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 99,
            background: pos ? '#dcfce7' : '#fee2e2',
            color: pos ? '#15803d' : '#b91c1c',
          }}>
            <svg style={{ width: 10, height: 10, transform: pos ? 'none' : 'rotate(180deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            {Math.abs(change)}{changeUnit}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>{label}</div>
    </div>
  );
};

// Section card
export const Card = ({ children, style = {}, noPad }) => (
  <div className="card" style={{ ...(noPad ? {} : { padding: 20 }), ...style }}>{children}</div>
);

// Card header
export const CardHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
    <div>
      <div className="section-title">{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
);

// Badge
export const Badge = ({ children, variant = 'slate', dot }) => (
  <span className={`badge badge-${variant}`}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: .7 }} />}
    {children}
  </span>
);

// Empty state
export const Empty = ({ icon, message, action }) => (
  <div className="empty-state">
    {icon || <svg style={{ width: 48, height: 48 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
    <p>{message || 'No data found.'}</p>
    {action}
  </div>
);

// Drawer
export const Drawer = ({ isOpen, onClose, title, children, width = 440 }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ maxWidth: width }}>
        <div className="drawer-header">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
};

// Modal
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 480 }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: '16px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
};

// Pagination
export const Pagination = ({ page, pages, total, limit, onPrev, onNext }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafafa', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
    <span style={{ fontSize: 12, color: '#94a3b8' }}>{total} record{total !== 1 ? 's' : ''}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button disabled={page <= 1} onClick={onPrev} className="btn btn-secondary btn-sm" style={{ padding: '5px 12px' }}>← Prev</button>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{page} / {pages || 1}</span>
      <button disabled={page >= pages} onClick={onNext} className="btn btn-secondary btn-sm" style={{ padding: '5px 12px' }}>Next →</button>
    </div>
  </div>
);

// Search input
export const SearchInput = ({ value, onChange, placeholder = 'Search…', style: sx = {} }) => (
  <div style={{ position: 'relative', display: 'flex', ...sx }}>
    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    <input type="search" value={value} onChange={onChange} placeholder={placeholder} className="input" style={{ paddingLeft: 34 }} />
  </div>
);

// Select
export const Select = ({ value, onChange, children, style: sx = {} }) => (
  <select value={value} onChange={onChange} className="input" style={{ width: 'auto', ...sx }}>{children}</select>
);

// Detail row (used inside drawers/cards)
export const DetailRow = ({ label, value, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8' }}>{label}</span>
    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{children || value || '—'}</span>
  </div>
);

// AI output card
export const AICard = ({ confidence, explanation, modelVersion, timestamp }) => (
  <div style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', border: '1px solid #c7d2fe', borderRadius: 12, padding: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ width: 14, height: 14 }} fill="white" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#4338ca' }}>AI Output</span>
      {confidence != null && (
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: confidence >= .8 ? '#dcfce7' : confidence >= .6 ? '#fef9c3' : '#fee2e2', color: confidence >= .8 ? '#15803d' : confidence >= .6 ? '#854d0e' : '#b91c1c' }}>
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
    </div>
    {explanation && <p style={{ fontSize: 12, color: '#4338ca', lineHeight: 1.6 }}>{explanation}</p>}
    {(modelVersion || timestamp) && (
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {modelVersion && <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 500 }}>Model: {modelVersion}</span>}
        {timestamp && <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 500 }}>Generated: {new Date(timestamp).toLocaleString()}</span>}
      </div>
    )}
  </div>
);
