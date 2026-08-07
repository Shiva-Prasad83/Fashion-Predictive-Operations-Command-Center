import { useState, useEffect } from 'react';
import { forecastAPI, aiAPI } from '../services/api';
import { formatDateTime, hasMinRole } from '../utils/helpers';
import { mockAnomalies } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import { Page, Card, Badge, Empty, Drawer, DetailRow, Modal, AICard, Select } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const SEV_BADGE = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' };
const STATUS_BADGE = { new: 'blue', acknowledged: 'indigo', investigating: 'violet', resolved: 'green', dismissed: 'slate' };
const SEV_BG = { critical: '#fee2e2', high: '#ffedd5', medium: '#fef9c3', low: '#dbeafe' };
const SEV_ICON = { critical: '🚨', high: '⚠️', medium: '📊', low: 'ℹ️' };

export default function AnomalyRiskPage() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filters, setFilters] = useState({ severity: '', status: '', type: '' });
  const { user } = useAuth();
  const canReview = hasMinRole(user, 'Analyst');

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await forecastAPI.getAnomalies({ ...filters, limit: 50 });
      if (r.data.success) {
        // Always use real data from DB — only use mock on a network/auth error
        setAnomalies(r.data.data.anomalies);
      }
    } catch {
      // Only fall back to mock data on a genuine API failure (not when DB is empty)
      setAnomalies(mockAnomalies);
    } finally {
      setLoading(false);
    }
  };

  const detect = async () => {
    setDetecting(true);
    try {
      const r = await aiAPI.detectAnomalies({ metric: 'all', timeRange: 30 });
      if (r.data.success) {
        const found = r.data.data.anomalies.length;
        toast.success(`Detection complete — ${found} anomaly(s) found`);
        // Refresh from DB so all persisted anomalies (including previous runs) are shown
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Anomaly detection failed. Check AI service.', { duration: 6000 });
    } finally {
      setDetecting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try { await forecastAPI.updateAnomalyStatus(id, status, reviewNotes); toast.success(`Anomaly ${status}`); setReviewModal(null); setReviewNotes(''); load(); }
    catch { toast.error('Update failed'); }
  };

  const display = anomalies.filter(a => {
    if (filters.severity && a.severity !== filters.severity) return false;
    if (filters.status && a.status !== filters.status) return false;
    if (filters.type && a.type !== filters.type) return false;
    return true;
  });

  const counts = { critical: anomalies.filter(a => a.severity === 'critical').length, high: anomalies.filter(a => a.severity === 'high').length, medium: anomalies.filter(a => a.severity === 'medium').length, new: anomalies.filter(a => a.status === 'new').length };

  return (
    <Page>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        {[['Critical', counts.critical, '#fee2e2', '#b91c1c', '🚨'], ['High', counts.high, '#ffedd5', '#c2410c', '⚠️'], ['Medium', counts.medium, '#fef9c3', '#854d0e', '📊'], ['New', counts.new, '#dbeafe', '#1d4ed8', '🆕']].map(([l, v, bg, color, icon]) => (
          <div key={l} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div><div style={{ fontSize: 28, fontWeight: 800, color }}>{v}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{l}</div></div>
          </div>
        ))}
      </div>

      {/* Filters + AI detect */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <Select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
          <option value="">All Severities</option>
          {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {['new', 'acknowledged', 'investigating', 'resolved', 'dismissed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          {['demand_spike', 'demand_drop', 'quality_issue', 'delay', 'stockout', 'return_spike', 'margin_drop'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </Select>
        <button onClick={detect} disabled={detecting} style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: detecting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: detecting ? .7 : 1, boxShadow: '0 4px 12px rgb(124 58 237 / .3)' }}>
          {detecting ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Detecting…</> : <>🤖 Run AI Detection</>}
        </button>
      </div>

      {/* List */}
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        : display.length === 0 ? <Card><Empty message="No anomalies detected. Run AI Detection to analyse recent data." /></Card>
          : display.map(a => (
            <div key={a.anomalyId} style={{ background: '#fff', border: `1px solid ${a.severity === 'critical' ? '#fecaca' : a.severity === 'high' ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)', transition: 'box-shadow .15s' }}>
              <div style={{ height: 4, background: a.severity === 'critical' ? 'linear-gradient(90deg,#ef4444,#f87171)' : a.severity === 'high' ? 'linear-gradient(90deg,#f97316,#fdba74)' : a.severity === 'medium' ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#3b82f6,#93c5fd)' }} />
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{SEV_ICON[a.severity]}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{a.type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Detected {formatDateTime(a.detectedAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge variant={SEV_BADGE[a.severity] || 'slate'}>{a.severity}</Badge>
                    <Badge variant={STATUS_BADGE[a.status] || 'slate'}>{a.status}</Badge>
                    <span style={{ padding: '2px 8px', borderRadius: 99, background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 700 }}>{Math.round(a.confidence * 100)}% conf.</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>{a.explanation}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[['Metric', a.affectedMetric], ['Expected', a.expectedValue?.toFixed(1)], ['Actual', a.actualValue?.toFixed(1)], ['Deviation', `${a.deviation >= 0 ? '+' : ''}${a.deviation?.toFixed(1)}`]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.05em' }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: k === 'Actual' || k === 'Deviation' ? (a.deviation < 0 ? '#dc2626' : '#16a34a') : '#0f172a' }}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSelected(a)} className="btn btn-secondary btn-sm">View Details</button>
                  {canReview && ['new', 'acknowledged'].includes(a.status) && <button onClick={() => setReviewModal(a)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}>Review</button>}
                </div>
              </div>
            </div>
          ))}

      {/* Detail drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="Anomaly Detail" width={500}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', background: SEV_BG[selected.severity] || '#f8fafc', borderRadius: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize', marginBottom: 8 }}>{selected.type?.replace(/_/g, ' ')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge variant={SEV_BADGE[selected.severity] || 'slate'}>{selected.severity}</Badge>
                <Badge variant={STATUS_BADGE[selected.status] || 'slate'}>{selected.status}</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <DetailRow label="Metric">{selected.affectedMetric}</DetailRow>
              <DetailRow label="Confidence">{Math.round(selected.confidence * 100)}%</DetailRow>
              <DetailRow label="Expected">{selected.expectedValue?.toFixed(1)}</DetailRow>
              <DetailRow label="Actual">{selected.actualValue?.toFixed(1)}</DetailRow>
              <DetailRow label="Deviation">{`${selected.deviation >= 0 ? '+' : ''}${selected.deviation?.toFixed(1)}`}</DetailRow>
              <DetailRow label="Detected">{formatDateTime(selected.detectedAt)}</DetailRow>
            </div>
            <AICard confidence={selected.confidence} explanation={selected.explanation} modelVersion={selected.modelVersion} timestamp={selected.detectedAt} />
            {selected.contributingVariables?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', marginBottom: 10 }}>Contributing Variables</div>
                {selected.contributingVariables.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: i % 2 === 0 ? '#f8fafc' : '#fff', borderRadius: 8, marginBottom: 4 }}>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{v.variable}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{v.description}</div></div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: v.impact >= 0 ? '#16a34a' : '#dc2626' }}>{v.impact >= 0 ? '+' : ''}{(v.impact * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Review modal */}
      <Modal isOpen={!!reviewModal} onClose={() => { setReviewModal(null); setReviewNotes(''); }} title="Review Anomaly">
        {reviewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#64748b' }}><strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{reviewModal.type?.replace(/_/g, ' ')}</strong> — {reviewModal.severity} severity</p>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Notes</label>
              <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder="Add notes for your review…" style={{ width: '100%', padding: '9px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['acknowledged', 'Acknowledge', '#2563eb'], ['investigating', 'Investigate', '#9333ea'], ['resolved', 'Resolve', '#16a34a'], ['dismissed', 'Dismiss', '#64748b']].map(([s, l, c]) => (
                <button key={s} onClick={() => updateStatus(reviewModal.anomalyId, s)} style={{ padding: '9px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', background: c, color: '#fff' }}>{l}</button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
