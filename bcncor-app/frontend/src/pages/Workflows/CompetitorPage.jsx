import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const API  = `${BASE_URL}/api/workflows/competitor`;
const F    = "'Inter', system-ui, sans-serif";
const card = { background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '16px 20px' };

const COLORS = {
  'competitor-3':       { border: '#378ADD', bg: '#E6F1FB', text: '#0C447C' },
  'competitor-7':       { border: '#D4537E', bg: '#FBEAF0', text: '#72243E' },
  'competitor-5':  { border: '#EF9F27', bg: '#FAEEDA', text: '#633806' },
  'competitor-1':        { border: '#1D9E75', bg: '#E1F5EE', text: '#085041' },
  'competitor-2': { border: '#7F77DD', bg: '#EEEDFE', text: '#3C3489' },
  'competitor-6':      { border: '#D85A30', bg: '#FAECE7', text: '#712B13' },
  'competitor-4':        { border: '#639922', bg: '#EAF3DE', text: '#27500A' },
};

const LINKEDIN_POSTS = [
  { id: 'competitor-7',       date: '22 Mar', text: 'Nueva convocatoria CDTI 2026: hasta 2M€ en financiación no dilutiva...' },
  { id: 'competitor-3',       date: '21 Mar', text: 'Las deducciones fiscales por I+D+i pueden suponer un ahorro del 42%...' },
  { id: 'competitor-5',  date: '20 Mar', text: 'Recordatorio fiscal: El plazo para la presentación del Impuesto de Sociedades finaliza el próximo mes...' },
  { id: 'competitor-2', date: '20 Mar', text: 'El ecosistema de startups español sigue creciendo 📈 En 2025 se invirtieron más de 3.000M€...' },
];


const MOCK_TOP_PICKS = [
  {
    channel: 'Blog', channelColor: '#185FA5', isTop: true,
    score: 9, outOf: 9, priorityLabel: 'High priority', priorityBg: '#B5D4F4', priorityColor: '#0C447C',
    title: 'How to Prepare Your Startup for Seed Funding in Spain',
    competitor: 'Competitor 3', timeAgo: '3 days ago',
    dims: [
      { label: 'Relevance',  score: 3, max: 3, fill: '#1a3a5c' },
      { label: 'Intent',     score: 2, max: 2, fill: '#1a3a5c' },
      { label: 'SEO',        score: 2, max: 2, fill: '#1a3a5c' },
      { label: 'Engagement', na: true },
      { label: 'Gap',        na: true },
    ],
    btnLabel: '↻ Rephrase & send', btnPrimary: true,
  },
  {
    channel: 'LinkedIn', channelColor: '#27500A', isTop: false, soon: true,
    score: 8, outOf: 10, priorityLabel: 'High priority', priorityBg: '#B5D4F4', priorityColor: '#0C447C',
    title: 'CFO Externo: ¿Cuándo lo necesita tu empresa?',
    competitor: 'Competitor 2', timeAgo: '5 days ago',
    dims: [
      { label: 'Relevance',  score: 3, max: 3, fill: '#1a3a5c' },
      { label: 'Intent',     score: 1, max: 2, fill: '#1a3a5c' },
      { label: 'SEO',        na: true },
      { label: 'Engagement', score: 2, max: 2, fill: '#1a3a5c' },
      { label: 'Gap',        score: 1, max: 1, fill: '#1D9E75', bonus: true },
    ],
    btnLabel: '↻ Adapt as post', btnPrimary: false,
  },
  {
    channel: 'Newsletter', channelColor: '#633806', isTop: false, soon: true,
    score: 6, outOf: 8, priorityLabel: 'Medium priority', priorityBg: '#FAC775', priorityColor: '#633806',
    title: 'Fundraising trends for Spanish startups in 2026',
    competitor: 'Competitor 6', timeAgo: '1 week ago',
    dims: [
      { label: 'Relevance',  score: 2, max: 3, fill: '#1a3a5c' },
      { label: 'Intent',     score: 2, max: 2, fill: '#1a3a5c' },
      { label: 'SEO',        na: true },
      { label: 'Engagement', na: true },
      { label: 'Gap',        score: 1, max: 1, fill: '#1D9E75', bonus: true },
    ],
    btnLabel: '↻ Write article', btnPrimary: false,
  },
  {
    channel: 'Instagram', channelColor: '#888780', isTop: false, soon: true,
    score: null, outOf: null, priorityLabel: null,
    title: 'Instagram scraping not yet connected',
    competitor: '—', timeAgo: '—',
    dims: [
      { label: 'Relevance',  na: true },
      { label: 'Intent',     na: true },
      { label: 'SEO',        na: true },
      { label: 'Engagement', na: true },
      { label: 'Gap',        na: true },
    ],
    btnLabel: 'Set up Apify', btnPrimary: false,
  },
];

const COMPETITOR_COLORS = {
  'competitor-3':        { bg: '#E6F1FB', color: '#0C447C' },
  'competitor-7':        { bg: '#FBEAF0', color: '#72243E' },
  'competitor-5':   { bg: '#FAEEDA', color: '#633806' },
  'competitor-1':         { bg: '#E1F5EE', color: '#085041' },
  'competitor-2':  { bg: '#EEEDFE', color: '#3C3489' },
  'competitor-6':       { bg: '#FAECE7', color: '#712B13' },
  'competitor-4':         { bg: '#EAF3DE', color: '#27500A' },
};

