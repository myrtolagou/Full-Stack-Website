import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F = "'Inter', system-ui, sans-serif";
const COLOR = '#3AAFDD';

const FIELDS = ['hook', 'title', 'subtitle', 'body'];
const FIELD_COLORS = {
  hook:     '#D95E8A',
  title:    'var(--color-text)',
  subtitle: 'var(--color-text-muted)',
  body:     'var(--color-text-muted)',
};

const DEFAULT_TEMPLATE = [
  { slide: 1,     hook: true,  title: true,  subtitle: true,  body: false },
  { slide: 2,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 3,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 4,     hook: true,  title: true,  subtitle: true,  body: true  },
  { slide: 5,     hook: true,  title: true,  subtitle: false, body: true  },
  { slide: 'CTA', hook: false, title: false, subtitle: false, body: true  },
];

function loadTemplate() {
  try { const s = localStorage.getItem('carouselTemplate'); return s ? JSON.parse(s) : DEFAULT_TEMPLATE; }
  catch { return DEFAULT_TEMPLATE; }
}

const SOURCE = {
  blog:       { bar: '#378ADD', dot: '#3AAFDD', badge: '#EDF7FC', text: '#1A6A8A', label: 'Blog'       },
  news:       { bar: '#EF9F27', dot: '#EF9F27', badge: '#FEF3E2', text: '#7A4F10', label: 'News'       },
  competitor: { bar: '#D4537E', dot: '#D95E8A', badge: '#FCEEF4', text: '#7A2445', label: 'Competitor' },
};

const MOCK_ITEMS = [
  {
    id: 2, source: 'news', status: 'pending', date: '19 Mar 2026', tags: ['Topic match'],
    title: 'European VC funding rebounds Q1 2026',
    excerpt: 'Venture capital activity in Europe saw a significant uptick in early 2026, with fintech leading at €2.1B.',
    slides: [
      { slide: 1, hook: 'EL VC EUROPEO REBOTA', title: 'Fintech lidera el rally de Q1 2026', subtitle: 'Con €2.1B, Europa resiste el ciclo bajista global', body: null },
      { slide: 2, hook: '¿QUÉ SECTORES LIDERAN?', title: 'Fintech, deeptech y clima', subtitle: 'Tres verticales concentran el 70% del capital', body: 'Banca digital, semiconductores y energía verde dominan los tickets grandes.' },
      { slide: 3, hook: 'LO QUE SIGNIFICA', title: 'Para startups españolas', subtitle: 'España capta el 8% del total europeo', body: 'Barcelona y Madrid encabezan el ranking ibérico por primera vez.' },
      { slide: 'CTA', hook: null, title: null, subtitle: null, body: 'Hablemos de cómo posicionar tu startup para captar inversión en 2026.' },
    ],
  },
  {
    id: 3, source: 'competitor', status: 'pending', date: '18 Mar 2026', tags: ['Respond to this'],
    title: 'Por qué las PYMEs necesitan un CFO externo',
    excerpt: 'Análisis de cómo el CFO-as-a-service está ganando terreno entre empresas medianas.',
    slides: [
      { slide: 1, hook: 'CFO EXTERNO', title: 'El recurso que tu PYME necesita', subtitle: 'Sin coste de plantilla, con impacto real', body: null },
      { slide: 2, hook: '3 SEÑALES', title: 'De que estás lista para un CFO externo', subtitle: 'Facturación, rondas pendientes, expansión', body: 'Si cumples dos de tres, ya deberías tener uno.' },
      { slide: 3, hook: 'COMPARATIVA', title: 'CFO interno vs externo', subtitle: 'Coste, velocidad y especialización', body: 'Un CFO externo aporta red inversora que el interno rara vez tiene.' },
      { slide: 'CTA', hook: null, title: null, subtitle: null, body: 'BcnCor: tu CFO externo desde el primer día.' },
    ],
  },
  {
    id: 5, source: 'news', status: 'pending', date: '18 Mar 2026', tags: ['Topic match'],
    title: "Spain startup ecosystem hits €4.2B",
    excerpt: 'The Spanish startup scene reached a new milestone last year with record total funding.',
    slides: [],
  },
  {
    id: 7, source: 'competitor', status: 'done', date: '12 Mar 2026', tags: [], doneDate: '17 Mar',
    title: 'Financiación pública vs privada: ventajas para startups en 2026',
    excerpt: '', slides: [],
  },
];

const FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'pending',    label: 'Pending'    },
  { key: 'done',       label: 'Done'       },
  { key: 'blog',       label: 'Blog',       dot: '#3AAFDD' },
  { key: 'news',       label: 'News',       dot: '#EF9F27' },
  { key: 'competitor', label: 'Competitor', dot: '#D95E8A' },
];

// ── Inline-editable field ──────────────────────────────────────────────────────
function EditableField({ value, onSave, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');
  const [hover, setHover]     = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onSave(draft); }}
        onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
        style={{
          width: '100%', fontFamily: F,
          fontSize: style?.fontSize || 12,
          fontWeight: style?.fontWeight || 'normal',
          color: style?.color || 'inherit',
          border: '1px solid #3AAFDD', borderRadius: 4,
          padding: '2px 4px', resize: 'none', outline: 'none',
          lineHeight: 1.4, background: '#fff',
          boxSizing: 'border-box', minHeight: 48,
        }}
        rows={3}
      />
    );
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => { setEditing(true); setDraft(value || ''); }}
      style={{
        ...style,
        cursor: 'text', borderRadius: 4,
        padding: '1px 3px', margin: '-1px -3px',
        background: hover ? 'rgba(58,175,221,0.07)' : 'transparent',
        outline: hover ? '1px dashed rgba(58,175,221,0.45)' : 'none',
        transition: 'background 0.1s',
      }}
    >
      {value || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>—</span>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function InboxPage() {
  const setTopbar = useSetTopbar();

  const [items, setItems]                     = useState(MOCK_ITEMS);
  const [filter, setFilter]                   = useState('all');
  const [template, setTemplate]               = useState(loadTemplate);
  const [templateOpen, setTemplateOpen]       = useState(false);
  const [activeId, setActiveId]               = useState(MOCK_ITEMS[0].id);
  const [markedForExport, setMarkedForExport] = useState(new Set());
  const [generating, setGenerating]           = useState(new Map()); // itemId → 'creating'|'recreating'

  // ── Template helpers ─────────────────────────────────────────────────────────
  function toggleField(slideIndex, field) {
    setTemplate(prev => {
      const next = prev.map((s, i) => i === slideIndex ? { ...s, [field]: !s[field] } : s);
      localStorage.setItem('carouselTemplate', JSON.stringify(next));
      return next;
    });
  }

  function resetTemplate() {
    setTemplate(DEFAULT_TEMPLATE);
    localStorage.setItem('carouselTemplate', JSON.stringify(DEFAULT_TEMPLATE));
  }

  // ── Fetch backend items ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/api/workflows/blog/inbox`)
      .then(r => r.json())
      .then(data => {
        const backendItems = (data.items || []).map(item => ({
          ...item,
          id:      item.id || item.createdAt,
          slides:  item.slides || (item.content?.carousel || []).map((t, i) => ({ n: i + 1, t })),
          tags:    item.tags || [],
          excerpt: item.excerpt || '',
        }));
        if (backendItems.length > 0) {
          setItems(prev => {
            const existingIds = new Set(prev.map(i => String(i.id)));
            const newOnes = backendItems.filter(i => !existingIds.has(String(i.id)));
            const merged = [...newOnes, ...prev];
            setActiveId(id => id ?? merged[0]?.id);
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────────
  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending' || filter === 'done') return item.status === filter;
    return item.source === filter;
  });

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const doneCount    = items.filter(i => i.status === 'done').length;
  const exportCount  = markedForExport.size;

  // ── Topbar ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    setTopbar({
      title:    'Content Editor',
      subtitle: `${pendingCount} pending · ${doneCount} done`,
      actions: exportCount > 0 ? (
        <button style={{
          padding: '0 14px', height: 32, border: 'none', borderRadius: 6,
          background: '#378ADD', color: '#fff', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', fontFamily: F,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          Export to Canva
          <span style={{
            background: 'rgba(255,255,255,0.28)', borderRadius: 10,
            padding: '1px 7px', fontSize: 11, fontWeight: 700,
          }}>{exportCount}</span>
        </button>
      ) : null,
    });
  }, [pendingCount, doneCount, exportCount]);

  // ── Create / Recreate slides ──────────────────────────────────────────────────
  async function handleCreateSlides(item, isRegenerate) {
    const mode = isRegenerate ? 'recreating' : 'creating';
    setGenerating(prev => new Map(prev).set(item.id, mode));

    try {
      const res = await fetch(`${BASE_URL}/api/workflows/blog/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboxItemId: item.id,
          url:         item.url,
          title:       item.title,
          template,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();

      setItems(prev => prev.map(i => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          slides:   data.slides || [],
          status:   'done',
          doneDate: data.doneDate || 'Today',
          title:    data.title || i.title,
        };
      }));

      // Uncheck export if recreating since content changed
      if (isRegenerate) {
        setMarkedForExport(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    } catch {
      // silently fail — keep button available to retry
    } finally {
      setGenerating(prev => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  // ── Skip ─────────────────────────────────────────────────────────────────────
  function handleSkip(id) {
    setItems(prev => prev.filter(item => item.id !== id));
    const idx  = filtered.findIndex(i => i.id === id);
    const next = filtered[idx + 1] || filtered[idx - 1];
    setActiveId(next?.id ?? null);
  }

  function updateSlideField(itemId, slideIdx, field, value) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const slides = item.slides.map((s, i) => i === slideIdx ? { ...s, [field]: value } : s);
      return { ...item, slides };
    }));
  }

  function toggleExport(id) {
    setMarkedForExport(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeItem = items.find(i => i.id === activeId);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: F, overflow: 'hidden' }}>

      {/* Filter bar */}
      <div style={{
        background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)',
        padding: '10px 20px', display: 'flex', gap: 6, alignItems: 'center',
        margin: '-18px -20px 0', flexShrink: 0,
      }}>
        {FILTERS.map(({ key, label, dot }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '4px 12px', borderRadius: 20,
                border: active ? 'none' : '0.5px solid var(--color-border)',
                background: active ? '#1a3a5c' : 'var(--color-surface)',
                color: active ? '#fff' : 'var(--color-text-muted)',
                fontSize: 12, fontWeight: active ? 500 : 400,
                cursor: 'pointer', fontFamily: F,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Carousel template (collapsible) */}
      <div style={{
        background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
        borderRadius: 8, margin: '12px 0 0', flexShrink: 0,
      }}>
        <button
          onClick={() => setTemplateOpen(o => !o)}
          style={{
            width: '100%', padding: '10px 16px', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontFamily: F,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>
            {templateOpen
              ? 'Carousel template'
              : `Template: ${template.filter(s => s.slide !== 'CTA').length} slides + CTA`}
          </span>
          <span style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1 }}>{templateOpen ? '▴' : '▾'}</span>
        </button>

        {templateOpen && (
          <div style={{ padding: '0 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Configure which fields Claude generates per slide — saved automatically
              </div>
              <button onClick={resetTemplate} style={{ fontSize: 11, color: COLOR, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>
                Reset to default
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <td style={{ width: 64, paddingBottom: 8, color: 'var(--color-text-muted)', fontStyle: 'italic' }} />
                    {template.map((s, i) => (
                      <td key={i} style={{ textAlign: 'center', paddingBottom: 8, fontWeight: 600, color: COLOR, minWidth: 64 }}>
                        {s.slide === 'CTA' ? 'CTA' : `Slide ${s.slide}`}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map(field => (
                    <tr key={field}>
                      <td style={{ padding: '4px 0', color: FIELD_COLORS[field], fontStyle: 'italic', fontWeight: 500, textTransform: 'capitalize' }}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </td>
                      {template.map((s, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '4px' }}>
                          <input type="checkbox" checked={s[field]} onChange={() => toggleField(i, field)}
                            style={{ accentColor: COLOR, cursor: 'pointer', width: 14, height: 14 }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
              Change the template settings above and click ↻ Recreate slides on any article to get new slides.
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', marginTop: 12, gap: 0 }}>

        {/* Left: Queue panel */}
        <div style={{
          width: 230, flexShrink: 0, overflowY: 'auto',
          borderRight: '0.5px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 14px 6px',
            fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0,
          }}>
            Queue · {filtered.filter(i => i.status === 'pending').length} pending
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--color-text-subtle)' }}>
              No items match this filter.
            </div>
          )}

          {filtered.map(item => {
            const src    = SOURCE[item.source];
            const active = item.id === activeId;
            const done   = item.status === 'done';
            return (
              <div
                key={item.id}
                onClick={() => setActiveId(item.id)}
                style={{
                  padding: '10px 12px', cursor: 'pointer',
                  background: active ? '#E6F1FB' : 'transparent',
                  borderLeft: active ? `3px solid ${src.bar}` : '3px solid transparent',
                  borderBottom: '0.5px solid var(--color-border)',
                  opacity: done ? 0.65 : 1,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F5F7FA'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: src.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 500, background: src.badge, color: src.text, borderRadius: 10, padding: '1px 6px' }}>
                    {src.label}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--color-text)',
                  lineHeight: 1.4, marginBottom: 3,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>{item.date}</div>
              </div>
            );
          })}
        </div>

        {/* Right: Active article panel */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {!activeItem ? (
            <div style={{ padding: 32, fontSize: 13, color: 'var(--color-text-subtle)' }}>
              Select an item from the queue.
            </div>
          ) : (() => {
            const src      = SOURCE[activeItem.source];
            const done     = activeItem.status === 'done';
            const marked   = markedForExport.has(activeItem.id);
            const hasSlides = activeItem.slides.length > 0;
            const genState = generating.get(activeItem.id); // 'creating' | 'recreating' | undefined
            const canGenerate = !!activeItem.url; // only items with a URL can be sent to backend

            return (
              <div style={{
                borderLeft: `4px solid ${src.bar}`,
                background: 'var(--color-surface)',
                minHeight: '100%',
                display: 'flex', flexDirection: 'column',
              }}>

                {/* Article header */}
                <div style={{ padding: '16px 20px 14px', borderBottom: '0.5px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 500, background: src.badge, color: src.text, borderRadius: 10, padding: '2px 8px' }}>
                          {src.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{activeItem.date}</span>
                        {activeItem.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: 10, color: 'var(--color-text-muted)',
                            border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '2px 8px',
                          }}>
                            {tag}
                          </span>
                        ))}
                        {done && (
                          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 500 }}>
                            ✓ Done · {activeItem.doneDate}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 6 }}>
                        {activeItem.title}
                      </div>
                      {activeItem.excerpt && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                          {activeItem.excerpt}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
                      {/* Skip — only for pending items */}
                      {!done && (
                        <button
                          onClick={() => handleSkip(activeItem.id)}
                          style={{
                            padding: '0 14px', height: 34,
                            border: '0.5px solid var(--color-border)', borderRadius: 6,
                            background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                            fontSize: 12, cursor: 'pointer', fontFamily: F,
                          }}
                        >
                          Skip
                        </button>
                      )}

                      {/* Create slides — pending with no slides and has URL */}
                      {!done && !hasSlides && canGenerate && (
                        <button
                          onClick={() => handleCreateSlides(activeItem, false)}
                          disabled={!!genState}
                          style={{
                            padding: '0 16px', height: 34,
                            border: 'none', borderRadius: 6,
                            background: genState ? '#93c5fd' : '#1a3a5c',
                            color: '#fff',
                            fontSize: 12, fontWeight: 500,
                            cursor: genState ? 'default' : 'pointer', fontFamily: F,
                          }}
                        >
                          {genState === 'creating' ? 'Creating…' : 'Create slides'}
                        </button>
                      )}

                      {/* Recreate slides — has slides (pending or done) and has URL */}
                      {hasSlides && canGenerate && (
                        <button
                          onClick={() => handleCreateSlides(activeItem, true)}
                          disabled={!!genState}
                          style={{
                            padding: '0 14px', height: 34,
                            border: '0.5px solid var(--color-border)', borderRadius: 6,
                            background: 'var(--color-surface)',
                            color: genState ? 'var(--color-text-subtle)' : 'var(--color-text-muted)',
                            fontSize: 12, cursor: genState ? 'default' : 'pointer', fontFamily: F,
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <span style={{ fontSize: 13 }}>↻</span>
                          {genState === 'recreating' ? 'Recreating…' : 'Recreate slides'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slide grid */}
                {hasSlides && (
                  <div style={{ padding: '16px 20px', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {activeItem.slides.map((slide, slideIdx) => {
                        const isCTA = slide.slide === 'CTA';
                        return (
                          <div
                            key={slideIdx}
                            style={{
                              background: isCTA ? '#EDF7FC' : '#fff',
                              border: `0.5px solid ${isCTA ? src.bar + '44' : 'var(--color-border)'}`,
                              borderTop: `3px solid ${src.bar}`,
                              borderRadius: 8, padding: '12px 14px',
                              display: 'flex', flexDirection: 'column', gap: 6,
                            }}
                          >
                            <div style={{
                              fontSize: 9, fontWeight: 700, color: src.bar,
                              textTransform: 'uppercase', letterSpacing: '0.6px',
                            }}>
                              {isCTA ? 'CTA' : `Slide ${slide.slide ?? slideIdx + 1}`}
                            </div>

                            {slide.hook && (
                              <EditableField
                                value={slide.hook}
                                onSave={v => updateSlideField(activeItem.id, slideIdx, 'hook', v)}
                                style={{ fontSize: 11, fontWeight: 700, color: '#D95E8A', letterSpacing: '0.3px', textTransform: 'uppercase', lineHeight: 1.3 }}
                              />
                            )}
                            {slide.title && (
                              <EditableField
                                value={slide.title}
                                onSave={v => updateSlideField(activeItem.id, slideIdx, 'title', v)}
                                style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}
                              />
                            )}
                            {slide.subtitle && (
                              <EditableField
                                value={slide.subtitle}
                                onSave={v => updateSlideField(activeItem.id, slideIdx, 'subtitle', v)}
                                style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}
                              />
                            )}
                            {slide.body && (
                              <EditableField
                                value={slide.body}
                                onSave={v => updateSlideField(activeItem.id, slideIdx, 'body', v)}
                                style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}
                              />
                            )}
                            {!slide.hook && !slide.title && !slide.subtitle && !slide.body && slide.t && (
                              <div style={{ fontSize: 11, color: 'var(--color-text)', lineHeight: 1.5 }}>
                                {String(slide.t).replace(/^Slide\s*\d+\s*[:.]?\s*/i, '')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-subtle)', textAlign: 'right' }}>
                      Hover any field to edit inline
                    </div>
                  </div>
                )}

                {!hasSlides && !done && (
                  <div style={{ padding: '28px 20px', fontSize: 12, color: 'var(--color-text-subtle)' }}>
                    {canGenerate
                      ? 'No slides yet — click "Create slides" to generate them with Claude.'
                      : 'No slides available for this item.'}
                  </div>
                )}

                {/* Mark for export */}
                <div style={{
                  padding: '12px 20px', borderTop: '0.5px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0, marginTop: 'auto',
                }}>
                  <div
                    onClick={() => toggleExport(activeItem.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 16px', borderRadius: 20,
                      border: `1px solid ${marked ? src.bar : 'var(--color-border)'}`,
                      background: marked ? src.badge : 'var(--color-surface)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      color: marked ? src.text : 'var(--color-text-muted)',
                      userSelect: 'none', transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox" checked={marked} readOnly
                      style={{ accentColor: src.bar, width: 13, height: 13, cursor: 'pointer' }}
                    />
                    Mark for Canva export
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
