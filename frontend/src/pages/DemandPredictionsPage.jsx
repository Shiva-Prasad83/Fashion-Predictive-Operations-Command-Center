import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { aiAPI, forecastAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import { mockForecastData } from '../utils/mockData';
import { Page, Card, CardHeader, Badge, Empty, AICard, Select } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function DemandPredictionsPage() {
  const [forecasts, setForecasts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState({ type: 'demand', targetMetric: 'sellThrough', forecastHorizon: 14 });
  const [aiRuns, setAiRuns] = useState([]);

  useEffect(() => { load(); loadRuns(); }, []);

  const buildChart = (fc) => {
    if (fc?.dataPoints?.length) return fc.dataPoints.map(d => ({
      date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      forecast: parseFloat(d.value?.toFixed(1)), lower: parseFloat((d.lowerBound || d.value * .9).toFixed(1)), upper: parseFloat((d.upperBound || d.value * 1.1).toFixed(1)),
    }));
    return mockForecastData.map((d, i) => ({ date: d.date || new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), forecast: d.value, lower: d.lowerBound, upper: d.upperBound }));
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await forecastAPI.getForecasts({ status: 'active', limit: 10 });
      if (r.data.success && r.data.data.forecasts.length) { setForecasts(r.data.data.forecasts); const fc = r.data.data.forecasts[0]; setSelected(fc); setChartData(buildChart(fc)); }
      else setChartData(buildChart(null));
    } catch { setChartData(buildChart(null)); } finally { setLoading(false); }
  };

  const loadRuns = async () => {
    try { const r = await aiAPI.getAIRuns({ type: 'forecast', limit: 5 }); if (r.data.success) setAiRuns(r.data.data.runs); } catch { /* silent */ }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await aiAPI.generateForecast(config);
      if (r.data.success) { toast.success(`Forecast ready — ${Math.round(r.data.data.confidence * 100)}% confidence`); load(); loadRuns(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Forecast generation failed. Check backend and AI service.', { duration: 6000 }); } finally { setGenerating(false); }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgb(0 0 0 / .1)' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
        {payload.filter(p => p.name === 'forecast').map((p, i) => <p key={i} style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{p.name}: {p.value}%</p>)}
        {payload.find(p => p.name === 'upper') && <p style={{ fontSize: 11, color: '#94a3b8' }}>Range: {payload.find(p => p.name === 'lower')?.value}% – {payload.find(p => p.name === 'upper')?.value}%</p>}
      </div>
    );
  };

  const factors = selected?.contributingFactors?.length ? selected.contributingFactors : [
    { factor: 'Historical sell-through trend', impact: 0.45, description: 'Strong 4-week upward trend in casualwear.' },
    { factor: 'Seasonal calendar', impact: 0.28, description: 'Upcoming festive season drives demand spike.' },
    { factor: 'Return rate', impact: -0.12, description: 'Elevated returns on T-shirts dampening net sales.' },
    { factor: 'Stock availability', impact: 0.19, description: 'Adequate cover across top-selling SKUs.' },
  ];

  return (
    <Page>
      {/* Config panel */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <CardHeader title="AI Forecast Configuration" subtitle="Configure and run demand & workload predictions" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {[
            { label: 'Forecast Type', key: 'type', opts: [['demand', 'Demand'], ['workload', 'Workload'], ['resource_requirement', 'Resource Req.'], ['service_risk', 'Service Risk']] },
            { label: 'Target Metric', key: 'targetMetric', opts: [['sellThrough', 'Sell-Through'], ['stockCover', 'Stock Cover'], ['returnRate', 'Return Rate'], ['margin', 'Margin'], ['leadTime', 'Lead Time']] },
            { label: 'Horizon (Days)', key: 'forecastHorizon', opts: [[7, '7 days'], [14, '14 days'], [21, '21 days'], [30, '30 days']] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</label>
              <Select value={config[key]} onChange={e => setConfig(c => ({ ...c, [key]: key === 'forecastHorizon' ? Number(e.target.value) : e.target.value }))}>
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          ))}
          <button onClick={generate} disabled={generating} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, opacity: generating ? .7 : 1, boxShadow: '0 4px 12px rgb(79 70 229 / .3)', whiteSpace: 'nowrap' }}>
            {generating ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Generating…</> : <>🤖 Run AI Forecast</>}
          </button>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Model: <strong style={{ color: '#475569' }}>Gemini 1.5 Flash</strong></div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Version: <strong style={{ color: '#475569' }}>1.0</strong></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Demand & Workload Forecast</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Shaded band = confidence interval · Blue line = forecast</div>
          </div>
          {selected && <span style={{ padding: '4px 12px', background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 700, borderRadius: 99 }}>{Math.round((selected.confidence || .87) * 100)}% confidence</span>}
        </div>
        {generating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 12, color: '#94a3b8' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p style={{ fontSize: 14 }}>Running Gemini AI model…</p>
          </div>
        ) : chartData.length === 0 ? (
          <Empty message="No forecast data. Configure and run the AI forecast above." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -5 }}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" width={38} />
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="upper" stroke="none" fill="url(#ciGrad)" legendType="none" />
              <Area dataKey="lower" stroke="none" fill="#fff" legendType="none" />
              <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2.5} fill="none" dot={false} name="forecast" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Details + contributing factors */}
      {selected && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <CardHeader title="Forecast Metadata" />
            <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Type', selected.type?.replace(/_/g, ' ')], ['Metric', selected.targetMetric], ['Horizon', `${selected.forecastHorizon} days`], ['Generated', formatDateTime(selected.generatedAt)], ['Valid Until', formatDateTime(selected.validUntil)], ['Model', `${selected.modelType || 'gemini-1.5-flash'} v${selected.modelVersion}`], ['Records', selected.inputDataSnapshot?.recordCount], ['Status', selected.status]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                  <dt style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{k}</dt>
                  <dd style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right', textTransform: 'capitalize' }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
            <CardHeader title="Contributing Factors" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {factors.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ width: 4, height: 40, borderRadius: 99, background: f.impact >= 0 ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{f.factor}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.description}</div></div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: f.impact >= 0 ? '#16a34a' : '#dc2626', flexShrink: 0 }}>{f.impact >= 0 ? '+' : ''}{(f.impact * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            {selected.explanation && <div style={{ marginTop: 12 }}><AICard confidence={selected.confidence} explanation={selected.explanation} modelVersion={selected.modelVersion} timestamp={selected.generatedAt} /></div>}
          </div>
        </div>
      )}

      {/* Recent runs */}
      {aiRuns.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / .06)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}><div className="section-title">Recent AI Runs</div></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr>{['Type', 'Status', 'Confidence', 'Duration', 'Started'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {aiRuns.map(r => (
                  <tr key={r.runId}>
                    <td style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{r.type?.replace(/_/g, ' ')}</td>
                    <td><Badge variant={r.status === 'completed' ? 'green' : r.status === 'failed' ? 'red' : 'yellow'}>{r.status}</Badge></td>
                    <td>{r.confidence ? <span style={{ fontSize: 12, fontWeight: 700, color: r.confidence >= .8 ? '#16a34a' : r.confidence >= .6 ? '#854d0e' : '#b91c1c' }}>{Math.round(r.confidence * 100)}%</span> : '—'}</td>
                    <td style={{ fontSize: 12 }}>{r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                    <td style={{ fontSize: 12 }}>{formatDateTime(r.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Page>
  );
}
