import { useState } from 'react';
import { reportAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import { Page, Card, CardHeader, Badge, Empty } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const TABS = ['operations', 'forecasts', 'anomalies', 'ai_performance'];
const TAB_ICONS = { operations: '🏭', forecasts: '📈', anomalies: '⚠️', ai_performance: '🤖' };
const TAB_LABELS = { operations: 'Operations', forecasts: 'Forecasts', anomalies: 'Anomalies', ai_performance: 'AI Performance' };

const savedReports = [
  { name: 'Operations Report — Jul 2026', generatedAt: new Date(Date.now() - 3600000).toISOString(), format: 'PDF', status: 'ready', size: '2.4 MB' },
  { name: 'Anomaly Summary — Q2 2026', generatedAt: new Date(Date.now() - 86400000).toISOString(), format: 'CSV', status: 'ready', size: '0.8 MB' },
  { name: 'AI Performance — Jun 2026', generatedAt: new Date(Date.now() - 172800000).toISOString(), format: 'PDF', status: 'ready', size: '1.2 MB' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('operations');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      const params = { ...range };
      let r;
      if (tab === 'operations') r = await reportAPI.getOperationsReport(params);
      else if (tab === 'forecasts') r = await reportAPI.getForecastsReport(params);
      else if (tab === 'anomalies') r = await reportAPI.getAnomaliesReport(params);
      else r = await reportAPI.getAIPerformanceReport({ days: 30 });
      if (r.data.success) { setData(r.data.data); toast.success('Report generated'); }
    } catch { toast.error('Report generation failed. Ensure backend is running.'); } finally { setLoading(false); }
  };

  const exportCSV = async () => {
    try {
      const r = await reportAPI.getOperationsReport({ ...range, format: 'csv' });
      const blob = new Blob([typeof r.data === 'string' ? r.data : JSON.stringify(r.data)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${tab}-report.csv`; a.click(); URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  return (
    <Page>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 14, width: 'fit-content', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setData(null); }} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', ...(tab === t ? { background: '#fff', color: '#4f46e5', boxShadow: '0 1px 3px rgb(0 0 0 / .1)' } : { background: 'transparent', color: '#64748b' }) }}>
            {TAB_ICONS[t]} {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Date range + generate */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <CardHeader title={`${TAB_LABELS[tab]} Report`} subtitle="Select a date range and generate the report" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([l, k]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{l}</label>
              <input type="date" value={range[k]} onChange={e => setRange(r => ({ ...r, [k]: e.target.value }))} className="input" style={{ width: 'auto' }} />
            </div>
          ))}
          <button onClick={generate} disabled={loading} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? .7 : 1, boxShadow: '0 4px 12px rgb(79 70 229 / .3)' }}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Generating…</> : <>📊 Generate Report</>}
          </button>
          {data && (
            <button onClick={exportCSV} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#fff', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬇️ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report output */}
      {data && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-title">{TAB_LABELS[tab]} Report Results</div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Generated {formatDateTime(data.generatedAt)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
            {tab === 'operations' && [
              ['KPI Data Points', data.kpis?.length || 0],
              ['Workflows', data.workflows?.length || 0],
              ['Active Tasks', data.tasks?.length || 0],
              ['Low Stock Alerts', data.lowStockAlerts?.length || 0],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{v}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
            {tab === 'forecasts' && [['Forecasts Found', data.forecasts?.length || 0]].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}><div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{v}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l}</div></div>
            ))}
            {tab === 'anomalies' && [
              ['Total', data.totalAnomalies || 0],
              ['Critical', data.bySeverity?.critical || 0],
              ['High', data.bySeverity?.high || 0],
              ['Medium', data.bySeverity?.medium || 0],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}><div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{v}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l}</div></div>
            ))}
            {tab === 'ai_performance' && [
              ['Total Runs', data.totalRuns || 0],
              ['Avg Confidence', `${((data.averageConfidence || 0) * 100).toFixed(1)}%`],
              ['Avg Duration', `${((data.averageDuration || 0) / 1000).toFixed(1)}s`],
              ['Period', data.period || '30 days'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}><div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{v}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#166534' }}>
            Report covers period: <strong>{range.startDate || 'All time'}</strong> to <strong>{range.endDate || 'Present'}</strong>
          </div>
        </div>
      )}

      {/* Saved reports */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}><div className="section-title">📁 Saved Reports</div></div>
        <div style={{ padding: '8px 0' }}>
          {savedReports.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < savedReports.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: r.format === 'PDF' ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.format === 'PDF' ? '📄' : '📊'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDateTime(r.generatedAt)} · {r.size}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span className={`badge ${r.format === 'PDF' ? 'badge-red' : 'badge-green'}`}>{r.format}</span>
                <button style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: '#fff', color: '#4f46e5' }}>⬇️ Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
