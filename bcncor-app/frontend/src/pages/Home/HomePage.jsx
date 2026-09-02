import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F = "'Inter', system-ui, sans-serif";

function todayString() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatLastScrape(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (d.toDateString() === new Date().toDateString()) return 'Today';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

const contentCard = {
  background: 'var(--color-surface)',
  border: '0.5px solid var(--color-border)',
  borderRadius: 10,
  padding: '18px 20px',
};

const metricCard = {
  background: 'var(--color-bg)',
  borderRadius: 10,
  padding: '16px 18px',
};

function Badge({ active }) {
  return active ? (
    <span style={{
      fontSize: 10, fontWeight: 600, color: '#065F46',
      background: '#D1FAE5', border: '0.5px solid #6EE7B7',
      borderRadius: 20, padding: '2px 8px', flexShrink: 0,
    }}>Active</span>
  ) : (
    <span style={{
      fontSize: 10, fontWeight: 600, color: '#6B7280',
      background: '#F3F4F6', border: '0.5px solid #E5E7EB',
      borderRadius: 20, padding: '2px 8px', flexShrink: 0,
    }}>Inactive</span>
  );
}

const EMPTY = {
  carouselsPending: '—',
  draftsPending: '—',
  competitorsTracked: '—',
  lastScrape: '—',
  scheduler: null,
  articles: { total: '—', highPriorityWeek: '—' },
  linkedin: { total: '—', week: '—' },
  instagram: { total: '—', week: '—' },
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const setTopbar = useSetTopbar();
  const [d, setD] = useState(EMPTY);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    setTopbar({
      title: `Good morning, ${firstName}`,
      subtitle: todayString(),
      actions: null,
    });
  }, [firstName]);

  useEffect(() => {
    const week = sevenDaysAgo();

    Promise.all([
      fetch(`${BASE_URL}/api/workflows/blog/carousels`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/blog-drafts`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/workflows/competitor/sources`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/workflows/competitor/status`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/scheduler/settings`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/workflows/competitor/articles`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/workflows/competitor/linkedin-posts`).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE_URL}/api/workflows/competitor/instagram-posts`).then(r => r.json()).catch(() => ({})),
    ]).then(([carouselsRaw, draftsRaw, sourcesRaw, statusRaw, schedulerRaw, articlesRaw, linkedinRaw, instagramRaw]) => {
      console.log('carousels', carouselsRaw);
      console.log('drafts', draftsRaw);
      console.log('sources', sourcesRaw);
      console.log('status', statusRaw);
      console.log('scheduler', schedulerRaw);
      console.log('articles', articlesRaw);
      console.log('linkedin', linkedinRaw);
      console.log('instagram', instagramRaw);

      const carouselList  = Array.isArray(carouselsRaw?.carousels) ? carouselsRaw.carousels : [];
      const draftList     = Array.isArray(draftsRaw?.drafts)       ? draftsRaw.drafts       : [];
      const competitors   = Array.isArray(sourcesRaw?.competitors) ? sourcesRaw.competitors : [];
      const articleList   = Array.isArray(articlesRaw?.articles)   ? articlesRaw.articles   : [];
      const linkedinList  = Array.isArray(linkedinRaw?.posts)      ? linkedinRaw.posts      : [];
      const instagramList = Array.isArray(instagramRaw?.posts)     ? instagramRaw.posts     : [];

      const settingsArr = Array.isArray(schedulerRaw?.settings) ? schedulerRaw.settings : [];
      const scheduler = Object.fromEntries(settingsArr.map(s => [s.pipeline, s]));

      setD({
        carouselsPending:  carouselList.filter(c => c.status === 'pending').length,
        draftsPending:     draftList.filter(d => d.status === 'pending').length,
        competitorsTracked: competitors.length,
        lastScrape:        formatLastScrape(statusRaw?.lastRunStats?.runAt),
        scheduler,
        articles: {
          total:             articleList.length,
          highPriorityWeek:  articleList.filter(a => a.priority === 'high' && new Date(a.publishDate) >= week).length,
        },
        linkedin: {
          total: linkedinList.length,
          week:  linkedinList.filter(p => new Date(p.date) >= week).length,
        },
        instagram: {
          total: instagramList.length,
          week:  instagramList.filter(p => new Date(p.date) >= week).length,
        },
      });
    });
  }, []);

  function schedulerLabel(pipeline) {
    const s = d.scheduler?.[pipeline];
    if (!s) return '—';
    return `${s.day ?? '—'} · ${s.time ?? '—'}`;
  }

  const blogEnabled       = d.scheduler?.blog?.enabled       === true || d.scheduler?.blog?.enabled       === 'true';
  const competitorEnabled = d.scheduler?.competitor?.enabled === true || d.scheduler?.competitor?.enabled === 'true';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F }}>

      {/* ── Row 1: Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Carousels pending',   value: d.carouselsPending,   color: '#7F77DD' },
          { label: 'Blog drafts pending', value: d.draftsPending,      color: '#1D9E75' },
          { label: 'Competitors tracked', value: d.competitorsTracked, color: '#378ADD' },
          { label: 'Last scrape',         value: d.lastScrape,         color: 'var(--color-text)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={contentCard}>
            <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Pipelines + Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.72fr', gap: 10 }}>

        {/* Pipelines */}
        <div style={contentCard}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14 }}>Pipelines</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3AAFDD', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>Blog → Carousels</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>{schedulerLabel('blog')}</div>
              </div>
              <Badge active={blogEnabled} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2F4B8C', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>Competitor → Blog drafts</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>{schedulerLabel('competitor')}</div>
              </div>
              <Badge active={competitorEnabled} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 8, opacity: 0.5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>Ecosystem news</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>Not configured</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#92400E',
                background: '#FEF3C7', border: '0.5px solid #FDE68A',
                borderRadius: 20, padding: '2px 8px', flexShrink: 0,
              }}>Soon</span>
            </div>

          </div>
        </div>

        {/* Quick actions */}
        <div style={contentCard}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14 }}>Quick actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Review carousels',        to: '/carousels',           count: d.carouselsPending   },
              { label: 'Review blog drafts',       to: '/blog-drafts',         count: d.draftsPending      },
              { label: 'Score competitor content', to: '/workflows/competitor', count: d.articles.total    },
              { label: 'View calendar',            to: '/calendar',            count: null                 },
            ].map(({ label, to, count }) => (
              <div
                key={label}
                onClick={() => navigate(to)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 8,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
                {count !== null && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#1A6A8A',
                    background: 'var(--color-blue-light)', borderRadius: 20, padding: '2px 9px',
                  }}>
                    {count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Row 3: Competitor overview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>

        <div style={metricCard}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#378ADD', lineHeight: 1, marginBottom: 5 }}>{d.articles.total}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Blog articles</div>
        </div>

        <div style={metricCard}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0A66C2', lineHeight: 1, marginBottom: 5 }}>{d.linkedin.total}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>LinkedIn posts</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 3 }}>{d.linkedin.week} this week</div>
        </div>

        <div style={metricCard}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C13584', lineHeight: 1, marginBottom: 5 }}>{d.instagram.total}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Instagram posts</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 3 }}>{d.instagram.week} this week</div>
        </div>

        <div style={metricCard}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', lineHeight: 1, marginBottom: 5 }}>{d.articles.highPriorityWeek}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>High priority this week</div>
        </div>

      </div>

    </div>
  );
}
