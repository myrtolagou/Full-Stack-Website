import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import './Sidebar.css';

const SECTIONS = [
  {
    label: 'Sources',
    links: [
      { to: '/workflows/blog',       label: 'Blog',               dot: '#3AAFDD' },
      { to: '/workflows/news',       label: 'Ecosystem news',     dot: '#D95E8A', soon: true },
      { to: '/workflows/competitor', label: 'Competitor monitor', dot: '#2F4B8C' },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/carousels',   label: 'Carousels',   dot: '#4E6278', badge: { bg: 'rgba(58,175,221,0.12)', color: '#8DCFE8' } },
      { to: '/blog-drafts', label: 'Blog drafts', dot: '#1D9E75', badge: { bg: 'rgba(58,175,221,0.12)', color: '#8DCFE8' } },
      { to: '/instagram', label: 'Instagram',      dot: '#D95E8A', soon: true },
      { to: '/linkedin',  label: 'LinkedIn',       dot: '#3AAFDD', soon: true },
    ],
  },
  {
    label: 'Automations',
    links: [
      { to: '/scheduler', label: 'Scheduler', dot: '#A78BFA' },
    ],
  },
  {
    label: 'Publish',
    links: [
      { to: '/calendar', label: 'Calendar', dot: '#A78BFA' },
    ],
  },
  {
    label: 'Insights',
    links: [
      { to: '/analytics', label: 'Analytics', dot: '#4E6278' },
    ],
  },
  {
    label: 'Manage',
    links: [
      { to: '/users',    label: 'Users',    dot: '#4E6278' },
      { to: '/settings', label: 'Settings', dot: '#4E6278' },
    ],
  },
];

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

const F = "'Inter', system-ui, sans-serif";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const [counts, setCounts] = useState({});
  useEffect(() => {
    const pending = items => Array.isArray(items) ? items.filter(i => i.status === 'pending').length : 0;
    Promise.allSettled([
      fetch(`${BASE_URL}/api/workflows/blog/carousels`).then(r => r.json()),
      fetch(`${BASE_URL}/api/blog-drafts`).then(r => r.json()),
    ]).then(([carouselsRes, draftsRes]) => {
      const carouselItems = carouselsRes.status === 'fulfilled' ? (carouselsRes.value.carousels ?? carouselsRes.value.items ?? carouselsRes.value) : [];
      const draftItems    = draftsRes.status    === 'fulfilled' ? (draftsRes.value.drafts    ?? draftsRes.value.items    ?? draftsRes.value)    : [];
      setCounts({
        '/carousels':   pending(carouselItems),
        '/blog-drafts': pending(draftItems),
      });
    });
  }, []);

  return (
    <div style={{
      width: 210,
      minHeight: '100vh',
      background: 'var(--color-sidebar-bg)',
      borderRight: '0.5px solid var(--color-sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      fontFamily: F,
    }}>

      {/* ── Logo ── */}
      <div
        onClick={() => navigate('/')}
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
      >
        <img
          src="/logo.png"
          alt="BcnCor"
          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />
      </div>

      {/* ── Nav ── */}
      <div className="sidebar-scroll" style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {SECTIONS.map(({ label, links }) => (
          <div key={label} style={{ marginBottom: 2 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-sidebar-section)',
              textTransform: 'uppercase', letterSpacing: '0.7px',
              padding: '10px 8px 4px',
            }}>
              {label}
            </div>

            {links.map(({ to, label: lbl, dot, badge, soon }) => {
              const active = isActive(to);
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-sidebar-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: active ? 'var(--color-sidebar-active-bg)' : 'transparent',
                    color: active ? 'var(--color-sidebar-active)' : 'var(--color-sidebar-text)',
                    fontWeight: active ? 500 : 400,
                    fontSize: 12, textAlign: 'left', fontFamily: F,
                    transition: 'background 0.1s',
                    opacity: soon ? 0.6 : 1,
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: active ? 'var(--color-sidebar-active)' : dot, flexShrink: 0,
                  }} />
                  <span style={{ flex: 1 }}>{lbl}</span>
                  {soon && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.3px',
                      background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                      borderRadius: 10, padding: '1px 6px', textTransform: 'uppercase',
                    }}>
                      Soon
                    </span>
                  )}
                  {badge && (counts[to] ?? 0) > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      background: badge.bg, color: badge.color,
                      borderRadius: 10, padding: '1px 6px',
                    }}>
                      {counts[to]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── User ── */}
      <div style={{
        padding: '12px 14px', borderTop: '0.5px solid var(--color-sidebar-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#3AAFDD',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-sidebar-active)', fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>
          {user ? getInitials(user.name) : 'U'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#C8D8E4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name ?? 'User'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-sidebar-text)' }}>{user?.role ?? 'Member'}</div>
        </div>
      </div>
    </div>
  );
}