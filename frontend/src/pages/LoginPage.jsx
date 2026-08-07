import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res?.success) navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', overflow: 'hidden',
      }} className="lg-flex">
        <style>{`.lg-flex { display: none; } @media(min-width:1024px){ .lg-flex { display: flex !important; } }`}</style>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgb(99 102 241 / .2) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgb(139 92 246 / .15) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgb(99 102 241 / .4)' }}>
              <svg style={{ width: 26, height: 26 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Fashion Ops</div>
              <div style={{ fontSize: 12, color: 'rgb(255 255 255 / .5)', fontWeight: 500 }}>Command Center</div>
            </div>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Predict disruptions<br />before they happen.
          </h2>
          <p style={{ fontSize: 16, color: 'rgb(255 255 255 / .6)', lineHeight: 1.7, maxWidth: 400, marginBottom: 48 }}>
            AI-powered operations intelligence for fashion brands — from trend planning to replenishment, all in one command center.
          </p>

          {[
            { icon: '📊', label: 'Real-time KPI monitoring across collections' },
            { icon: '🤖', label: 'Gemini AI forecasting with explainability' },
            { icon: '⚡', label: 'SLA-aware workflow management' },
            { icon: '🔔', label: 'Anomaly detection before service declines' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: 'rgb(255 255 255 / .7)', fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / .4)',
          overflow: 'hidden',
        }}>
          {/* Card top accent */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

          <div style={{ padding: '36px 36px 32px' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: '#64748b' }}>Sign in to your operations dashboard</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@fashionbrand.com" autoComplete="email"
                  className="input" style={errors.email ? { borderColor: '#f87171', background: '#fff8f8', boxShadow: '0 0 0 3px rgb(248 113 113 / .12)' } : {}} />
                {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg style={{ width: 12, height: 12, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.email}
                </p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"
                    className="input" style={{ paddingRight: 40, ...(errors.password ? { borderColor: '#f87171', background: '#fff8f8' } : {}) }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }} aria-label="Toggle password">
                    {showPwd
                      ? <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                {errors.password && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{errors.password}</p>}
              </div>

              {/* Remember + forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#6366f1' }} />
                  Remember me
                </label>
                <button type="button" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Forgot password?</button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, borderRadius: 10 }}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Signing in…</> : 'Sign in to Dashboard'}
              </button>
            </form>

            {/* Demo creds */}
            <div style={{ marginTop: 20, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Demo credentials</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, color: '#64748b' }}>
                <span>admin@fashionbrand.com</span><span style={{ fontWeight: 600, color: '#4f46e5' }}>Admin@123</span>
                <span>manager@fashionbrand.com</span><span style={{ fontWeight: 600, color: '#4f46e5' }}>Manager@123</span>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