function getInitials(name) {
  const words = (name || '').split(' ').filter(Boolean);
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function extractCategories(title) {
  if (!title) return [];
  const lower = title.toLowerCase();
  const categories = [];
  if (lower.includes('enisa')) categories.push('ENISA');
  if (lower.includes('cdti') || lower.includes('neotec')) categories.push('CDTI');
  if (lower.includes('i+d') || lower.includes('i+d+i')) categories.push('I+D+i');
  if (lower.includes('tax lease')) categories.push('Tax Lease');
  if (lower.includes('seed') || lower.includes('ronda') || lower.includes('inversión') || lower.includes('inversion')) categories.push('Fundraising');
  if (lower.includes('cfo') || lower.includes('financiero') || lower.includes('finanzas')) categories.push('CFO / Finanzas');
  if (lower.includes('startup')) categories.push('Startups');
  if (lower.includes('subvención') || lower.includes('subvenciones') || lower.includes('ayuda')) categories.push('Subvenciones');
  if (lower.includes('fiscal') || lower.includes('deducción') || lower.includes('deducciones')) categories.push('Fiscalidad');
  if (lower.includes('horizon') || lower.includes('eic') || lower.includes('europeo') || lower.includes('european')) categories.push('EU Funding');
  if (lower.includes('pyme') || lower.includes('pymes')) categories.push('Pymes');
  if (lower.includes('runway') || lower.includes('cashflow') || lower.includes('liquidez')) categories.push('Cashflow');
  if (lower.includes('due diligence')) categories.push('Due diligence');
  if (lower.includes('cap table') || lower.includes('equity')) categories.push('Cap table');
  if (lower.includes('ia') || lower.includes('inteligencia artificial') || lower.includes('ai')) categories.push('IA');
  return categories.slice(0, 4);
}

function getCompetitorStyle(competitorId) {
  const map = {
    'competitor-3':        { bg: '#E6F1FB', color: '#0C447C' },
    'competitor-7':        { bg: '#FBEAF0', color: '#72243E' },
    'competitor-5':   { bg: '#FAEEDA', color: '#633806' },
    'competitor-1':         { bg: '#E1F5EE', color: '#085041' },
    'competitor-2':  { bg: '#EEEDFE', color: '#3C3489' },
    'competitor-6':       { bg: '#FAECE7', color: '#712B13' },
    'competitor-4':         { bg: '#EAF3DE', color: '#27500A' },
  };
  return map[competitorId] || { bg: '#E6F1FB', color: '#0C447C' };
}

function getPostType(post) {
  if (post.isRepost) return 'repost';
  if (post.articleTitle || post.articleUrl) return 'article';
  return 'original';
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function fmtDate(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' at ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function Badge({ bg, color, children }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: bg, color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function ExpandRow({ item }) {
  const d = item.dimensions || {};
  const dims = item._type === 'blog'
    ? [
        { label: 'Strategic', value: d.strategic, max: 3 },
        { label: 'Intent',    value: d.intent,    max: 2 },
        { label: 'SEO',       value: d.seo,       max: 2 },
        { label: 'Gap',       value: d.gap,       isGap: true },
      ]
    : [
        { label: 'Strategic',  value: d.strategic,  max: 3 },
        { label: 'Intent',     value: d.intent,     max: 2 },
        { label: 'Engagement', value: d.engagement, max: 2 },
        { label: 'Gap',        value: d.gap,        isGap: true },
      ];
  return (
    <tr>
      <td colSpan={7} style={{ padding: '0 10px 10px', background: 'var(--color-background)' }}>
        <div style={{
          display: 'flex', gap: 16, padding: '10px 14px', borderRadius: 6,
          border: '0.5px solid var(--color-border)', background: '#fff',
        }}>
          {dims.map((dim, i) => {
            const val    = dim.value ?? null;
            const na     = val == null;
            const isGap  = dim.isGap;
            const barPct = isGap ? Math.max(0, (val + 1) / 2 * 100) : na ? 0 : val / dim.max * 100;
            const barColor = isGap
              ? (val === 1 ? '#1D9E75' : val === -1 ? '#D95E8A' : '#A0A0A0')
              : '#1a3a5c';
            const valLabel = na ? 'N/A' : isGap ? (val === 1 ? '+1' : String(val)) : `${val}/${dim.max}`;
            const valColor = na ? 'var(--color-text-muted)'
              : isGap && val === 1  ? '#1D9E75'
              : isGap && val === -1 ? '#D95E8A'
              : 'var(--color-text)';
            return (
              <div key={i} style={{ flex: 1, minWidth: 70 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{dim.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: valColor }}>{valLabel}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)' }}>
                  {!na && <div style={{ height: '100%', borderRadius: 2, background: barColor, width: `${barPct}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

export default function CompetitorPage() {
  const setTopbar  = useSetTopbar();
  const navigate   = useNavigate();

  const [sources,         setSources]        = useState([]);
  const [articles,        setArticles]       = useState([]);
  const [status,          setStatus]         = useState(null);
  const [running,         setRunning]        = useState(false);
  const [activeFilter,    setActiveFilter]   = useState('all');
  const [sentIds,         setSentIds]        = useState(new Set());
  const [activeTab,       setActiveTab]      = useState('overview');
  const [toast,           setToast]          = useState(null);
  const [blogFilter,      setBlogFilter]     = useState('all');
  const [blogSort,        setBlogSort]       = useState('newest');
  const [liFilter,        setLiFilter]       = useState('all');
  const [liTypeFilter,    setLiTypeFilter]   = useState('all');
  const [liSort,          setLiSort]         = useState('recent');
  const [scoreFilter,     setScoreFilter]    = useState('all');
  const [channelFilter,   setChannelFilter]  = useState('all');
  const [scoring,         setScoring]        = useState(false);
  const [sortDir,         setSortDir]        = useState('desc');
  const [linkedInPosts,   setLinkedInPosts]  = useState([]);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [postToasts,      setPostToasts]     = useState({});
  const [instagramPosts,   setInstagramPosts]   = useState([]);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [igFilter,              setIgFilter]              = useState('all');
  const [igTypeFilter,          setIgTypeFilter]          = useState('all');
  const [igSort,                setIgSort]                = useState('recent');
  const [scoringLinkedInPosts,  setScoringLinkedInPosts]  = useState([]);
  const [scoringInstagramPosts, setScoringInstagramPosts] = useState([]);
  const [scoringLabel,          setScoringLabel]          = useState('Scoring…');
  const [expandedRows,          setExpandedRows]          = useState(new Set());
  const [twChannelFilter,       setTwChannelFilter]       = useState('all');
  const [twPriorityFilter,      setTwPriorityFilter]      = useState('all');
  const [twPage,                setTwPage]                = useState(1);
  const [allPage,               setAllPage]               = useState(1);
  const [topPicksWeekOffset,    setTopPicksWeekOffset]    = useState(0);

  useEffect(() => {
    setTopbar({ title: 'Competitor monitor', subtitle: 'Scrape competitor blogs → score → inbox', actions: null });
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeTab !== 'linkedin') return;
    setLinkedInLoading(true);
    fetch(`${API}/linkedin-posts`)
      .then(r => r.json())
      .then(d => setLinkedInPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setLinkedInLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'instagram') return;
    setInstagramLoading(true);
    fetch(`${API}/instagram-posts`)
      .then(r => r.json())
      .then(d => setInstagramPosts(d.posts || []))
      .catch(() => {})
      .finally(() => setInstagramLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'scoring') return;
    fetch(`${API}/linkedin-posts`)
      .then(r => r.json())
      .then(d => setScoringLinkedInPosts(d.posts || []))
      .catch(() => {});
    fetch(`${API}/instagram-posts`)
      .then(r => r.json())
      .then(d => setScoringInstagramPosts(d.posts || []))
      .catch(() => {});
  }, [activeTab]);

  async function fetchAll() {
    const [srcRes, artRes, stRes] = await Promise.all([
      fetch(`${API}/sources`).then(r => r.json()).catch(() => ({ competitors: [] })),
      fetch(`${API}/articles`).then(r => r.json()).catch(() => ({ articles: [] })),
      fetch(`${API}/status`).then(r => r.json()).catch(() => null),
    ]);
    setSources(srcRes.competitors || []);
    setArticles(artRes.articles   || []);
    setStatus(stRes);
  }

  function showToast(msg, duration = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }

  async function handleRun(blogOnly = false) {
    if (!blogOnly) {
      const confirmed = window.confirm(
        'Run full workflow?\n\n' +
        '• Blog scraping: free\n' +
        '• LinkedIn scraping via Apify: uses credits\n\n' +
        'This will call Apify and consume your credits. Continue?'
      );
      if (!confirmed) return;
    }

    setRunning(true);
    showToast(`${blogOnly ? 'Running blog scrape' : 'Running full workflow'} — scraping ${sources.length || 7} competitors...`, 60000);
    try {
      await fetch(`${API}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogOnly ? { blogOnly: true } : {}),
      });
      await fetchAll();
      setToast('Run complete — switching to Scoring tab');
      setTimeout(() => { setToast(null); setActiveTab('scoring'); }, 800);
    } catch { setToast(null); }
    setRunning(false);
  }

  async function fetchScoringData() {
    const [liRes, igRes] = await Promise.all([
      fetch(`${API}/linkedin-posts`).then(r => r.json()).catch(() => ({ posts: [] })),
      fetch(`${API}/instagram-posts`).then(r => r.json()).catch(() => ({ posts: [] })),
    ]);
    setScoringLinkedInPosts(liRes.posts || []);
    setScoringInstagramPosts(igRes.posts || []);
  }

  async function handleScore() {
    setScoring(true);
    setScoringLabel('Scoring…');
    let scoredSoFar = 0;
    let total = null;
    try {
      let remaining = Infinity;
      while (remaining > 0) {
        const r = await fetch(`${API}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 10 }),
        });
        if (!r.ok) throw new Error('Request failed');
        const data = await r.json();
        scoredSoFar += data.scored;
        remaining = data.remaining;
        if (total === null) total = scoredSoFar + remaining;
        setScoringLabel(`Scoring… ${scoredSoFar}/${total}`);
        setToast(`Scoring… ${scoredSoFar}/${total}`);
        await fetchAll();
        await fetchScoringData();
      }
      showToast(`Scored ${scoredSoFar} item${scoredSoFar !== 1 ? 's' : ''} successfully`);
    } catch {
      showToast('Scoring failed — check backend logs');
    }
    setScoringLabel('Scoring…');
    setScoring(false);
  }

  async function handleSendToInbox(articleId) {
    try {
      const r = await fetch(`${API}/articles/${articleId}/send-to-inbox`, { method: 'POST' });
      if (r.ok) setSentIds(prev => new Set([...prev, articleId]));
    } catch { /* ignore */ }
  }

  function toggleRow(id) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function countFor(competitorId) {
    return articles.filter(a => a.competitorId === competitorId).length;
  }

  const lastRunAt = status?.lastRunStats?.runAt;

  const statsRow = [
    { label: 'Competitors scraped', value: status?.lastRunStats?.competitorsScraped ?? '—' },
    { label: 'Articles found',      value: status?.lastRunStats?.articlesFound      ?? '—' },
    { label: 'Sent to inbox',       value: sentIds.size },
  ];



  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fmtWeekRange(monday) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    const start = monday.toLocaleDateString('en-GB', opts);
    const end   = sunday.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
    return `${start} – ${end}`;
  }

  const currentMonday = getMondayOfWeek(new Date());
  const picksMonday   = new Date(currentMonday);
  picksMonday.setDate(currentMonday.getDate() + topPicksWeekOffset * 7);
  const picksSunday   = new Date(picksMonday);
  picksSunday.setDate(picksMonday.getDate() + 6);
  picksSunday.setHours(23, 59, 59, 999);

  function topPickForWeek(items, dateKey) {
    return [...items]
      .filter(item => {
        if (item.score == null) return false;
        const d = new Date(item[dateKey]);
        if (isNaN(d.getTime())) return false;
        return d >= picksMonday && d <= picksSunday;
      })
      .sort((a, b) => b.score - a.score)[0] ?? null;
  }

  const topBlogPick      = topPickForWeek(articles,             'publishDate');
  const topLinkedInPick  = topPickForWeek(scoringLinkedInPosts,  'date');
  const topInstagramPick = topPickForWeek(scoringInstagramPosts, 'date');

  const allScoredItems = [
    ...articles.map(a => ({
      id: a.id, _type: 'blog',
      competitor: a.competitorName, competitorId: a.competitorId,
      title: a.title, date: a.publishDate, url: a.url,
      score: a.score, priority: a.priority, sentToInbox: a.sentToInbox,
      dimensions: a.dimensions,
    })),
    ...scoringLinkedInPosts.map(p => ({
      id: p.id, _type: 'linkedin',
      competitor: p.competitor, competitorId: p.competitorId,
      title: p.title || p.content?.split('\n')[0],
      date: p.date, url: p.url,
      score: p.score, priority: p.priority, sentToInbox: false,
      dimensions: p.dimensions,
    })),
    ...scoringInstagramPosts.map(p => ({
      id: p.id, _type: 'instagram',
      competitor: p.competitor, competitorId: p.competitorId,
      title: p.content?.split('\n')[0],
      date: p.date, url: p.url,
      score: p.score, priority: p.priority, sentToInbox: false,
      dimensions: p.dimensions,
    })),
  ];

  const scoredFiltered = allScoredItems
    .filter(item => {
      if (item.score == null) return false;
      if (channelFilter !== 'all' && item._type !== channelFilter) return false;
      if (scoreFilter === 'all')    return true;
      if (scoreFilter === 'high')   return item.score >= 6;
      if (scoreFilter === 'medium') return item.score >= 4 && item.score < 6;
      return item.score < 4;
    })
    .sort((a, b) => sortDir === 'desc' ? (b.score ?? 0) - (a.score ?? 0) : (a.score ?? 0) - (b.score ?? 0));

  async function handleCreateBlogDraft(item) {
    try {
      const res = await fetch(`${BASE_URL}/api/blog-drafts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url, title: item.title, competitor: item.competitor, score: item.score }),
      });
      if (res.ok) navigate('/blog-drafts');
      else alert('Failed to create draft');
    } catch { alert('Failed to create draft'); }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekItems = allScoredItems
    .filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      if (isNaN(d.getTime()) || d <= sevenDaysAgo) return false;
      if (twChannelFilter !== 'all' && item._type !== twChannelFilter) return false;
      if (twPriorityFilter !== 'all' && item.priority !== twPriorityFilter) return false;
      return true;
    })
    .sort((a, b) => (b.score ?? -99) - (a.score ?? -99));

  const TW_PAGE_SIZE  = 20;
  const twTotalPages  = Math.max(1, Math.ceil(thisWeekItems.length / TW_PAGE_SIZE));
  const twPageItems   = thisWeekItems.slice((twPage - 1) * TW_PAGE_SIZE, twPage * TW_PAGE_SIZE);

  const ALL_PAGE_SIZE = 20;
  const allTotalPages = Math.max(1, Math.ceil(scoredFiltered.length / ALL_PAGE_SIZE));
  const allPageItems  = scoredFiltered.slice((allPage - 1) * ALL_PAGE_SIZE, allPage * ALL_PAGE_SIZE);

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'scoring',    label: 'Scoring' },
    { key: 'blog',       label: 'Blog articles', count: articles.length },
    { key: 'linkedin',   label: 'LinkedIn', count: linkedInPosts.length > 0 ? linkedInPosts.length : undefined },
    { key: 'instagram',  label: 'Instagram', count: instagramPosts.length > 0 ? instagramPosts.length : undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: F, minHeight: 0 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a3a5c', color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontSize: 12, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '0.5px solid var(--color-border)',
        background: '#fff', marginBottom: 16, flexShrink: 0,
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', border: 'none', borderBottom: active ? '2px solid #0f2640' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', fontFamily: F,
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#0f2640' : 'var(--color-text-muted)',
                marginBottom: -1,
              }}>
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: '#E6F1FB', color: '#0C447C' }}>
                  {tab.count}
                </span>
              )}
              {tab.soon && (
                <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 8, background: '#FAEEDA', color: '#633806' }}>
                  soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Competitor grid */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>Competitors</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                7 sources configured — last scraped {fmtDate(lastRunAt)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {sources.map(c => {
                const col   = COLORS[c.id] || { border: '#999', bg: '#f5f5f5', text: '#333' };
                const count = countFor(c.id);
                return (
                  <div key={c.id} style={{
                    borderRadius: 6, padding: '12px 14px', background: '#fff',
                    borderTop: '0.5px solid var(--color-border)', borderRight: '0.5px solid var(--color-border)',
                    borderBottom: '0.5px solid var(--color-border)', borderLeft: `3px solid ${col.border}`,
                  }}>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <img
                        src={`/competitor-logos/${c.id}.png`} alt={c.name}
                        style={{ maxHeight: c.id === 'competitor-2' ? 48 : 32, maxWidth: '100%', objectFit: 'contain', objectPosition: 'left' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }}
                      />
                      <span style={{ display: 'none', fontSize: 12, fontWeight: 600, color: col.text }}>{c.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Run bar */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>
                {running ? 'Running workflow...' : 'Ready to run'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Last run: {fmtDateTime(lastRunAt)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 500, background: '#F0FAF6', color: '#2A7A4A', borderRadius: 12, padding: '3px 10px' }}>
                ● Active
              </span>
              <button onClick={() => handleRun(true)} disabled={running} style={{
                padding: '0 16px', height: 34, borderRadius: 6,
                background: running ? '#7a8ea8' : 'var(--color-surface)',
                color: running ? '#fff' : 'var(--color-text-muted)',
                border: '0.5px solid var(--color-border)',
                fontSize: 12, fontWeight: 500,
                cursor: running ? 'not-allowed' : 'pointer', fontFamily: F,
              }}>
                {running ? 'Running…' : 'Run blog only'}
              </button>
              <button onClick={() => handleRun(false)} disabled={running} style={{
                padding: '0 16px', height: 34, border: 'none', borderRadius: 6,
                background: running ? '#7a8ea8' : '#2F4B8C',
                color: '#fff', fontSize: 12, fontWeight: 500,
                cursor: running ? 'not-allowed' : 'pointer', fontFamily: F,
              }}>
                {running ? 'Running…' : 'Run full workflow'}
              </button>
            </div>
          </div>

          {/* Stats + run log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Last run results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {statsRow.map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '0.5px solid var(--color-border)', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#2F4B8C' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Run log</div>
              {status?.runLog?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {status.runLog.map(({ time, text }, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2F4B8C', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{fmtTime(time)}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No runs yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SCORING ── */}
      {activeTab === 'scoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top picks card — Sections A + B */}
          <div style={card}>
            {/* Top pick per channel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>Top pick per channel</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Highest scoring content from each source — act on these first</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setTopPicksWeekOffset(o => o - 1)}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-muted)', fontFamily: F,
                  }}
                >←</button>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', minWidth: 140, textAlign: 'center' }}>
                  {fmtWeekRange(picksMonday)}
                </span>
                <button
                  onClick={() => setTopPicksWeekOffset(o => Math.min(0, o + 1))}
                  disabled={topPicksWeekOffset >= 0}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: '0.5px solid var(--color-border)',
                    background: 'var(--color-surface)', cursor: topPicksWeekOffset >= 0 ? 'default' : 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: topPicksWeekOffset >= 0 ? 'var(--color-border)' : 'var(--color-text-muted)', fontFamily: F,
                    opacity: topPicksWeekOffset >= 0 ? 0.4 : 1,
                  }}
                >→</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>

              {/* ── Blog card (real data) ── */}
              <div style={{
                borderRadius: 6, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 7,
                border: '1.5px solid #185FA5', background: '#E6F1FB',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#185FA5' }}>Blog</div>
                {topBlogPick ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 500, color: '#1a3a5c' }}>{topBlogPick.score}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/ 8 pts</span>
                    </div>
                    <Badge
                      bg={topBlogPick.score >= 6 ? '#B5D4F4' : topBlogPick.score >= 4 ? '#FAC775' : '#F1EFE8'}
                      color={topBlogPick.score >= 6 ? '#0C447C' : topBlogPick.score >= 4 ? '#633806' : '#5F5E5A'}
                    >
                      {topBlogPick.score >= 6 ? 'High priority' : topBlogPick.score >= 4 ? 'Medium priority' : 'Low priority'}
                    </Badge>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4 }}>{topBlogPick.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{topBlogPick.competitorName} · {topBlogPick.publishDate || 'No date'}</div>
                    {topBlogPick.dimensions && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                        {[
                          { label: 'Strategic', value: topBlogPick.dimensions.strategic, max: 3 },
                          { label: 'Intent',    value: topBlogPick.dimensions.intent,    max: 2 },
                          { label: 'SEO',       value: topBlogPick.dimensions.seo,       max: 2 },
                          { label: 'Gap', value: topBlogPick.dimensions.gap, max: 1, bonus: topBlogPick.dimensions.gap === 1 },
                        ].map((dim, di) => (
                          <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: 'var(--color-text-muted)', width: 50, flexShrink: 0 }}>{dim.label}</span>
                            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--color-border)' }}>
                              {!dim.na && <div style={{ height: '100%', borderRadius: 2, background: dim.bonus ? '#1D9E75' : '#1a3a5c', width: `${dim.value / dim.max * 100}%` }} />}
                            </div>
                            <span style={{ fontSize: 9, width: 22, textAlign: 'right', flexShrink: 0, fontStyle: dim.na ? 'italic' : 'normal', color: dim.na ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                              {dim.na ? 'N/A' : `${dim.value}/${dim.max}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <a href={topBlogPick.url} target="_blank" rel="noopener noreferrer" style={{
                      width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500,
                      cursor: 'pointer', background: '#1a3a5c', color: '#fff', border: 'none',
                      textAlign: 'center', textDecoration: 'none', display: 'block',
                    }}>View article ↗</a>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                    No top pick for this week
                  </div>
                )}
              </div>

              {/* ── LinkedIn (real data) ── */}
              {(() => {
                const pick = topLinkedInPick;
                const dims = pick ? [
                  { label: 'Strategic',   value: pick.dimensions?.strategic,   max: 3 },
                  { label: 'Intent',      value: pick.dimensions?.intent,      max: 2 },
                  { label: 'Engagement',  value: pick.dimensions?.engagement,  max: 2 },
                  { label: 'Gap',         value: pick.dimensions?.gap,         isGap: true },
                ] : [];
                return (
                  <div style={{
                    borderRadius: 6, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 7,
                    border: pick ? '1.5px solid #0A66C2' : '0.5px solid var(--color-border)',
                    background: pick ? '#E1EFF8' : 'transparent',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0A66C2' }}>LinkedIn</div>
                    {pick ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 20, fontWeight: 500, color: '#1a3a5c' }}>{pick.score}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/ 8 pts</span>
                        </div>
                        <Badge
                          bg={pick.score >= 6 ? '#B5D4F4' : pick.score >= 4 ? '#FAC775' : '#F1EFE8'}
                          color={pick.score >= 6 ? '#0C447C' : pick.score >= 4 ? '#633806' : '#5F5E5A'}
                        >
                          {pick.score >= 6 ? 'High priority' : pick.score >= 4 ? 'Medium priority' : 'Low priority'}
                        </Badge>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {pick.title || pick.content?.split('\n')[0]}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{pick.competitor} · {pick.date ? fmtDate(pick.date) : 'No date'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                          {dims.map((dim, di) => {
                            const isGap = dim.isGap;
                            const val = dim.value ?? null;
                            const na = val == null;
                            const barWidth = isGap
                              ? `${Math.max(0, (val + 1) / 2 * 100)}%`
                              : `${(val / dim.max) * 100}%`;
                            const barColor = isGap && val === 1 ? '#1D9E75' : '#1a3a5c';
                            const label = isGap
                              ? (na ? 'N/A' : val === 1 ? '+1' : `${val}`)
                              : (na ? 'N/A' : `${val}/${dim.max}`);
                            return (
                              <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', width: 56, flexShrink: 0 }}>{dim.label}</span>
                                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--color-border)' }}>
                                  {!na && <div style={{ height: '100%', borderRadius: 2, background: barColor, width: barWidth }} />}
                                </div>
                                <span style={{ fontSize: 9, width: 22, textAlign: 'right', flexShrink: 0, fontStyle: na ? 'italic' : 'normal', color: na ? 'var(--color-text-muted)' : isGap && val === 1 ? '#1D9E75' : 'var(--color-text)' }}>
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {pick.url && (
                          <a href={pick.url} target="_blank" rel="noopener noreferrer" style={{
                            width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500,
                            cursor: 'pointer', background: '#0A66C2', color: '#fff', border: 'none',
                            textAlign: 'center', textDecoration: 'none', display: 'block',
                          }}>View post ↗</a>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        No top pick for this week
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Instagram (real data) ── */}
              {(() => {
                const pick = topInstagramPick;
                const dims = pick ? [
                  { label: 'Strategic',   value: pick.dimensions?.strategic,   max: 3 },
                  { label: 'Intent',      value: pick.dimensions?.intent,      max: 2 },
                  { label: 'Engagement',  value: pick.dimensions?.engagement,  max: 2 },
                  { label: 'Gap',         value: pick.dimensions?.gap,         isGap: true },
                ] : [];
                return (
                  <div style={{
                    borderRadius: 6, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 7,
                    border: pick ? '1.5px solid #C13584' : '0.5px solid var(--color-border)',
                    background: pick ? '#FCE8F3' : 'transparent',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C13584' }}>Instagram</div>
                    {pick ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 20, fontWeight: 500, color: '#1a3a5c' }}>{pick.score}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/ 8 pts</span>
                        </div>
                        <Badge
                          bg={pick.score >= 6 ? '#B5D4F4' : pick.score >= 4 ? '#FAC775' : '#F1EFE8'}
                          color={pick.score >= 6 ? '#0C447C' : pick.score >= 4 ? '#633806' : '#5F5E5A'}
                        >
                          {pick.score >= 6 ? 'High priority' : pick.score >= 4 ? 'Medium priority' : 'Low priority'}
                        </Badge>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {pick.content?.split('\n')[0]}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{pick.competitor} · {pick.date ? fmtDate(pick.date) : 'No date'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                          {dims.map((dim, di) => {
                            const isGap = dim.isGap;
                            const val = dim.value ?? null;
                            const na = val == null;
                            const barWidth = isGap
                              ? `${Math.max(0, (val + 1) / 2 * 100)}%`
                              : `${(val / dim.max) * 100}%`;
                            const barColor = isGap && val === 1 ? '#1D9E75' : '#1a3a5c';
                            const label = isGap
                              ? (na ? 'N/A' : val === 1 ? '+1' : `${val}`)
                              : (na ? 'N/A' : `${val}/${dim.max}`);
                            return (
                              <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', width: 56, flexShrink: 0 }}>{dim.label}</span>
                                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--color-border)' }}>
                                  {!na && <div style={{ height: '100%', borderRadius: 2, background: barColor, width: barWidth }} />}
                                </div>
                                <span style={{ fontSize: 9, width: 22, textAlign: 'right', flexShrink: 0, fontStyle: na ? 'italic' : 'normal', color: na ? 'var(--color-text-muted)' : isGap && val === 1 ? '#1D9E75' : 'var(--color-text)' }}>
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {pick.url && (
                          <a href={pick.url} target="_blank" rel="noopener noreferrer" style={{
                            width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500,
                            cursor: 'pointer', background: '#C13584', color: '#fff', border: 'none',
                            textAlign: 'center', textDecoration: 'none', display: 'block',
                          }}>View post ↗</a>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        No top pick for this week
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* This week */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>This week</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: '#E6F1FB', color: '#0C447C' }}>
                {thisWeekItems.length}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: '#EAF3DE', color: '#3B6D11' }}>
                NEW
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Content scraped in the last 7 days — act on these first
            </div>

            {/* Channel filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['all', 'blog', 'linkedin', 'instagram'].map(ch => {
                const active = twChannelFilter === ch;
                const label = ch === 'all' ? 'All channels' : ch.charAt(0).toUpperCase() + ch.slice(1);
                return (
                  <button key={ch} onClick={() => { setTwChannelFilter(ch); setTwPage(1); }} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                    background: active ? '#E6F1FB' : 'transparent',
                    color:      active ? '#0C447C'  : 'var(--color-text-muted)',
                    border:     active ? '0.5px solid #B5D4F4' : '0.5px solid var(--color-border)',
                  }}>{label}</button>
                );
              })}
            </div>

            {/* Priority filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginRight: 2 }}>Priority</span>
              {[
                { key: 'all',    label: 'All' },
                { key: 'high',   label: 'High',   bg: '#EAF3DE', color: '#3B6D11' },
                { key: 'medium', label: 'Medium',  bg: '#FAEEDA', color: '#633806' },
                { key: 'low',    label: 'Low',    bg: '#F1EFE8', color: '#5F5E5A' },
              ].map(pill => {
                const active = twPriorityFilter === pill.key;
                return (
                  <button key={pill.key} onClick={() => { setTwPriorityFilter(pill.key); setTwPage(1); }} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                    background: active ? (pill.bg || '#0f2640') : 'var(--color-surface)',
                    color:      active ? (pill.color || '#fff')  : 'var(--color-text-muted)',
                    border:     active ? 'none' : '0.5px solid var(--color-border)',
                  }}>{pill.label}</button>
                );
              })}
            </div>

            {thisWeekItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                No new content this week — run the workflow to scrape
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                    {['', 'COMPETITOR', 'TYPE', 'TITLE', 'DATE', 'SCORE', 'PRIORITY', ''].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', width: i === 0 ? 20 : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {twPageItems.flatMap(item => {
                    const col          = COLORS[item.competitorId] || { border: '#999', bg: '#f5f5f5', text: '#333' };
                    const isExpandable = item.date && new Date(item.date) >= new Date('2026-01-01');
                    const isExpanded   = expandedRows.has(item.id);
                    const typeBadge    = item._type === 'linkedin'
                      ? <Badge bg="#E1EFF8" color="#0A66C2">LinkedIn</Badge>
                      : item._type === 'instagram'
                      ? <Badge bg="#FCE8F3" color="#C13584">Instagram</Badge>
                      : <Badge bg="#E6F1FB" color="#185FA5">Blog</Badge>;
                    const rows = [
                      <tr key={item.id} onClick={isExpandable ? () => toggleRow(item.id) : undefined}
                        style={{ borderBottom: isExpanded ? 'none' : '0.5px solid var(--color-border)', cursor: isExpandable ? 'pointer' : 'default' }}>
                        <td style={{ padding: '8px 10px', width: 20, color: 'var(--color-text-muted)', fontSize: 10 }}>
                          {isExpandable ? (isExpanded ? '▼' : '▶') : ''}
                        </td>
                        <td style={{ padding: '8px 10px', width: 110 }}>
                          <Badge bg={col.bg} color={col.text}>{item.competitor}</Badge>
                        </td>
                        <td style={{ padding: '8px 10px', width: 80 }}>{typeBadge}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--color-text)', maxWidth: 260 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', width: 80 }}>
                          {item.date ? fmtDate(item.date) : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', width: 60 }}>
                          {item.score != null
                            ? <span style={{ fontSize: 13, fontWeight: 600, color: '#1a3a5c' }}>{item.score}/8</span>
                            : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 10px', width: 90 }}>
                          {item.priority === 'high'
                            ? <Badge bg="#B5D4F4" color="#0C447C">High</Badge>
                            : item.priority === 'medium'
                            ? <Badge bg="#FAC775" color="#633806">Medium</Badge>
                            : item.priority === 'low'
                            ? <Badge bg="#D3D1C7" color="#444441">Low</Badge>
                            : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 10px', width: 140 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {item.url && (
                              <button onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }} style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: 'pointer',
                                background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)',
                              }}>View</button>
                            )}
                            <button onClick={e => { e.stopPropagation(); handleCreateBlogDraft(item); }} style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500, cursor: 'pointer',
                              background: '#1e3a5f', color: '#fff', border: 'none', whiteSpace: 'nowrap',
                            }}>+ Blog post</button>
                          </div>
                        </td>
                      </tr>,
                    ];
                    if (isExpanded) rows.push(<ExpandRow key={`${item.id}-expand`} item={item} />);
                    return rows;
                  })}
                </tbody>
              </table>
            )}
            {twTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <button onClick={() => setTwPage(p => Math.max(1, p - 1))} disabled={twPage === 1} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: twPage === 1 ? 'default' : 'pointer',
                  background: 'var(--color-surface)', color: twPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  border: '0.5px solid var(--color-border)',
                }}>Previous</button>
                <span>Page {twPage} of {twTotalPages}</span>
                <button onClick={() => setTwPage(p => Math.min(twTotalPages, p + 1))} disabled={twPage === twTotalPages} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: twPage === twTotalPages ? 'default' : 'pointer',
                  background: 'var(--color-surface)', color: twPage === twTotalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                  border: '0.5px solid var(--color-border)',
                }}>Next</button>
              </div>
            )}
          </div>

          <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '0 0' }} />

          {/* All scored content */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>All scored content</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                  {allScoredItems.filter(i => i.score != null).length} scored · {allScoredItems.filter(i => i.score == null).length} pending
                </span>
              </div>
              {allScoredItems.length > 0 && (
                <button onClick={handleScore} disabled={scoring || allScoredItems.every(i => i.score != null)} style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontFamily: F, fontWeight: 500,
                  cursor: (scoring || allScoredItems.every(i => i.score != null)) ? 'default' : 'pointer',
                  background: (scoring || allScoredItems.every(i => i.score != null)) ? 'var(--color-surface)' : '#1a3a5c',
                  color:      (scoring || allScoredItems.every(i => i.score != null)) ? 'var(--color-text-muted)' : '#fff',
                  border:     (scoring || allScoredItems.every(i => i.score != null)) ? '0.5px solid var(--color-border)' : 'none',
                }}>
                  {scoring ? scoringLabel : allScoredItems.every(i => i.score != null) ? 'All scored' : `Score ${allScoredItems.filter(i => i.score == null).length} unscored`}
                </button>
              )}
            </div>

            {/* Channel filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['all', 'blog', 'linkedin', 'instagram'].map(ch => {
                const active = channelFilter === ch;
                const label = ch === 'all' ? 'All channels' : ch.charAt(0).toUpperCase() + ch.slice(1);
                return (
                  <button key={ch} onClick={() => { setChannelFilter(ch); setAllPage(1); }} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                    background: active ? '#E6F1FB' : 'transparent',
                    color:      active ? '#0C447C'  : 'var(--color-text-muted)',
                    border:     active ? '0.5px solid #B5D4F4' : '0.5px solid var(--color-border)',
                  }}>{label}</button>
                );
              })}
            </div>

            {/* Priority filter + sort */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginRight: 2 }}>Priority</span>
              {[
                { key: 'all',    label: 'All' },
                { key: 'high',   label: 'High (6–8)',   bg: '#EAF3DE', color: '#3B6D11' },
                { key: 'medium', label: 'Medium (4–5)', bg: '#FAEEDA', color: '#633806' },
                { key: 'low',    label: 'Low (0–3)',    bg: '#F1EFE8', color: '#5F5E5A' },
              ].map(pill => {
                const active = scoreFilter === pill.key;
                return (
                  <button key={pill.key} onClick={() => { setScoreFilter(pill.key); setAllPage(1); }} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                    background: active ? (pill.bg || '#0f2640') : 'var(--color-surface)',
                    color:      active ? (pill.color || '#fff')  : 'var(--color-text-muted)',
                    border:     active ? 'none' : '0.5px solid var(--color-border)',
                  }}>{pill.label}</button>
                );
              })}
              </div>
              <button onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setAllPage(1); }} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500,
                cursor: 'pointer', background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                border: '0.5px solid var(--color-border)',
              }}>
                Sort {sortDir === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                  {['', 'COMPETITOR', 'TYPE', 'TITLE', 'DATE', 'SCORE', 'PRIORITY', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', width: i === 0 ? 20 : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPageItems.flatMap(item => {
                  const col          = COLORS[item.competitorId] || { border: '#999', bg: '#f5f5f5', text: '#333' };
                  const isExpandable = item.date && new Date(item.date) >= new Date('2026-01-01');
                  const isExpanded   = expandedRows.has(item.id);
                  const typeBadge    = item._type === 'linkedin'
                    ? <Badge bg="#E1EFF8" color="#0A66C2">LinkedIn</Badge>
                    : item._type === 'instagram'
                    ? <Badge bg="#FCE8F3" color="#C13584">Instagram</Badge>
                    : <Badge bg="#E6F1FB" color="#185FA5">Blog</Badge>;
                  const rows = [
                    <tr key={item.id} onClick={isExpandable ? () => toggleRow(item.id) : undefined}
                      style={{ borderBottom: isExpanded ? 'none' : '0.5px solid var(--color-border)', cursor: isExpandable ? 'pointer' : 'default' }}>
                      <td style={{ padding: '8px 10px', width: 20, color: 'var(--color-text-muted)', fontSize: 10 }}>
                        {isExpandable ? (isExpanded ? '▼' : '▶') : ''}
                      </td>
                      <td style={{ padding: '8px 10px', width: 110 }}>
                        <Badge bg={col.bg} color={col.text}>{item.competitor}</Badge>
                      </td>
                      <td style={{ padding: '8px 10px', width: 80 }}>
                        {typeBadge}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--color-text)', maxWidth: 260 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', width: 80 }}>
                        {item.date ? fmtDate(item.date) : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', width: 60 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a3a5c' }}>{item.score}/8</span>
                      </td>
                      <td style={{ padding: '8px 10px', width: 90 }}>
                        {item.priority === 'high'
                          ? <Badge bg="#B5D4F4" color="#0C447C">High</Badge>
                          : item.priority === 'medium'
                          ? <Badge bg="#FAC775" color="#633806">Medium</Badge>
                          : item.priority === 'low'
                          ? <Badge bg="#D3D1C7" color="#444441">Low</Badge>
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px', width: 140 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {item.url && (
                            <button onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }} style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: 'pointer',
                              background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)',
                            }}>View</button>
                          )}
                          <button onClick={e => { e.stopPropagation(); handleCreateBlogDraft(item); }} style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500, cursor: 'pointer',
                            background: '#1a3a5c', color: '#fff', border: 'none',
                          }}>+ Blog post</button>
                        </div>
                      </td>
                    </tr>,
                  ];
                  if (isExpanded) rows.push(<ExpandRow key={`${item.id}-expand`} item={item} />);
                  return rows;
                })}
              </tbody>
            </table>

            {scoredFiltered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                No scored content found
              </div>
            )}
            {allTotalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <button onClick={() => setAllPage(p => Math.max(1, p - 1))} disabled={allPage === 1} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: allPage === 1 ? 'default' : 'pointer',
                  background: 'var(--color-surface)', color: allPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                  border: '0.5px solid var(--color-border)',
                }}>Previous</button>
                <span>Page {allPage} of {allTotalPages}</span>
                <button onClick={() => setAllPage(p => Math.min(allTotalPages, p + 1))} disabled={allPage === allTotalPages} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: F, cursor: allPage === allTotalPages ? 'default' : 'pointer',
                  background: 'var(--color-surface)', color: allPage === allTotalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                  border: '0.5px solid var(--color-border)',
                }}>Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: BLOG ARTICLES ── */}
      {activeTab === 'blog' && (() => {
        const filteredArticles = blogFilter === 'all' ? articles : articles.filter(a => a.competitorId === blogFilter);
        const sortedArticles   = [...filteredArticles].sort((a, b) => {
          const dateA = new Date(a.publishDate || a.scrapedAt || 0);
          const dateB = new Date(b.publishDate || b.scrapedAt || 0);
          return blogSort === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return (
          <div style={card}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 3 }}>
                Blog articles <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 12 }}>{articles.length} total</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Scraped from competitor blogs — rephrase and send to pipeline
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', ...[...sources].sort((a, b) => a.name.localeCompare(b.name)).map(s => s.id)].map(id => {
                  const src    = sources.find(s => s.id === id);
                  const active = blogFilter === id;
                  return (
                    <button key={id} onClick={() => setBlogFilter(id)} style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer', fontFamily: F, fontWeight: active ? 600 : 400,
                      background: active ? '#0f2640' : 'var(--color-surface)',
                      color:      active ? '#fff'    : 'var(--color-text-muted)',
                      border:     active ? 'none'    : '0.5px solid var(--color-border)',
                    }}>
                      {id === 'all' ? 'All' : (src?.name || id)}
                    </button>
                  );
                })}
              </div>
            </div>

            {sortedArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                {articles.length === 0 ? 'Run the workflow to scrape competitor articles' : 'No articles for this competitor'}
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', width: 110 }}>Competitor</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Title</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', width: 220 }}>Categories</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', width: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date</span>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={e => { e.currentTarget.nextSibling.style.display = e.currentTarget.nextSibling.style.display === 'block' ? 'none' : 'block'; }}
                              style={{ fontSize: 10, padding: '2px 5px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: F, lineHeight: 1 }}
                            >
                              {blogSort === 'newest' ? '↓' : '↑'}
                            </button>
                            <div style={{ display: 'none', position: 'absolute', top: '100%', left: 0, marginTop: 2, background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 110 }}>
                              {[{ val: 'newest', label: 'Newest first' }, { val: 'oldest', label: 'Oldest first' }].map(opt => (
                                <div key={opt.val} onClick={e => { setBlogSort(opt.val); e.currentTarget.parentNode.style.display = 'none'; }} style={{ padding: '7px 12px', fontSize: 11, cursor: 'pointer', color: blogSort === opt.val ? '#1a3a5c' : 'var(--color-text)', fontWeight: blogSort === opt.val ? 600 : 400, fontFamily: F, whiteSpace: 'nowrap' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', width: 120 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedArticles.map(article => {
                      const col  = COLORS[article.competitorId] || { border: '#999', bg: '#f5f5f5', text: '#333' };
                      const tags = extractCategories(article.title);
                      return (
                        <tr key={article.id} style={{ borderBottom: '0.5px solid var(--color-border)' }}>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                            <Badge bg={col.bg} color={col.text}>{article.competitorName}</Badge>
                          </td>
                          <td style={{ padding: '10px 10px', fontWeight: 500, color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <a href={article.url} target="_blank" rel="noreferrer"
                              style={{ color: 'inherit', textDecoration: 'none' }}
                              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
                              {article.title}
                            </a>
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {tags.map(tag => (
                                <span key={tag} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'var(--color-background)', border: '0.5px solid var(--color-border)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                  {tag}
                                </span>
                              ))}
                              {tags.length === 0 && <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>—</span>}
                            </div>
                          </td>
                          <td style={{ padding: '10px 10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontSize: 11, verticalAlign: 'top' }}>
                            {article.publishDate ? new Date(article.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={article.url} target="_blank" rel="noreferrer" style={{ border: '0.5px solid var(--color-border)', background: 'transparent', padding: '4px 10px', borderRadius: 6, fontSize: 10, color: 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block', fontFamily: F }}>
                                View →
                              </a>
                              <button
                                onClick={() => handleCreateBlogDraft({ url: article.url, title: article.title, competitor: article.competitorName })}
                                style={{ border: 'none', background: '#1a3a5c', padding: '4px 10px', borderRadius: 6, fontSize: 10, color: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: F }}>
                                + Blog post
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12 }}>
                  Showing {sortedArticles.length} of {articles.length} articles
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── TAB 4: LINKEDIN ── */}
      {activeTab === 'linkedin' && (() => {
        const liCompetitors = [...new Set(linkedInPosts.map(p => p.competitor))];

        let filteredPosts = [...linkedInPosts];
        if (liFilter !== 'all') filteredPosts = filteredPosts.filter(p => p.competitor === liFilter);
        if (liTypeFilter !== 'all') filteredPosts = filteredPosts.filter(p => getPostType(p) === liTypeFilter);
        filteredPosts.sort((a, b) => {
          if (liSort === 'recent')     return new Date(b.date) - new Date(a.date);
          if (liSort === 'likes')      return (b.engagement?.likes || 0) - (a.engagement?.likes || 0);
          if (liSort === 'comments')   return (b.engagement?.comments || 0) - (a.engagement?.comments || 0);
          if (liSort === 'shares')     return (b.engagement?.shares || 0) - (a.engagement?.shares || 0);
          if (liSort === 'engagement') {
            const tA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
            const tB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
            return tB - tA;
          }
          return 0;
        });

        const thisWeekCount = linkedInPosts.filter(p => new Date(p.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        const repostCount   = linkedInPosts.filter(p => p.isRepost).length;
        const topPost       = [...linkedInPosts].sort((a, b) => (b.engagement?.likes || 0) - (a.engagement?.likes || 0))[0];
        const topEngagement = topPost ? (topPost.engagement?.likes || 0) : 0;
        const topEngagementLabel = topPost
          ? `${topPost.competitor?.split(' ')[0]} · ${new Date(topPost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
          : '—';

        return (
          <div style={{ padding: '20px 24px', fontFamily: F }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  LinkedIn posts{' '}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    {linkedInPosts.length} total
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Latest posts from competitor LinkedIn pages — run workflow to refresh
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sort by</span>
                <select
                  value={liSort}
                  onChange={e => setLiSort(e.target.value)}
                  style={{
                    fontSize: 11, padding: '5px 10px',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: 6, background: 'var(--color-surface)',
                    color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
                    fontFamily: F,
                  }}
                >
                  <option value="recent">Most recent</option>
                  <option value="likes">Most likes</option>
                  <option value="comments">Most comments</option>
                  <option value="shares">Most shares</option>
                  <option value="engagement">Total engagement</option>
                </select>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Total posts',     value: linkedInPosts.length, sub: '7 competitors' },
                { label: 'This week',       value: thisWeekCount,        sub: 'new posts' },
                { label: 'Top engagement',  value: topEngagement,        sub: topEngagementLabel },
                { label: 'Reposts',         value: repostCount,          sub: `of ${linkedInPosts.length} total` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--color-background)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['all', ...[...liCompetitors].sort((a, b) => a.localeCompare(b))].map(c => (
                <button key={c} onClick={() => setLiFilter(c)} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: F,
                  background: liFilter === c ? '#1a3a5c' : 'transparent',
                  color:      liFilter === c ? 'white'   : 'var(--color-text-muted)',
                  border:     liFilter === c ? 'none'    : '0.5px solid var(--color-border)',
                }}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
              <div style={{ width: '0.5px', height: 16, background: 'var(--color-border)', margin: '0 2px' }} />
              {[
                { key: 'all',      label: 'All types' },
                { key: 'original', label: 'Original' },
                { key: 'repost',   label: 'Repost' },
                { key: 'article',  label: 'Article' },
              ].map(t => (
                <button key={t.key} onClick={() => setLiTypeFilter(t.key)} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: F,
                  background:   liTypeFilter === t.key ? '#E6F1FB'                   : 'transparent',
                  color:        liTypeFilter === t.key ? '#0C447C'                   : 'var(--color-text-muted)',
                  border:       liTypeFilter === t.key ? '0.5px solid #B5D4F4'       : '0.5px solid var(--color-border)',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {linkedInLoading && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '20px 0' }}>Loading posts...</div>
            )}

            {/* Empty state */}
            {!linkedInLoading && linkedInPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>No LinkedIn posts yet</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Run the workflow to scrape competitor posts</div>
              </div>
            )}

            {/* Table */}
            {!linkedInLoading && linkedInPosts.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-background)' }}>
                      {[
                        { label: 'Competitor', w: 95 },
                        { label: 'Type',       w: 105 },
                        { label: 'Post',       w: null },
                        { label: 'Date',       w: 80 },
                        { label: 'Engagement', w: 90 },
                        { label: '',           w: 110 },
                      ].map((h, i) => (
                        <th key={i} style={{
                          textAlign: 'left', padding: '9px 12px',
                          fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)',
                          borderBottom: '0.5px solid var(--color-border)',
                          whiteSpace: 'nowrap',
                          width: h.w || undefined,
                        }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post, idx) => {
                      const compStyle  = getCompetitorStyle(post.competitorId);
                      const postType   = getPostType(post);
                      const isLast     = idx === filteredPosts.length - 1;
                      const typeLabel  = postType === 'original' ? 'Original post' : postType === 'repost' ? 'Repost' : 'Article';
                      const typeBg     = postType === 'original' ? '#E1F5EE' : postType === 'repost' ? '#F1EFE8' : '#E6F1FB';
                      const typeColor  = postType === 'original' ? '#085041' : postType === 'repost' ? '#5F5E5A' : '#0C447C';
                      return (
                        <tr key={post.id} style={{ borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)' }}>

                          {/* Competitor */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block', background: compStyle.bg, color: compStyle.color }}>
                              {post.competitor?.split(' ')[0] || 'Unknown'}
                            </span>
                          </td>

                          {/* Type */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, fontWeight: 500, display: 'inline-block', background: typeBg, color: typeColor }}>
                              {typeLabel}
                            </span>
                          </td>

                          {/* Post content */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {truncate(post.title || post.content?.split('\n')[0], 100)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {truncate(post.content, 160)}
                            </div>
                            {post.imageUrl && (
                              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--color-background)', color: 'var(--color-text-muted)', display: 'inline-block', marginTop: 4 }}>
                                + image
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{post.postedAgo || ''}</div>
                          </td>

                          {/* Engagement */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {[
                                { n: post.engagement?.likes    || 0, l: 'likes' },
                                { n: post.engagement?.comments || 0, l: 'comments' },
                                { n: post.engagement?.shares   || 0, l: 'shares' },
                              ].map(e => (
                                <div key={e.l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--color-text)', minWidth: 18 }}>{e.n}</span>
                                  {e.l}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={post.url} target="_blank" rel="noreferrer" style={{ border: '0.5px solid var(--color-border)', background: 'transparent', padding: '3px 8px', borderRadius: 6, fontSize: 10, color: 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block', fontFamily: F }}>
                                View →
                              </a>
                              <button
                                onClick={() => handleCreateBlogDraft({ url: post.url, title: post.title || post.content?.split('\n')[0], competitor: post.competitor })}
                                style={{ border: 'none', background: '#1a3a5c', padding: '3px 8px', borderRadius: 6, fontSize: 10, color: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: F }}>
                                + Blog post
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── TAB 5: INSTAGRAM ── */}
      {activeTab === 'instagram' && (() => {
        const IG_COMPETITOR_COLORS = {
          'competitor-7':       { bg: '#FBEAF0', color: '#72243E' },
          'competitor-1':        { bg: '#E1F5EE', color: '#085041' },
          'competitor-2': { bg: '#EEEDFE', color: '#3C3489' },
          'competitor-6':      { bg: '#FAECE7', color: '#712B13' },
        };
        const IG_TYPE_COLORS = {
          photo:    { bg: '#E1F5EE', color: '#085041' },
          reel:     { bg: '#EEEDFE', color: '#3C3489' },
          carousel: { bg: '#E6F1FB', color: '#0C447C' },
        };

        const igCompetitors = [...new Set(instagramPosts.map(p => p.competitor).filter(Boolean))];

        let filteredIgPosts = [...instagramPosts];
        if (igFilter !== 'all') filteredIgPosts = filteredIgPosts.filter(p => p.competitor === igFilter);
        if (igTypeFilter !== 'all') filteredIgPosts = filteredIgPosts.filter(p => (p.postType || 'photo') === igTypeFilter);
        filteredIgPosts.sort((a, b) => {
          if (igSort === 'recent')   return new Date(b.date) - new Date(a.date);
          if (igSort === 'likes')    return (b.engagement?.likes || 0) - (a.engagement?.likes || 0);
          if (igSort === 'comments') return (b.engagement?.comments || 0) - (a.engagement?.comments || 0);
          return 0;
        });

        const igThisWeek    = instagramPosts.filter(p => new Date(p.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        const igReelCount   = instagramPosts.filter(p => p.postType === 'reel').length;
        const igTopPost     = [...instagramPosts].sort((a, b) => (b.engagement?.likes || 0) - (a.engagement?.likes || 0))[0];
        const igTopLikes    = igTopPost ? (igTopPost.engagement?.likes || 0) : 0;
        const igTopLabel    = igTopPost
          ? `${igTopPost.competitor?.split(' ')[0]} · ${new Date(igTopPost.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
          : '—';

        return (
          <div style={{ padding: '20px 24px', fontFamily: F }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                  Instagram posts{' '}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    {instagramPosts.length} total
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Latest posts from competitor Instagram accounts — run workflow to refresh
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sort by</span>
                <select
                  value={igSort}
                  onChange={e => setIgSort(e.target.value)}
                  style={{
                    fontSize: 11, padding: '5px 10px',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: 6, background: 'var(--color-surface)',
                    color: 'var(--color-text)', cursor: 'pointer', outline: 'none',
                    fontFamily: F,
                  }}
                >
                  <option value="recent">Most recent</option>
                  <option value="likes">Most likes</option>
                  <option value="comments">Most comments</option>
                </select>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Total posts',    value: instagramPosts.length, sub: `${igCompetitors.length || 4} competitors` },
                { label: 'This week',      value: igThisWeek,            sub: 'new posts' },
                { label: 'Top engagement', value: igTopLikes,            sub: igTopLabel },
                { label: 'Reels',          value: igReelCount,           sub: `of ${instagramPosts.length} total` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--color-background)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['all', ...[...igCompetitors].sort((a, b) => a.localeCompare(b))].map(c => (
                <button key={c} onClick={() => setIgFilter(c)} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: F,
                  background: igFilter === c ? '#1a3a5c' : 'transparent',
                  color:      igFilter === c ? 'white'   : 'var(--color-text-muted)',
                  border:     igFilter === c ? 'none'    : '0.5px solid var(--color-border)',
                }}>
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
              <div style={{ width: '0.5px', height: 16, background: 'var(--color-border)', margin: '0 2px' }} />
              {[
                { key: 'all',      label: 'All types' },
                { key: 'photo',    label: 'Photo' },
                { key: 'reel',     label: 'Reel' },
                { key: 'carousel', label: 'Carousel' },
              ].map(t => (
                <button key={t.key} onClick={() => setIgTypeFilter(t.key)} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: F,
                  background: igTypeFilter === t.key ? '#E6F1FB'             : 'transparent',
                  color:      igTypeFilter === t.key ? '#0C447C'             : 'var(--color-text-muted)',
                  border:     igTypeFilter === t.key ? '0.5px solid #B5D4F4' : '0.5px solid var(--color-border)',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {instagramLoading && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '20px 0' }}>Loading posts...</div>
            )}

            {/* Empty state */}
            {!instagramLoading && instagramPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>No Instagram posts yet</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Run the workflow to scrape competitor posts</div>
              </div>
            )}

            {/* Table */}
            {!instagramLoading && instagramPosts.length > 0 && (
              <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-background)' }}>
                      {[
                        { label: 'Competitor', w: 95 },
                        { label: 'Type',       w: 95 },
                        { label: 'Post',       w: null },
                        { label: 'Date',       w: 80 },
                        { label: 'Engagement', w: 90 },
                        { label: '',           w: 110 },
                      ].map((h, i) => (
                        <th key={i} style={{
                          textAlign: 'left', padding: '9px 12px',
                          fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)',
                          borderBottom: '0.5px solid var(--color-border)',
                          whiteSpace: 'nowrap',
                          width: h.w || undefined,
                        }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIgPosts.map((post, idx) => {
                      const compStyle = IG_COMPETITOR_COLORS[post.competitorId] || { bg: '#E6F1FB', color: '#0C447C' };
                      const postType  = post.postType || 'photo';
                      const typeStyle = IG_TYPE_COLORS[postType] || IG_TYPE_COLORS.photo;
                      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
                      const isLast    = idx === filteredIgPosts.length - 1;
                      return (
                        <tr key={post.id} style={{ borderBottom: isLast ? 'none' : '0.5px solid var(--color-border)' }}>

                          {/* Competitor */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block', background: compStyle.bg, color: compStyle.color }}>
                              {post.competitor?.split(' ')[0] || 'Unknown'}
                            </span>
                          </td>

                          {/* Type */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, fontWeight: 500, display: 'inline-block', background: typeStyle.bg, color: typeStyle.color }}>
                              {typeLabel}
                            </span>
                          </td>

                          {/* Post content */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {truncate(post.content?.split('\n')[0], 100)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {truncate(post.content, 160)}
                            </div>
                            {post.imageUrl && (
                              <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'var(--color-background)', color: 'var(--color-text-muted)', display: 'inline-block', marginTop: 4 }}>
                                + image
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                              {post.date ? new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </td>

                          {/* Engagement */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {[
                                { n: post.engagement?.likes    || 0, l: 'likes' },
                                { n: post.engagement?.comments || 0, l: 'comments' },
                              ].map(e => (
                                <div key={e.l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--color-text)', minWidth: 18 }}>{e.n}</span>
                                  {e.l}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={post.url} target="_blank" rel="noreferrer" style={{ border: '0.5px solid var(--color-border)', background: 'transparent', padding: '3px 8px', borderRadius: 6, fontSize: 10, color: 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block', fontFamily: F }}>
                                View →
                              </a>
                              <button
                                onClick={() => handleCreateBlogDraft({ url: post.url, title: post.content?.split('\n')[0], competitor: post.competitor })}
                                style={{ border: 'none', background: '#1a3a5c', padding: '3px 8px', borderRadius: 6, fontSize: 10, color: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: F }}>
                                + Blog post
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── TAB 5: NEWSLETTERS ── */}
      {activeTab === 'newsletters' && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            ✉
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Newsletter monitoring coming soon</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 440, lineHeight: 1.6 }}>
            Subscribe to competitor newsletters with a neutral email account, connect via Gmail API, and content appears here automatically for rephrasing and sending to the content pipeline.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 540, marginTop: 8 }}>
            {[
              { step: 'STEP 1', title: 'Create neutral Gmail', sub: 'contentresearch.es' },
              { step: 'STEP 2', title: 'Subscribe to all 7',   sub: 'Using the neutral account' },
              { step: 'STEP 3', title: 'Connect Gmail API',    sub: 'Settings → Integrations' },
            ].map(({ step, title, sub }) => (
              <div key={step} style={{ border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{step}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>
              </div>
            ))}
          </div>

          <button style={{
            marginTop: 8, padding: '8px 20px', borderRadius: 6, fontSize: 12, fontFamily: F, fontWeight: 500, cursor: 'pointer',
            background: '#2F4B8C', color: '#fff', border: 'none',
          }}>
            Set up in Settings
          </button>
        </div>
      )}
    </div>
  );
}
