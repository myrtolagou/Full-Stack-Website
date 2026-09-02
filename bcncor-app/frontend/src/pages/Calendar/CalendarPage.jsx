import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { apiFetch } from '../../services/api';

const F = "'Inter', system-ui, sans-serif";

const TODAY       = new Date();
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(year, month) {
  const firstDay      = new Date(year, month, 1);
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const startCol      = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6
  const cells         = [];

  for (let i = startCol - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  let next   = 1;
  const target = cells.length <= 35 ? 35 : 42;
  while (cells.length < target) {
    cells.push({ date: new Date(year, month + 1, next++), current: false });
  }
  return cells;
}

const CHIP = {
  Blog:      { bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  LinkedIn:  { bg: '#E6F1FB', color: '#0C447C', dot: '#378ADD' },
  Instagram: { bg: '#FCE7F3', color: '#9D174D', dot: '#D4537E' },
};

// ── Post chip ───────────────────────────────────────────────────────────────
function PostChip({ post, onClick, isSelected }) {
  const c = CHIP[post.platform] ?? CHIP.Blog;
  return (
    <div
      onClick={() => onClick(post)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', borderRadius: 4, marginBottom: 2, cursor: 'pointer',
        background: c.bg,
        border: isSelected ? `1px solid ${c.dot}` : `1px solid ${c.bg}`,
        outline: isSelected ? `2px solid ${c.dot}` : 'none',
        outlineOffset: '1px',
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span style={{
        fontSize: 10, fontWeight: 500, color: c.color, fontFamily: F,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88,
      }}>
        {post.title}
      </span>
    </div>
  );
}

// ── Post detail panel ───────────────────────────────────────────────────────
function PostDetail({ post, onClose }) {
  const c = CHIP[post.platform] ?? CHIP.Blog;
  return (
    <div style={{
      background: '#fff', border: '0.5px solid var(--color-border)',
      borderRadius: 8, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 10, fontFamily: F,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', paddingRight: 12 }}>
          {post.title}
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 600, background: c.bg, color: c.color, borderRadius: 10, padding: '2px 8px' }}>
          {post.platform}
        </span>
        {post.date && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{post.date}</span>
        )}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 500, color: '#03375F', marginLeft: 'auto', whiteSpace: 'nowrap' }}
          >
            View original →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CalendarPage() {
  const setTopbar = useSetTopbar();

  const [posts, setPosts]               = useState([]);
  const [navDate, setNavDate]           = useState(new Date(2026, TODAY.getMonth(), 1));
  const [selectedPost, setSelectedPost] = useState(null);

  const year       = navDate.getFullYear();
  const month      = navDate.getMonth();
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const monthStr       = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthPosts     = posts.filter(p => p.date?.startsWith(monthStr));
  const publishedCount = monthPosts.length;
  const totalCount     = posts.length;

  useEffect(() => {
    apiFetch('/calendar')
      .then(data => { console.log('platforms:', (data.articles ?? []).map(a => a.platform).slice(0, 10)); setPosts(data.articles ?? []); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setTopbar({
      title:    'Calendar',
      subtitle: `${monthLabel} · ${publishedCount} published this month`,
      actions:  null,
    });
  }, [monthLabel, publishedCount]);

  const canPrev = !(year === 2026 && month === 0);
  const canNext = !(year === 2026 && month === 11);

  const prevMonth = () => { if (canPrev) { setNavDate(new Date(year, month - 1, 1)); setSelectedPost(null); } };
  const nextMonth = () => { if (canNext) { setNavDate(new Date(year, month + 1, 1)); setSelectedPost(null); } };

  const cells    = buildMonthGrid(year, month);
  const todayStr = toDateStr(TODAY);

  const getPostsForDate = (dateStr) => posts.filter(p => p.date === dateStr);
  const handleChipClick = (post) => setSelectedPost(prev => prev?.id === post.id ? null : post);

  const cardBase = { background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '8px 14px' };

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* ── Controls row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={prevMonth}
          disabled={!canPrev}
          style={{ padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--color-border)', background: 'var(--color-surface)', color: canPrev ? 'var(--color-text-muted)' : 'var(--color-border)', fontSize: 12, cursor: canPrev ? 'pointer' : 'default', fontFamily: F }}
        >
          ← {MONTH_NAMES[month === 0 ? 11 : month - 1].slice(0, 3)}
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', minWidth: 120, textAlign: 'center' }}>
          {monthLabel}
        </div>
        <button
          onClick={nextMonth}
          disabled={!canNext}
          style={{ padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--color-border)', background: 'var(--color-surface)', color: canNext ? 'var(--color-text-muted)' : 'var(--color-border)', fontSize: 12, cursor: canNext ? 'pointer' : 'default', fontFamily: F }}
        >
          {MONTH_NAMES[month === 11 ? 0 : month + 1].slice(0, 3)} →
        </button>

      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#166534', lineHeight: 1 }}>{publishedCount}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Published this month</span>
        </div>
        <div style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#03375F', lineHeight: 1 }}>{totalCount}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total in 2026</span>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div style={{ background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Day header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid var(--color-border)' }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{
              padding: '9px 0', textAlign: 'center',
              fontSize: 11, fontWeight: 600,
              color: i >= 5 ? '#9D174D' : '#03375F',
              background: i >= 5 ? '#FCE7F3' : '#E8F0F8',
              borderRight: i < 6 ? '0.5px solid var(--color-border)' : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell, idx) => {
            const dateStr   = toDateStr(cell.date);
            const isToday   = dateStr === todayStr;
            const cellPosts = getPostsForDate(dateStr);
            const col       = idx % 7;
            const row       = Math.floor(idx / 7);
            const totalRows = cells.length / 7;

            return (
              <div
                key={idx}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#F7F8FF'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = '#fff'; }}
                style={{
                  minHeight: 72, padding: '5px 5px',
                  background: isToday ? '#EEF4FB' : '#fff',
                  borderRight: col < 6 ? '0.5px solid var(--color-border)' : 'none',
                  borderBottom: row < totalRows - 1 ? '0.5px solid var(--color-border)' : 'none',
                  opacity: cell.current ? 1 : 0.45,
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: isToday ? '#03375F' : 'transparent',
                    color: isToday ? '#fff' : col >= 5 ? '#D4537E' : 'var(--color-text-muted)',
                    fontSize: 11, fontWeight: isToday ? 700 : 400,
                  }}>
                    {cell.date.getDate()}
                  </div>
                </div>
                {cellPosts.map(post => (
                  <PostChip
                    key={post.id}
                    post={post}
                    onClick={handleChipClick}
                    isSelected={selectedPost?.id === post.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Post detail panel ── */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
