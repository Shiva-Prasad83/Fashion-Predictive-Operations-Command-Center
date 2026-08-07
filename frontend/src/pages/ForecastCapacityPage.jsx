import { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { forecastAPI, aiAPI } from '../services/api';
import { mockForecastData } from '../utils/mockData';
import { Page, Card, CardHeader, Badge, AICard, Modal } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const heatColor = (u) => {
  if (u >= 90) return { bg: '#ef4444', text: '#fff' };
  if (u >= 75) return { bg: '#f97316', text: '#fff' };
  if (u >= 60) return { bg: '#fbbf24', text: '#0f172a' };
  return { bg: '#86efac', text: '#14532d' };
};

const DEPTS = ['Trend Planning', 'Design', 'Sourcing', 'Sampling', 'Production'];
const DEPT_COLORS = { 'Trend Planning': '#6366f1', 'Design': '#8b5cf6', 'Sourcing': '#06b6d4', 'Sampling': '#f59e0b', 'Production': '#22c55e' };
const WEEKS = [1, 2, 3, 4];

const mockHeatmap = () => DEPTS.flatMap(d => WEEKS.map(w => ({ dept: d, week: w, util: Math.floor(Math.random() * 55) + 40 })));

export default function ForecastCapacityPage() {
  const [tab, setTab] = useState('demand');
  const [forecasts, setForecasts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [thresholds, setThresholds] = useState({ sellThrough: 65, stockCover: 14, returnRate: 8 });
  const [showThresholds, setShowThresholds] = useState(false);
  const [drilldown, setDrilldown] = useState(null);
  const [selectedFc, setSelectedFc] = useState(null);

  const buildChart = (fc) => {
    if (fc?.dataPoints?.length) return fc.dataPoints.map(d => ({
      date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(d.value?.toFixed(1)), lower: parseFloat((d.lowerBound || d.value * .9).toFixed(1)), upper: parseFloat((d.upperBound || d.value * 1.1).toFixed(1)),
    }));
    return mockForecastData.map((d, i) => ({ date: d.date || new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: d.value, lower: d.lowerBound, upper: d.upperBound }));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [fc, hm, an] = await Promise.allSettled([forecastAPI.getForecasts({ status: 'active' }), forecastAPI.getCapacityHeatmap({ weeks: 4 }), forecastAPI.getAnomalies({ limit: 5 })]);
        if (fc.status === 'fulfilled' && fc.value.data?.data?.forecasts?.length) { const f = fc.value.data.data.forecasts[0]; setForecasts(fc.value.data.data.forecasts); setSelectedFc(f); setChartData(buildChart(f)); }
        else setChartData(buildChart(null));
        setHeatmap(hm.status === 'fulfilled' ? hm.value.data?.data?.heatmap || mockHeatmap() : mockHeatmap());
        if (an.status === 'fulfilled') setAnomalies(an.value.data?.data?.anomalies || []);
      } catch { setChartData(buildChart(null)); setHeatmap(mockHeatmap()); } finally { setLoading(false); }
    };
    load();
  }, []);

  const runForecast = async () => {
    setGenerating(true);
    try {
      const r = await aiAPI.generateForecast({ type: 'demand', targetMetric: 'sellThrough', forecastHorizon: 14 });
      if (r.data.success) { toast.success(`Forecast ready — ${Math.round(r.data.data.confidence * 100)}% confidence`); window.location.reload(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Forecast generation failed. Check backend and AI service.', { duration: 6000 }); } finally { setGenerating(false); }
  };

  const workloadData = WEEKS.map(w => {
    const obj = { week: `Week ${w}` };
    DEPTS.forEach(d => { const cell = heatmap.find(h => h.dept === d && h.week === w); obj[d] = cell?.util || Math.floor(Math.random() * 50) + 40; });
    return obj;
  });

  const riskData = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, demand: 50 + Math.sin(i * .3) * 15 + Math.random() * 5, supply: 60 + Math.sin(i * .2 + 1) * 20 + Math.random() * 5, inventory: 35 + Math.sin(i * .25 + 2) * 10 + Math.random() * 5 }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgb(0 0 0 / .1)' }}><p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</p>{payload.map((p, i) => <p key={i} style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}%</p>)}</div>;
  };

  return (
    <Page>
      {/* Tab + actions row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: '#f1f5f9', borderRadius: 12 }}>
          {['demand', 'workload', 'capacity', 'risk'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s', ...(tab === t ? { background: '#fff', color: '#4f46e5', boxShadow: '0 1px 3px rgb(0 0 0 / .1)' } : { background: 'transparent', color: '#64748b' }) }}>
              {t === 'demand' ? '📈' : t === 'workload' ? '👥' : t === 'capacity' ? '🗓️' : '⚡'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowThresholds(true)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#fff', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>⚙️ Thresholds</button>
          <button onClick={runForecast} disabled={generating} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, opacity: generating ? .7 : 1, boxShadow: '0 4px 12px rgb(79 70 229 / .3)' }}>
            {generating ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Generating…</> : <>🤖 AI Forecast</>}
          </button>
        </div>
      </div>

      {/* Demand chart */}
      {tab === 'demand' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div><div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>14-Day Demand Forecast</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Shaded band = confidence interval · Dashed = alert threshold</div></div>
            {selectedFc && <span style={{ padding: '4px 12px', background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 700, borderRadius: 99 }}>{Math.round((selectedFc.confidence || .87) * 100)}% confidence · Model {selectedFc.modelVersion}</span>}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -5 }}>
              <defs><linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" width={38} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={thresholds.sellThrough} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `Alert ${thresholds.sellThrough}%`, fill: '#f59e0b', fontSize: 10 }} />
              <Area dataKey="upper" stroke="none" fill="url(#fcGrad)" legendType="none" />
              <Area dataKey="lower" stroke="none" fill="#fff" legendType="none" />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
          {selectedFc?.explanation && <div style={{ marginTop: 16 }}><AICard confidence={selectedFc.confidence} explanation={selectedFc.explanation} modelVersion={selectedFc.modelVersion} timestamp={selectedFc.generatedAt} /></div>}
        </div>
      )}

      {/* Workload chart */}
      {tab === 'workload' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
          <CardHeader title="Workload Forecast by Department" subtitle="Projected capacity utilisation — next 4 weeks" />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={workloadData} margin={{ top: 10, right: 20, bottom: 0, left: -5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} width={38} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" />
              {DEPTS.map(d => <Line key={d} type="monotone" dataKey={d} stroke={DEPT_COLORS[d]} strokeWidth={2.5} dot={{ r: 4 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Capacity heatmap */}
      {tab === 'capacity' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <CardHeader title="Capacity Utilisation Heatmap" subtitle="Click a cell to drill down" />
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
              {[['#86efac', '< 60%'], ['#fbbf24', '60–75%'], ['#f97316', '75–90%'], ['#ef4444', '> 90%']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />{l}</span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead><tr><th style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 8px', minWidth: 140 }}>Department</th>{WEEKS.map(w => <th key={w} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 8px', textAlign: 'center', minWidth: 100 }}>Week {w}</th>)}</tr></thead>
              <tbody>
                {DEPTS.map(dept => (
                  <tr key={dept}>
                    <td style={{ fontSize: 12, fontWeight: 600, color: '#475569', padding: '4px 8px' }}>{dept}</td>
                    {WEEKS.map(w => {
                      const cell = heatmap.find(h => h.dept === dept && h.week === w);
                      const util = cell?.util || 50;
                      const c = heatColor(util);
                      return (
                        <td key={w} onClick={() => setDrilldown({ dept, week: w, util })} style={{ background: c.bg, color: c.text, borderRadius: 10, padding: '10px 8px', textAlign: 'center', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'opacity .15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                          {util}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk */}
      {tab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            {[{ label: 'Demand Risk', score: 62, color: '#f59e0b', bg: '#fffbeb', desc: 'Elevated demand variance in casualwear.' },
            { label: 'Supply Risk', score: 78, color: '#ef4444', bg: '#fff8f8', desc: 'Denim supplier lead-time extended by 6 days.' },
            { label: 'Inventory Risk', score: 44, color: '#6366f1', bg: '#f5f3ff', desc: 'Slow-moving SKUs in outerwear category.' }
            ].map(r => (
              <div key={r.label} style={{ background: '#fff', border: `1px solid ${r.bg === '#fff8f8' ? '#fecaca' : '#e2e8f0'}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.label}</span><span style={{ fontSize: 22, fontWeight: 800, color: r.color }}>{r.score}</span></div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}><div style={{ width: `${r.score}%`, height: '100%', background: r.color, borderRadius: 99, transition: 'width .5s' }} /></div>
                <p style={{ fontSize: 12, color: '#64748b' }}>{r.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <CardHeader title="Risk Score Trend" subtitle="30-day history" />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={riskData} margin={{ top: 5, right: 20, bottom: 0, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {[['demand', 'Demand Risk', '#f59e0b'], ['supply', 'Supply Risk', '#ef4444'], ['inventory', 'Inventory Risk', '#6366f1']].map(([k, n, c]) => <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={false} name={n} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Threshold modal */}
      <Modal isOpen={showThresholds} onClose={() => setShowThresholds(false)} title="⚙️ Alert Thresholds">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[{ key: 'sellThrough', label: 'Sell-Through Alert (%)', min: 0, max: 100 }, { key: 'stockCover', label: 'Stock Cover Alert (days)', min: 0, max: 60 }, { key: 'returnRate', label: 'Return Rate Alert (%)', min: 0, max: 50 }].map(({ key, label, min, max }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#4f46e5' }}>{thresholds[key]}</span>
              </div>
              <input type="range" min={min} max={max} value={thresholds[key]} onChange={e => setThresholds(t => ({ ...t, [key]: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { toast.success('Thresholds saved'); setShowThresholds(false); }} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff' }}>Save Thresholds</button>
            <button onClick={() => setShowThresholds(false)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#fff', color: '#64748b' }}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Drilldown modal */}
      <Modal isOpen={!!drilldown} onClose={() => setDrilldown(null)} title="Capacity Drill-Down" maxWidth={380}>
        {drilldown && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Department', drilldown.dept], ['Week', `Week ${drilldown.week}`], ['Utilisation', `${drilldown.util}%`], ['Available', `${100 - drilldown.util}%`]].map(([k, v]) => (
                <div key={k} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div><div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{v}</div></div>
              ))}
            </div>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${drilldown.util}%`, height: '100%', background: heatColor(drilldown.util).bg, borderRadius: 99, transition: 'width .5s' }} />
            </div>
            {drilldown.util >= 75 && <div style={{ padding: '10px 14px', background: '#fff8ed', border: '1px solid #fed7aa', borderRadius: 10, fontSize: 12, color: '#c2410c' }}>⚠️ High utilisation — consider redistributing workload or adding temporary resources.</div>}
            <button onClick={() => setDrilldown(null)} style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', background: '#f8fafc', color: '#64748b' }}>Close</button>
          </div>
        )}
      </Modal>
    </Page>
  );
}
