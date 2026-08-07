import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../services/api';
import { mockKPIs, mockTrendData, mockWorkflows, mockAnomalies } from '../utils/mockData';
import { formatDate } from '../utils/helpers';
import { Page, StatCard, Card, CardHeader } from '../components/ui/index.jsx';

const kpiConfig = [
  { key: 'sellThrough', label: 'Sell-Through', unit: '%', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', icon: '🛍️' },
  { key: 'stockCover', label: 'Stock Cover', unit: 'd', gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', icon: '📦' },
  { key: 'sizeAvailability', label: 'Size Availability', unit: '%', gradient: 'linear-gradient(135deg,#06b6d4,#67e8f9)', icon: '📐' },
  { key: 'leadTime', label: 'Lead Time', unit: 'd', gradient: 'linear-gradient(135deg,#f59e0b,#fcd34d)', icon: '⏱️' },
  { key: 'margin', label: 'Gross Margin', unit: '%', gradient: 'linear-gradient(135deg,#22c55e,#86efac)', icon: '💰' },
  { key: 'markdownRate', label: 'Markdown Rate', unit: '%', gradient: 'linear-gradient(135deg,#f97316,#fdba74)', icon: '🏷️' },
  { key: 'returnRate', label: 'Return Rate', unit: '%', gradient: 'linear-gradient(135deg,#ef4444,#fca5a5)', icon: '↩️' },
  { key: 'collectionPerformance', label: 'Collection Score', unit: '%', gradient: 'linear-gradient(135deg,#ec4899,#f9a8d4)', icon: '⭐' },
];

const KPIIcon = ({ emoji, gradient }) => (
  <div style={{ width: 44, height: 44, borderRadius: 12, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgb(0 0 0 / .15)' }}>{emoji}</div>
);

const SummaryPill = ({ label, value, color, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: color, cursor: 'pointer', transition: 'opacity .15s' }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{value}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgb(255 255 255 / .85)', lineHeight: 1.3 }}>{label}</span>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgb(0 0 0 / .1)' }}>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}: {Number(p.value).toFixed(1)}{p.unit || '%'}</p>)}
    </div>
  );
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState(mockKPIs);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(mockTrendData.slice(-14));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [k, s, t] = await Promise.allSettled([dashboardAPI.getKPIs({ period: 'daily' }), dashboardAPI.getSummary(), dashboardAPI.getTrends({ metric: 'sellThrough', days: 14 })]);
        if (k.status === 'fulfilled' && k.value.data?.data?.current?.sellThrough) setKpis(k.value.data.data.current);
        if (s.status === 'fulfilled') setSummary(s.value.data?.data);
        if (t.status === 'fulfilled' && t.value.data?.data?.trendData?.length) setTrend(t.value.data.data.trendData);
      } catch { /* use mock */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const chartData = trend.map((d, i) => ({
    date: (d.date || new Date(Date.now() + i * 86400000).toISOString()).slice(5, 10).replace('-', '/'),
    value: parseFloat((d.value || d.sellThrough || 0).toFixed(1)),
  }));

  const barData = kpiConfig.slice(0, 4).map(k => ({
    name: k.label.split(' ')[0],
    actual: parseFloat((kpis[k.key]?.value || 0).toFixed(1)),
    target: k.key === 'stockCover' ? 28 : k.key === 'leadTime' ? 35 : 80,
  }));

  return (
    <Page>
      {/* Summary pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <SummaryPill label="Sales Today" value={summary?.totalSalesToday ?? 142} color="linear-gradient(135deg, #6366f1, #8b5cf6)" onClick={() => navigate('/reports')} />
        <SummaryPill label="Returns Today" value={summary?.totalReturnsToday ?? 18} color="linear-gradient(135deg, #ef4444, #f87171)" onClick={() => navigate('/reports')} />
        <SummaryPill label="Low Stock SKUs" value={summary?.lowStockItems ?? 37} color="linear-gradient(135deg, #f59e0b, #fbbf24)" onClick={() => navigate('/forecast')} />
        <SummaryPill label="Critical Tasks" value={summary?.criticalTasks ?? 5} color="linear-gradient(135deg, #dc2626, #ef4444)" onClick={() => navigate('/tasks')} />
        <SummaryPill label="Active Anomalies" value={summary?.criticalAnomalies ?? 3} color="linear-gradient(135deg, #7c3aed, #a78bfa)" onClick={() => navigate('/anomalies')} />
        <SummaryPill label="Overdue Workflows" value={summary?.overdueWorkflows ?? 4} color="linear-gradient(135deg, #ea580c, #fb923c)" onClick={() => navigate('/workflows')} />
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {kpiConfig.map(k => (
          <StatCard key={k.key}
            label={k.label}
            value={`${kpis[k.key]?.value ?? 0}${k.unit}`}
            change={kpis[k.key]?.change ?? 0}
            changeUnit={k.unit}
            icon={<KPIIcon emoji={k.icon} gradient={k.gradient} />}
          />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* Sell-through trend */}
        <Card noPad>
          <div style={{ padding: '18px 20px 10px' }}>
            <CardHeader title="Sell-Through Trend" subtitle="Last 14 days" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 0, left: -5 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#aGrad)" dot={false} name="Sell-Through" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* KPI vs Target */}
        <Card noPad>
          <div style={{ padding: '18px 20px 10px' }}>
            <CardHeader title="KPI vs Target" subtitle="Current period" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 0, left: -5 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" fill="#6366f1" radius={[5, 5, 0, 0]} name="Actual" maxBarSize={28} />
              <Bar dataKey="target" fill="#e2e8f0" radius={[5, 5, 0, 0]} name="Target" maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* At-risk workflows */}
        <Card noPad>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <CardHeader title="SLA-at-Risk Workflows" action={<button onClick={() => navigate('/workflows')} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>View all →</button>} />
          </div>
          <div>
            {mockWorkflows.filter(w => w.slaStatus !== 'on_track').slice(0, 4).map(w => (
              <div key={w.queueId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{w.ownerName} · Due {formatDate(w.dueDate)}</p>
                </div>
                <span className={`badge ${w.slaStatus === 'breached' ? 'badge-red' : 'badge-orange'}`}>{w.slaStatus === 'breached' ? 'Breached' : 'At Risk'}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Active anomalies */}
        <Card noPad>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <CardHeader title="Active Anomalies" action={<button onClick={() => navigate('/anomalies')} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>View all →</button>} />
          </div>
          <div>
            {mockAnomalies.map(a => {
              const sevColor = a.severity === 'critical' ? '#ef4444' : a.severity === 'high' ? '#f97316' : '#f59e0b';
              return (
                <div key={a.anomalyId} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sevColor, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{a.type.replace(/_/g, ' ')}</p>
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.explanation}</p>
                  </div>
                  <span className={`badge ${a.severity === 'critical' ? 'badge-red' : a.severity === 'high' ? 'badge-orange' : 'badge-yellow'}`}>{a.severity}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Page>
  );
}
