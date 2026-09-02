import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const API    = `${BASE_URL}/api/workflows/blog`;
const F      = "'Inter', system-ui, sans-serif";
const COLOR  = '#3AAFDD';
const LIGHT  = '#EDF7FC';
const DARK   = '#1A6A8A';
const BORDER = '#B8E2F3';

const card = { background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '16px 20px' };

const STEPS = [
  { n: 1, title: 'Scrape articles',  desc: "Fetches full text from BcnCor's Blog and select which articles to process" },
  { n: 2, title: 'Send to Carousels', desc: 'Selected articles are added to the Carousels queue, ready for AI generation' },
  { n: 3, title: 'Publish',          desc: 'Approved and published content is available in the Calendar' },
];


const DEFAULT_TEMPLATE = [
  { slide: 1,     hook: true,  title: true,  subtitle: true,  body: false },
  { slide: 2,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 3,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 4,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 5,     hook: true,  title: true,  subtitle: false, body: true  },
  { slide: 'CTA', hook: false, title: false, subtitle: false, body: true  },
];

function fmtDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmt(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' at ' +
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function BlogPage() {
  const setTopbar = useSetTopbar();

  // remote state
  const [status,   setStatus]   = useState(null);
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [runLog,   setRunLog]   = useState([]);

  // UI state
  const [phase,       setPhase]       = useState('idle');
  const [error,       setError]       = useState(null);
  const [scraping,    setScraping]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [yearFilter,  setYearFilter]  = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Read template from localStorage (set on the Inbox page)
  function getTemplate() {
    try {
      const saved = localStorage.getItem('carouselTemplate');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
    } catch { return DEFAULT_TEMPLATE; }
  }

  useEffect(() => {
    setTopbar({ title: 'Blog workflow', subtitle: 'Scrape latest article → generate AI content', actions: null });
    loadStatus();
    handlePreview();
  }, []);

  async function loadStatus() {
    try {
      const r = await fetch(`${API}/status`);
      const d = await r.json();
      console.log('[BlogPage] status response:', d);
      setStatus(d);
    } catch {
      // backend not reachable yet — ignore silently
    }
  }

  async function handlePreview() {
    setPhase('previewing');
    setError(null);
    setArticles([]);
    setSelected(new Set());
    setRunLog([]);
    try {
      const r = await fetch(`${API}/preview`);
      if (!r.ok) throw new Error(`Preview failed: ${r.status}`);
      const data = await r.json();
      const list = Array.isArray(data) ? data : (data.articles || []);
      setArticles(list);
      setSelected(new Set());
      setPhase('ready');
    } catch (e) {
      setError(e.message);
      setPhase('error');
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRefresh() {
    setScraping(true);
    try {
      const r = await fetch(`${API}/refresh`, { method: 'POST' });
      if (!r.ok) throw new Error(`Scrape failed: ${r.status}`);
      const data = await r.json();
      const newArticles = data.articles || [];

      setArticles(prev => {
        const prevUrls = new Set(prev.map(a => a.url));
        const added = newArticles.filter(a => !prevUrls.has(a.url)).length;
        showToast(added > 0 ? `${added} new article${added !== 1 ? 's' : ''} found` : 'All articles up to date');
        return newArticles;
      });

      if (phase !== 'ready' && phase !== 'done') setPhase('ready');
    } catch (e) {
      setError(e.message);
      setPhase('error');
    } finally {
      setScraping(false);
    }
  }

  function toggleSelect(url) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === articles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(articles.map(a => a.url)));
    }
  }

  async function handleRun() {
    if (selected.size === 0) return;
    setPhase('running');
    setRunLog([]);
    const log = (text) => setRunLog(prev => [...prev, { time: new Date().toLocaleTimeString('es-ES'), text }]);
    try {
      log(`Scraping ${selected.size} article${selected.size > 1 ? 's' : ''}…`);
      const r = await fetch(`${API}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [...selected], template: getTemplate() }),
      });
      if (!r.ok) throw new Error(`Run failed: ${r.status}`);
      const result = await r.json();
      log(`${selected.size} article${selected.size !== 1 ? 's' : ''} processed`);
      log(`${result.queued} article${result.queued !== 1 ? 's' : ''} queued for carousel generation`);
      log(`${result.queued} item${result.queued !== 1 ? 's' : ''} added to carousel queue`);
      await loadStatus();
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('error');
    }
  }

  const isRunning = phase === 'running';
  const isDone    = phase === 'done';
  const lastRun   = status ? fmt(status.lastRun) : '—';

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // publishDate from DB is "YYYY-MM-DD" — parse as UTC. Returns null for missing
  // or implausible dates (scraper regex noise produces years like 2069, 2070).
  function parseArticleDate(a) {
    if (!a.publishDate) return null;
    const d = new Date(a.publishDate);
    if (isNaN(d.getTime())) return null;
    if (d.getUTCFullYear() > 2030) return null;
    return d;
  }

  function isNewArticle(a) {
    const pub = parseArticleDate(a);
    if (!pub) return false;
    const lastRunAt = status?.lastRun ? new Date(status.lastRun) : null;
    if (lastRunAt && !isNaN(lastRunAt.getTime())) return pub > lastRunAt;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    return pub > sevenDaysAgo;
  }

  const uniqueYears = [...new Set(
    articles.map(a => { const d = parseArticleDate(a); return d ? d.getUTCFullYear() : null; })
      .filter(Boolean)
  )].sort((a, b) => b - a).map(String);

  const uniqueMonths = yearFilter === 'all' ? [] : [...new Set(
    articles
      .map(a => { const d = parseArticleDate(a); return (d && String(d.getUTCFullYear()) === yearFilter) ? d.getUTCMonth() : null; })
      .filter(n => n !== null)
  )].sort((a, b) => b - a).map(m => ({ value: String(m + 1).padStart(2, '0'), label: MONTH_NAMES[m] }));

  const filteredArticles = [...articles]
    .filter(a => {
      const d = parseArticleDate(a);
      if (!d) return false; // exclude null dates and bad years
      if (yearFilter === 'all') return true;
      if (String(d.getUTCFullYear()) !== yearFilter) return false;
      if (monthFilter !== 'all' && String(d.getUTCMonth() + 1).padStart(2, '0') !== monthFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const da = parseArticleDate(a), db = parseArticleDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db - da;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a3a5c', color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontSize: 12, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Card 1 — How it works */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 3 }}>How it works</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Automated pipeline from source to publish</div>
        <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
              <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 24, width: 168, minHeight: 140, boxSizing: 'border-box', background: i === STEPS.length - 1 ? LIGHT : undefined }}>
                <div style={{ fontSize: 10, color: COLOR, fontWeight: 600, marginBottom: 4 }}>Step {step.n}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#C4C4C4', flexShrink: 0 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 — Control panel */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>
            {phase === 'idle'      ? 'Ready to run' :
             phase === 'previewing'? 'Fetching articles…' :
             phase === 'ready'     ? `${filteredArticles.length} articles found — select and run` :
             phase === 'running'   ? 'Running…' :
             phase === 'done'      ? 'Run complete' :
             'Error'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Last run: {lastRun}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, background: '#F0FAF6', color: '#2A7A4A', borderRadius: 12, padding: '3px 10px' }}>
            ● Active
          </span>

          {/* Scrape button — always visible */}
          <button onClick={handleRefresh} disabled={scraping} style={{
            padding: '0 16px', height: 34, background: '#fff', color: scraping ? 'var(--color-text-muted)' : COLOR,
            border: `1px solid ${scraping ? 'var(--color-border)' : COLOR}`, borderRadius: 6, fontSize: 12, fontWeight: 500,
            cursor: scraping ? 'not-allowed' : 'pointer', fontFamily: F,
          }}>
            {scraping ? 'Scraping…' : 'Scrape articles'}
          </button>

          {/* Run button — shown when articles are ready */}
          {phase === 'ready' && (
            <button
              onClick={handleRun}
              disabled={selected.size === 0}
              style={{
                padding: '0 16px', height: 34,
                background: selected.size === 0 ? '#ccc' : COLOR,
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 12, fontWeight: 500, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                fontFamily: F,
              }}>
              Run {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          )}

          {/* Running spinner */}
          {isRunning && (
            <span style={{ fontSize: 12, color: COLOR, fontWeight: 500 }}>Processing…</span>
          )}
        </div>
      </div>

      {/* Card 3 — Article list (shown when previewing/ready) */}
      {(phase === 'ready' || phase === 'previewing') && articles.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
              Select articles to process
            </div>
            <button onClick={toggleAll} style={{
              fontSize: 11, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F,
            }}>
              {selected.size === articles.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setMonthFilter('all'); }}
              style={{ fontSize: 11, padding: '4px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none', fontFamily: F, width: 110 }}>
              <option value="all">All years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
              style={{ fontSize: 11, padding: '4px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', outline: 'none', fontFamily: F, width: 120 }}>
              <option value="all">All months</option>
              {uniqueMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Showing {filteredArticles.length} articles</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredArticles.map(a => (
              <label key={a.url} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                padding: '10px 12px', borderRadius: 6,
                border: `0.5px solid ${selected.has(a.url) ? COLOR : 'var(--color-border)'}`,
                background: selected.has(a.url) ? LIGHT : '#fff',
              }}>
                <input
                  type="checkbox"
                  checked={selected.has(a.url)}
                  onChange={() => toggleSelect(a.url)}
                  style={{ marginTop: 2, accentColor: COLOR, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <a href={a.url} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, fontWeight: 500, color: COLOR, textDecoration: 'underline', textDecorationColor: BORDER, textUnderlineOffset: 3, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.color = DARK; e.currentTarget.style.textDecorationColor = DARK; }}
                      onMouseLeave={e => { e.currentTarget.style.color = COLOR; e.currentTarget.style.textDecorationColor = BORDER; }}>
                      {a.title} ↗
                    </a>
                    {isNewArticle(a) && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: COLOR, background: LIGHT, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>
                        NEW
                      </span>
                    )}
                  </div>
                  {a.publishDate && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3 }}>{fmtDate(a.publishDate)}</div>}
                  {a.summary && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{a.summary}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Card 4 — Run log / results */}
      {(isRunning || isDone || runLog.length > 0) && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>
            {isDone ? 'Run results' : 'Running…'}
          </div>

          {isDone && status && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Articles scraped',          value: selected.size },
                { label: 'Added to carousel queue',  value: status.inboxCount },
                { label: 'Pending generation',        value: status.inboxCount },
              ].map(({ label, value }) => (
                <div key={label} style={{ border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: COLOR, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: isDone ? '0.5px solid var(--color-border)' : 'none', paddingTop: isDone ? 14 : 0 }}>
            {isDone && <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 8 }}>Run log</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {runLog.map(({ time, text }, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', flexShrink: 0 }}>{time}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {phase === 'error' && error && (
        <div style={{ ...card, borderColor: '#F5C6CB', background: '#FFF5F5' }}>
          <div style={{ fontSize: 12, color: '#C0392B' }}>{error}</div>
        </div>
      )}

    </div>
  );
}