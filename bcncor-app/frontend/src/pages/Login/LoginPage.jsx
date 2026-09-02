import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const F = "'DM Sans', system-ui, sans-serif";

const PILLS = ['Blog scraping', 'Ecosystem news', 'Competitor scoring', 'Canva export'];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: F,
    }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '42%',
        background: '#03375F',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 40px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
          bottom: -120, right: -120, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
          bottom: 60, right: 60, pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          <img src="/logo.png" alt="BcnCor" style={{ height: 72, objectFit: 'contain' }} />
        </div>

        {/* Bottom copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 34, fontWeight: 600, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 14,
          }}>
            Marketing on<br />autopilot.
          </div>
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, marginBottom: 24, maxWidth: 280,
          }}>
            Turn insights into content — from blogs, news, and competitors to LinkedIn carousels in minutes.
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PILLS.map(pill => (
              <span key={pill} style={{
                fontSize: 12, color: 'rgba(255,255,255,0.6)',
                border: '0.5px solid rgba(255,255,255,0.2)',
                borderRadius: 20, padding: '4px 12px',
              }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Heading */}
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0F1F2E', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Welcome back
          </div>
          <div style={{ fontSize: 13, color: '#8A9BAA', marginBottom: 32 }}>
            Sign in to your{' '}
            <span style={{ color: '#03375F', fontWeight: 500 }}>BcnCor</span>
            {' '}workspace
          </div>

          <form onSubmit={handleLogin} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B6070', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@bcncor.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', height: 42, padding: '0 14px',
                  border: '0.5px solid #DDE5ED', borderRadius: 8,
                  fontSize: 14, color: '#0F1F2E', outline: 'none',
                  fontFamily: F, background: '#fff', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4B6070', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', height: 42, padding: '0 14px',
                  border: '0.5px solid #DDE5ED', borderRadius: 8,
                  fontSize: 14, color: '#0F1F2E', outline: 'none',
                  fontFamily: F, background: '#fff', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: error ? 12 : 24 }}>
              <span style={{ fontSize: 12, color: '#3AAFDD', cursor: 'pointer' }}>Forgot password?</span>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                fontSize: 12, color: '#C0392B', background: '#FDF0EF',
                border: '0.5px solid #F5C6C2', borderRadius: 6,
                padding: '8px 12px', marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#024d87'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#03375F'; }}
              style={{
                width: '100%', height: 44,
                background: '#03375F', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: F,
                letterSpacing: '0.01em',
                transition: 'background 0.15s',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: '#EBF0F5' }} />
            <span style={{ fontSize: 11, color: '#B0BEC8' }}>internal access only</span>
            <div style={{ flex: 1, height: '0.5px', background: '#EBF0F5' }} />
          </div>

          {/* Footer */}
          <div style={{ fontSize: 12, textAlign: 'center', color: '#8A9BAA' }}>
            Need access?{' '}
            <span style={{ color: '#03375F', cursor: 'pointer', fontWeight: 500 }}>
              Contact your administrator
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}