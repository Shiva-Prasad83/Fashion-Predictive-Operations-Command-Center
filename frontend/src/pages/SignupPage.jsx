import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const checks = [
  [v => v.length >= 8, 'At least 8 characters'],
  [v => /[A-Z]/.test(v), 'One uppercase letter'],
  [v => /[0-9]/.test(v), 'One number'],
  [v => /[^A-Za-z0-9]/.test(v), 'One special character'],
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'Analyst' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required.';
    if (!form.lastName.trim()) e.lastName = 'Required.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Add an uppercase letter.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Add a number.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      const res = await authAPI.signup({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.toLowerCase().trim(), password: form.password, role: form.role });
      if (res.data.success) { toast.success('Account created! Please sign in.'); navigate('/login'); }
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
    } finally { setLoading(false); }
  };

  const strength = checks.filter(([fn]) => fn(form.password)).length;
  const strengthColor = ['#e2e8f0', '#ef4444', '#f59e0b', '#22c55e', '#10b981'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgb(99 102 241 / .15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgb(139 92 246 / .12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 25px 50px -12px rgb(0 0 0 / .4)', overflow: 'hidden' }}>
          {/* Top accent */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

          {/* Header */}
          <div style={{ padding: '32px 36px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgb(99 102 241 / .35)' }}>
              <svg style={{ width: 28, height: 28 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Create your account</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Join the Fashion Predictive Operations platform</p>
          </div>

          <div style={{ padding: '4px 36px 32px' }}>
            <form onSubmit={handleSubmit} noValidate>
              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[['firstName', 'First name', 'Priya'], ['lastName', 'Last name', 'Sharma']].map(([f, label, ph]) => (
                  <div key={f}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                    <input type="text" value={form[f]} onChange={set(f)} placeholder={ph} autoComplete={f === 'firstName' ? 'given-name' : 'family-name'}
                      className="input" style={{ ...(errors[f] ? { borderColor: '#f87171', background: '#fff8f8' } : {}) }} />
                    {errors[f] && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors[f]}</p>}
                  </div>
                ))}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Work email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@fashionbrand.com" autoComplete="email"
                  className="input" style={{ ...(errors.email ? { borderColor: '#f87171', background: '#fff8f8' } : {}) }} />
                {errors.email && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.email}</p>}
              </div>

              {/* Role */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Role</label>
                <select value={form.role} onChange={set('role')} className="input">
                  <option value="Analyst">Analyst</option>
                  <option value="Field Staff">Field Staff</option>
                </select>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Admin & Manager accounts are provisioned by your administrator.</p>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 chars, 1 uppercase, 1 number" autoComplete="new-password"
                    className="input" style={{ paddingRight: 40, ...(errors.password ? { borderColor: '#f87171', background: '#fff8f8' } : {}) }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{showPwd ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></> : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}</svg>
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? strengthColor : '#e2e8f0', transition: 'background .3s' }} />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {strength > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>}
                      <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                        {checks.map(([fn, label], i) => (
                          <span key={i} style={{ fontSize: 10, color: fn(form.password) ? '#22c55e' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {fn(form.password) ? '✓' : '·'} {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {errors.password && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter your password" autoComplete="new-password"
                    className="input" style={{ paddingRight: 40, ...(errors.confirmPassword ? { borderColor: '#f87171', background: '#fff8f8' } : {}) }} />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{showConfirm ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></> : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}</svg>
                  </button>
                </div>
                {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
                  <p style={{ fontSize: 11, color: '#22c55e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Passwords match
                  </p>
                )}
                {errors.confirmPassword && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, borderRadius: 10 }}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgb(255 255 255 / .3)', borderTopColor: '#fff' }} />Creating account…</> : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgb(255 255 255 / .3)', marginTop: 16 }}>© 2026 Fashion Brand · Predictive Operations Command Center</p>
      </div>
    </div>
  );
}
