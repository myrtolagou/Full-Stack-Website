import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F            = "'Inter', system-ui, sans-serif";
const PURPLE       = '#7C3AED';
const PURPLE_LIGHT = '#EEEDFE';
const PURPLE_DARK  = '#3C3489';
const NAVY         = '#0f2640';

const SOURCE = {
  blog:       { bar: '#378ADD', badge: '#E6F1FB', text: '#0C447C', dot: '#3AAFDD', label: 'Blog'       },
  news:       { bar: '#EF9F27', badge: '#FAEEDA', text: '#633806', dot: '#EF9F27', label: 'News'       },
  competitor: { bar: '#D4537E', badge: '#FBEAF0', text: '#72243E', dot: '#D4537E', label: 'Competitor' },
};

const STATUS_STYLE = {
  pending:  { bg: '#FAEEDA', color: '#633806', label: 'Pending review' },
  approved: { bg: '#E1F5EE', color: '#085041', label: 'Approved'       },
};

const TEMPLATES = [
  { key: 'dark-navy', name: 'Dark navy',   sub: 'Default', colors: [NAVY,     '#1A6A8A', '#E91E8C'], hook: '#F5D800', title: '#fff',    body: 'rgba(255,255,255,0.65)', circle: '#E91E8C', ctaText: '#fff'  },
  { key: 'blue',      name: 'Blue',        sub: 'Lighter', colors: ['#1A6A8A', '#3AAFDD', '#D95E8A'], hook: '#F5D800', title: '#fff',    body: 'rgba(255,255,255,0.75)', circle: '#D95E8A', ctaText: '#fff'  },
  { key: 'pink',      name: 'Pink accent', sub: 'Bold',    colors: ['#D95E8A', NAVY,      '#F5D800'], hook: '#fff',    title: '#fff',    body: 'rgba(255,255,255,0.75)', circle: NAVY,      ctaText: NAVY    },
  { key: 'light',     name: 'Light',       sub: 'Minimal', colors: ['#EDF7FC', '#1A6A8A', '#E91E8C'], hook: '#1A6A8A', title: '#0f2640', body: 'rgba(15,38,64,0.65)',   circle: '#E91E8C', ctaText: '#fff'  },
];

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 32, height: 18, borderRadius: 9,
      background: on ? PURPLE : '#D1D5DB',
      cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

// ── Inline-editable field ─────────────────────────────────────────────────────
function EditableField({ value, onSave, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');
  const [hover, setHover]     = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onSave(draft); }}
        onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); } }}
        style={{
          width: '100%', fontFamily: F,
          fontSize: style?.fontSize || 11, fontWeight: style?.fontWeight || 'normal',
          color: '#fff', border: `1px solid ${PURPLE}`, borderRadius: 4,
          padding: '2px 4px', resize: 'none', outline: 'none',
          lineHeight: 1.4, background: 'rgba(255,255,255,0.1)',
          boxSizing: 'border-box', minHeight: 36,
        }}
        rows={2}
      />
    );
  }

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => { setEditing(true); setDraft(value || ''); }}
      style={{
        ...style, cursor: 'text', borderRadius: 3,
        padding: '1px 3px', margin: '-1px -3px',
        background: hover ? 'rgba(255,255,255,0.08)' : 'transparent',
        outline: hover ? `1px dashed rgba(124,58,237,0.55)` : 'none',
        transition: 'background 0.1s',
      }}
    >
      {value || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>—</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CarouselsPage() {
  const setTopbar = useSetTopbar();

  const [canvaTemplateUrl, setCanvaTemplateUrl] = useState('');
  const [claudePrompt, setClaudePrompt]         = useState('');
  const [items, setItems]                   = useState([]);
  const [filter, setFilter]                 = useState('all');
  const [activeId, setActiveId]             = useState(null);
  const [customiseOpen, setCustomiseOpen]   = useState(false);
  const [selectedSlides, setSelectedSlides] = useState(new Set());
  const [generating, setGenerating]         = useState(false);
  const [queueOpen, setQueueOpen]           = useState(true);

  const [numSlides, setNumSlides]   = useState(6);
  const [includeCTA, setIncludeCTA] = useState(true);

  const [slideTemplates, setSlideTemplates] = useState({});
  const [slideFields, setSlideFields]       = useState({});

  const DEFAULT_FIELDS = { hook: true, title: true, subtitle: true, body: true };
  const [draftTemplate, setDraftTemplate] = useState('dark-navy');
  const [draftFields, setDraftFields]     = useState(DEFAULT_FIELDS);
  const [draftChanged, setDraftChanged]   = useState(false);

  function getSlideFields(idx)   { return slideFields[idx]   ?? DEFAULT_FIELDS; }
  function getSlideTemplate(idx) { return TEMPLATES.find(t => t.key === (slideTemplates[idx] ?? 'dark-navy')) || TEMPLATES[0]; }

  function applySettings() {
    const newTemplates = { ...slideTemplates };
    const newFields    = { ...slideFields };
    [...selectedSlides].forEach(idx => {
      newTemplates[idx] = draftTemplate;
      newFields[idx]    = draftFields;
    });
    setSlideTemplates(newTemplates);
    setSlideFields(newFields);
    setDraftChanged(false);
  }

  // Fetch carousels + config on mount
  useEffect(() => {
    fetch(`${BASE_URL}/api/carousels`)
      .then(r => r.json())
      .then(({ carousels }) => {
        if (Array.isArray(carousels) && carousels.length > 0) {
          setItems(carousels);
          setActiveId(carousels[0].id);
        }
      })
      .catch(() => {});

    fetch(`${BASE_URL}/api/settings/config`)
      .then(r => r.json())
      .then(d => {
        setCanvaTemplateUrl(d.canvaTemplateUrl || '');
        setClaudePrompt(d.claudePrompt || '');
      })
      .catch(() => {});
  }, []);

  // Approve / unapprove via API
  async function handleApproveItem(id, currentStatus) {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await fetch(`${BASE_URL}/api/carousels/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    } catch {}
  }

  // Delete carousel
  async function handleDelete(id) {
    if (!window.confirm('Delete this carousel? This cannot be undone.')) return;
    const res = await fetch(`${BASE_URL}/api/carousels/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const remaining = items.filter(i => i.id !== id);
      setItems(remaining);
      if (activeId === id) setActiveId(remaining[0]?.id ?? null);
    }
  }

  // Topbar
  const pendingCount  = items.filter(i => i.status === 'pending').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  useEffect(() => {
    setTopbar({ title: 'Carousels', subtitle: `${pendingCount} pending · ${approvedCount} approved`, actions: null });
  }, [pendingCount, approvedCount]);

  const filtered = items.filter(item => {
    if (filter === 'all')      return true;
    if (filter === 'pending')  return item.status === 'pending';
    if (filter === 'approved') return item.status === 'approved';
    return true;
  });

  const activeItem    = items.find(i => i.id === activeId) ?? null;
  const src           = SOURCE[activeItem?.source] || SOURCE.blog;
  const status        = activeItem?.status || 'pending';
  const allSlides     = activeItem?.slides || [];
  const nonCtaSlides  = allSlides.filter(s => s.slide !== 'CTA').slice(0, numSlides);
  const ctaSlides     = includeCTA ? allSlides.filter(s => s.slide === 'CTA') : [];
  const visibleSlides = [...nonCtaSlides, ...ctaSlides];

  useEffect(() => { setSelectedSlides(new Set()); }, [activeId]);

  useEffect(() => {
    const arr = [...selectedSlides];
    if (arr.length === 1) {
      const idx   = arr[0];
      const slide = visibleSlides[idx];
      const inferred = slide ? {
        hook: !!slide.hook, title: !!slide.title, subtitle: !!slide.subtitle, body: !!slide.body,
      } : DEFAULT_FIELDS;
      setDraftTemplate(slideTemplates[idx] ?? 'dark-navy');
      setDraftFields(slideFields[idx] ?? inferred);
    } else if (arr.length > 1) {
      setDraftTemplate('dark-navy');
      setDraftFields(DEFAULT_FIELDS);
    }
    setDraftChanged(false);
  }, [selectedSlides]);

  function toggleSlide(idx) {
    setSelectedSlides(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function updateSlideField(slideIdx, field, value) {
    setItems(prev => prev.map(item => {
      if (item.id !== activeId) return item;
      const slides = item.slides.map((s, i) => i === slideIdx ? { ...s, [field]: value } : s);
      return { ...item, slides };
    }));
  }

  function buildTemplate() {
    try {
      const saved = localStorage.getItem('carouselTemplate');
      if (saved) return JSON.parse(saved);
    } catch {}
    const slides = [];
    for (let i = 1; i <= numSlides; i++) {
      slides.push({ slide: i, hook: true, title: true, subtitle: false, body: true });
    }
    if (includeCTA) slides.push({ slide: 'CTA', hook: false, title: false, subtitle: false, body: true });
    return slides;
  }

  function syncDisplayToTemplate(template) {
    const nonCTA = template.filter(s => s.slide !== 'CTA');
    const hasCTA = template.some(s => s.slide === 'CTA');
    const newFields = {};
    nonCTA.forEach((s, idx) => {
      newFields[idx] = { hook: !!s.hook, title: !!s.title, subtitle: !!s.subtitle, body: !!s.body };
    });
    if (hasCTA) newFields[nonCTA.length] = { hook: false, title: false, subtitle: false, body: true };
    setNumSlides(nonCTA.length);
    setIncludeCTA(hasCTA);
    setSlideFields(newFields);
  }

  async function handleRegenerate() {
    if (!activeItem?.url || generating) return;
    setGenerating(true);
    try {
      const template = buildTemplate();
      const res = await fetch(`${BASE_URL}/api/workflows/blog/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          inboxItemId: activeItem.inboxItemId || activeItem.id,
          url:         activeItem.url,
          title:       activeItem.title,
          template,
        }),
      });
      if (!res.ok) throw new Error(`Generation failed: ${res.status}`);
      const data = await res.json();
      setItems(prev => prev.map(i => i.id !== activeItem.id ? i : {
        ...i,
        slides: data.slides || [],
        title:  data.title  || i.title,
      }));
      setSelectedSlides(new Set());
      syncDisplayToTemplate(template);
    } catch (e) {
      console.error(e);
    } finally { setGenerating(false); }
  }

  function buildClaudePrompt(slides, canvaUrl) {
    const slideText = slides.map((s, i) => {
      const label = s.slide === 'CTA' ? 'CTA' : `Slide ${i + 1}`;
      return `--- ${label} ---\nHook: ${s.hook || ''}\nTitle: ${s.title || ''}\nSubtitle: ${s.subtitle || ''}\nBody: ${s.body || ''}`;
    }).join('\n\n');
    const template = claudePrompt ||
      `Here is my Canva carousel template and the slide content. Please replace all text in the template with the content below, matching each slide in order. Keep all fonts, colors, and formatting exactly as they are.\n\nCanva template: {canvaUrl}\n\n{slideText}`;
    return template.replace('{canvaUrl}', canvaUrl).replace('{slideText}', slideText);
  }

  const [toast, setToast] = useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% + 36px)', fontFamily: F, overflow: 'hidden', margin: '-18px -20px' }}>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left queue ── */}
        <div style={{
          width: queueOpen ? 220 : 10, flexShrink: 0,
          borderRight: '0.5px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease', overflow: 'visible',
          position: 'relative', background: 'var(--color-surface)',
        }}>
          {/* Collapse toggle */}
          <button
            onClick={() => setQueueOpen(o => !o)}
            title={queueOpen ? 'Collapse queue' : 'Expand queue'}
            onMouseEnter={e => { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            style={{
              position: 'absolute', top: '50%', right: -10, transform: 'translateY(-50%)',
              zIndex: 2, width: 20, height: 36, borderRadius: 4,
              border: '0.5px solid var(--color-border)',
              background: 'var(--color-surface)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--color-text-muted)',
              padding: 0, fontFamily: F, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {queueOpen ? '‹' : '›'}
          </button>

          {queueOpen && <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '8px 10px', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Queue · {pendingCount}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {[
                  { key: 'all',      label: 'All'     },
                  { key: 'pending',  label: 'Pending' },
                  { key: 'approved', label: 'Done'    },
                ].map(({ key, label }) => {
                  const active = filter === key;
                  return (
                    <button key={key} onClick={() => setFilter(key)}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
                      style={{ padding: '4px 11px', borderRadius: 12, fontSize: 11, fontFamily: F, background: active ? '#0f2640' : 'var(--color-surface)', color: active ? '#fff' : 'var(--color-text-muted)', border: active ? 'none' : '0.5px solid var(--color-border)', cursor: 'pointer', fontWeight: active ? 600 : 400, transition: 'background 0.15s, color 0.15s' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map(item => {
                const isActive   = item.id === activeId;
                const cSrc       = SOURCE[item.source] || SOURCE.blog;
                const cStatusSt  = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
                const slideCount = (item.slides || []).length;
                return (
                  <div key={item.id} onClick={() => setActiveId(item.id)}
                    style={{ padding: '9px 10px', cursor: 'pointer', background: isActive ? '#E6F1FB' : 'transparent', borderLeft: isActive ? '3px solid #378ADD' : '3px solid transparent', borderBottom: '0.5px solid var(--color-border)', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#EBF4FC'; e.currentTarget.style.borderLeft = '3px solid rgba(55,138,221,0.35)'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 500, background: cSrc.badge, color: cSrc.text, borderRadius: 10, padding: '1px 6px' }}>
                        {cSrc.label}
                      </span>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: 10, fontWeight: 500, background: cStatusSt.bg, color: cStatusSt.color, borderRadius: 10, padding: '1px 6px' }}>
                        {cStatusSt.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
                        {item.date}{slideCount > 0 ? ` · ${slideCount} slides` : ''}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#C0392B'; e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        style={{ padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 4, lineHeight: 1, flexShrink: 0 }}
                        title="Delete carousel"
                      >
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 5 4 14 12 14 13 5"/>
                          <line x1="1" y1="5" x2="15" y2="5"/>
                          <path d="M6 5V3h4v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: '24px 12px', fontSize: 12, color: 'var(--color-text-subtle)', textAlign: 'center' }}>
                  No carousels yet.
                </div>
              )}
            </div>
          </div>}
        </div>

        {/* ── Main panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {!activeItem ? (
            <div style={{ padding: 32, fontSize: 13, color: 'var(--color-text-subtle)' }}>
              Select an item from the queue.
            </div>
          ) : (
            <>
              {/* ── Action bar ── */}
              <div style={{
                padding: '7px 16px', borderBottom: '0.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                background: 'var(--color-surface)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 500, background: src.badge, color: src.text, borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>
                  {src.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                  {activeItem.title.length > 40 ? activeItem.title.slice(0, 40) + '…' : activeItem.title}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {nonCtaSlides.length} slides{includeCTA ? ' + CTA' : ''}
                </span>
                <div style={{ width: 1, height: 16, background: 'var(--color-border)', flexShrink: 0 }} />
                <div style={{ flex: 1 }} />

                <button onClick={handleRegenerate} disabled={generating || !activeItem.url}
                  onMouseEnter={e => { if (activeItem.url && !generating) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  style={{
                    padding: '5px 14px', border: '0.5px solid var(--color-border)', borderRadius: 6, fontFamily: F,
                    background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                    fontSize: 12, cursor: activeItem.url ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 5, opacity: generating ? 0.6 : 1,
                    transition: 'background 0.15s, color 0.15s',
                  }}>
                  ↻ {generating ? 'Recreating…' : 'Recreate all'}
                </button>

                <button
                  onClick={() => {
                    const prompt = buildClaudePrompt(visibleSlides, canvaTemplateUrl);
                    navigator.clipboard.writeText(prompt).then(() => showToast('Copied to clipboard'));
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#CC5200'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#D4622A'; }}
                  style={{
                    padding: '5px 14px', border: 'none', borderRadius: 6, fontFamily: F,
                    background: '#D4622A', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  Copy to Claude
                </button>

                <button
                  onClick={() => window.open('https://www.canva.com/design/DAHItr0H_Hs/akB68sqotpBVMVXxQ2NLxw/edit', '_blank')}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0050A0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0066CC'; }}
                  style={{
                    padding: '5px 14px', border: 'none', borderRadius: 6, fontFamily: F,
                    background: '#0066CC', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  Open in Canva
                </button>

                <button onClick={() => setCustomiseOpen(o => !o)}
                  onMouseEnter={e => { if (!customiseOpen) { e.currentTarget.style.background = '#ddd9fd'; e.currentTarget.style.color = PURPLE_DARK; } }}
                  onMouseLeave={e => { if (!customiseOpen) { e.currentTarget.style.background = PURPLE_LIGHT; e.currentTarget.style.color = PURPLE_DARK; } }}
                  style={{
                    padding: '5px 14px', border: 'none', borderRadius: 6, fontFamily: F,
                    background: customiseOpen ? '#1a3a5c' : PURPLE_LIGHT,
                    color: customiseOpen ? '#fff' : PURPLE_DARK,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'background 0.15s, color 0.15s',
                  }}>
                  ✦ Customise
                </button>

                <button
                  onClick={() => handleApproveItem(activeItem.id, status)}
                  onMouseEnter={e => { e.currentTarget.style.background = status === 'approved' ? '#d4ecc0' : 'rgba(234,243,222,0.6)'; e.currentTarget.style.color = '#3B6E10'; e.currentTarget.style.borderColor = status === 'approved' ? '#3B6E10' : 'rgba(59,110,16,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = status === 'approved' ? '#EAF3DE' : 'var(--color-surface)'; e.currentTarget.style.color = status === 'approved' ? '#3B6E10' : 'var(--color-text-muted)'; e.currentTarget.style.borderColor = status === 'approved' ? '#3B6E10' : 'var(--color-border)'; }}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontFamily: F,
                    border: `0.5px solid ${status === 'approved' ? '#3B6E10' : 'var(--color-border)'}`,
                    background: status === 'approved' ? '#EAF3DE' : 'var(--color-surface)',
                    color: status === 'approved' ? '#3B6E10' : 'var(--color-text-muted)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {status === 'approved' ? '✓ Approved' : 'Approve'}
                </button>

              </div>

              {/* ── Content row ── */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── Slides area ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Carousel slides
                    </div>
                    {selectedSlides.size > 0 && (
                      <span style={{ fontSize: 12, color: PURPLE, fontWeight: 500 }}>
                        {selectedSlides.size} selected
                      </span>
                    )}
                  </div>

                  {visibleSlides.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 320px)', gap: 10 }}>
                      {visibleSlides.map((slide, slideIdx) => {
                        const isCTA      = slide.slide === 'CTA';
                        const isSelected = selectedSlides.has(slideIdx);
                        const slideTmpl  = getSlideTemplate(slideIdx);
                        return (
                          <div key={slideIdx} onClick={() => toggleSlide(slideIdx)}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.border = `3px solid rgba(124,58,237,0.45)`; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.border = '2px solid transparent'; }}
                            style={{
                              background: isCTA ? slideTmpl.colors[2] : slideTmpl.colors[0],
                              border: isSelected ? `2px solid ${PURPLE}` : '2px solid transparent',
                              borderRadius: 8, padding: '10px 10px 26px',
                              display: 'flex', flexDirection: 'column', gap: 4,
                              position: 'relative', cursor: 'pointer',
                              transition: 'border-color 0.15s', aspectRatio: '4 / 5',
                            }}
                          >
                            <div onClick={e => { e.stopPropagation(); toggleSlide(slideIdx); }}
                              style={{
                                position: 'absolute', top: 7, right: 7,
                                width: 15, height: 15, borderRadius: 3,
                                border: `1.5px solid ${isSelected ? PURPLE : 'rgba(128,128,128,0.4)'}`,
                                background: isSelected ? PURPLE : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              }}
                            >
                              {isSelected && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                            </div>

                            <div style={{ fontSize: 9, fontWeight: 700, color: isCTA ? `${slideTmpl.ctaText}99` : `${slideTmpl.title}66`, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                              {isCTA ? 'CTA' : `Slide ${slide.slide ?? slideIdx + 1}`}
                            </div>

                            {getSlideFields(slideIdx).hook && slide.hook && (
                              <div onClick={e => e.stopPropagation()}>
                                <EditableField value={slide.hook} onSave={v => updateSlideField(slideIdx, 'hook', v)}
                                  style={{ fontSize: 10, fontWeight: 700, color: isCTA ? slideTmpl.ctaText : slideTmpl.hook, textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.3 }} />
                              </div>
                            )}
                            {getSlideFields(slideIdx).title && slide.title && (
                              <div onClick={e => e.stopPropagation()}>
                                <EditableField value={slide.title} onSave={v => updateSlideField(slideIdx, 'title', v)}
                                  style={{ fontSize: 11, fontWeight: 500, color: isCTA ? slideTmpl.ctaText : slideTmpl.title, lineHeight: 1.4 }} />
                              </div>
                            )}
                            {getSlideFields(slideIdx).subtitle && slide.subtitle && (
                              <div onClick={e => e.stopPropagation()}>
                                <EditableField value={slide.subtitle} onSave={v => updateSlideField(slideIdx, 'subtitle', v)}
                                  style={{ fontSize: 10, color: isCTA ? slideTmpl.ctaText : slideTmpl.body, lineHeight: 1.4 }} />
                              </div>
                            )}
                            {getSlideFields(slideIdx).body && slide.body && (
                              <div onClick={e => e.stopPropagation()}>
                                <EditableField value={slide.body} onSave={v => updateSlideField(slideIdx, 'body', v)}
                                  style={{ fontSize: 10, color: isCTA ? slideTmpl.ctaText : slideTmpl.body, lineHeight: 1.5 }} />
                              </div>
                            )}
                            {!slide.hook && !slide.title && !slide.subtitle && !slide.body && slide.t && (
                              <div style={{ fontSize: 10, color: slideTmpl.body, lineHeight: 1.5 }}>
                                {String(slide.t).replace(/^Slide\s*\d+\s*[:.]?\s*/i, '')}
                              </div>
                            )}

                            <div style={{
                              position: 'absolute', bottom: 7, right: 7,
                              width: 11, height: 11, borderRadius: '50%',
                              background: isCTA ? 'rgba(255,255,255,0.35)' : slideTmpl.circle,
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', padding: '24px 0' }}>
                      {allSlides.length > 0
                        ? 'All slides hidden by current settings.'
                        : activeItem.url
                          ? 'No slides yet — use "Recreate all" to generate them.'
                          : 'No slides available for this item.'}
                    </div>
                  )}
                </div>

                {/* ── Customise panel ── */}
                {customiseOpen && (
                  <div style={{
                    width: 260, flexShrink: 0, borderLeft: '0.5px solid var(--color-border)',
                    overflowY: 'auto', padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 18,
                    background: 'var(--color-surface)',
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                        Slide settings
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>Number of slides</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setNumSlides(Math.max(1, numSlides - 1))}
                            onMouseEnter={e => { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            style={{ width: 24, height: 24, border: '0.5px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', minWidth: 16, textAlign: 'center' }}>{numSlides}</span>
                          <button onClick={() => setNumSlides(Math.min(10, numSlides + 1))}
                            onMouseEnter={e => { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                            style={{ width: 24, height: 24, border: '0.5px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>Include CTA</span>
                        <Toggle on={includeCTA} onChange={setIncludeCTA} />
                      </div>
                      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>Fields per slide</div>
                      {[
                        { key: 'hook', label: 'Hook' }, { key: 'title', label: 'Title' },
                        { key: 'subtitle', label: 'Subtitle' }, { key: 'body', label: 'Body text' },
                      ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{label}</span>
                          <Toggle on={draftFields[key]} onChange={v => { setDraftFields(prev => ({ ...prev, [key]: v })); setDraftChanged(true); }} />
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                        Template
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {TEMPLATES.map(tmpl => {
                          const isActive = draftTemplate === tmpl.key;
                          return (
                            <div key={tmpl.key} onClick={() => { setDraftTemplate(tmpl.key); setDraftChanged(true); }}
                              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(238,237,254,0.45)'; e.currentTarget.style.border = `1.5px solid rgba(124,58,237,0.28)`; } }}
                              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.border = '0.5px solid var(--color-border)'; } }}
                              style={{ border: isActive ? `1.5px solid ${PURPLE}` : '0.5px solid var(--color-border)', background: isActive ? PURPLE_LIGHT : 'var(--color-surface)', borderRadius: 8, padding: '10px 10px 8px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 7 }}>
                                {tmpl.colors.map((c, i) => (
                                  <div key={i} style={{ height: 4, borderRadius: 2, background: c, width: i === 0 ? '100%' : i === 1 ? '72%' : '48%' }} />
                                ))}
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)' }}>{tmpl.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{tmpl.sub}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                        Apply changes
                      </div>
                      <button
                        onClick={applySettings}
                        disabled={!(selectedSlides.size > 0 && draftChanged)}
                        onMouseEnter={e => { if (selectedSlides.size > 0 && draftChanged) e.currentTarget.style.background = PURPLE_DARK; }}
                        onMouseLeave={e => { if (selectedSlides.size > 0 && draftChanged) e.currentTarget.style.background = PURPLE; }}
                        style={{
                          width: '100%', padding: '8px 0', border: 'none', borderRadius: 6, fontFamily: F,
                          background: selectedSlides.size > 0 && draftChanged ? PURPLE : '#E5E7EB',
                          color: selectedSlides.size > 0 && draftChanged ? '#fff' : 'var(--color-text-muted)',
                          fontSize: 12, fontWeight: 500,
                          cursor: selectedSlides.size > 0 && draftChanged ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'background 0.15s',
                        }}
                      >
                        Apply changes{selectedSlides.size > 0 ? ` (${selectedSlides.size})` : ''}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#D4622A', color: '#fff',
          padding: '9px 20px', borderRadius: 8,
          fontSize: 13, fontFamily: F, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          zIndex: 9999, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
