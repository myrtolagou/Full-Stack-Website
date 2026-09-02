import { useEffect, useRef, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F    = "'Inter', system-ui, sans-serif";
const NAVY = '#03375F';

const FREQS = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 28, height: 16, borderRadius: 8,
        background: on ? '#22C55E' : '#D1D5DB',
        cursor: onChange ? 'pointer' : 'default',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 14 : 2,
        width: 12, height: 12, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Sel({ value, onChange, options, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%', padding: '3px 5px', borderRadius: 4,
        border: '0.5px solid var(--color-border)',
        fontFamily: F, fontSize: 10, color: 'var(--color-text)',
        background: 'var(--color-surface)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Arrow({ color, greyed }) {
  const c = greyed ? '#D1D5DB' : (color || 'var(--color-text-muted)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="2" overflow="visible">
        <line x1="0" y1="1" x2="32" y2="1"
          stroke={c} strokeWidth="1.5" strokeDasharray="4 3" />
        <polygon points="32,1 27,-2.5 27,4.5" fill={c} />
      </svg>
    </div>
  );
}

function SourceNode({ label, color, enabled, onToggle, freq, onFreq, day, onDay, time, onTime, greyed }) {
  return (
    <div style={{
      borderRadius: 8,
      border: `0.5px solid ${greyed ? '#E5E7EB' : color}`,
      background: greyed ? '#F9FAFB' : 'var(--color-surface)',
      opacity: greyed ? 0.55 : 1,
    }}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: greyed ? '#D1D5DB' : color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: greyed ? '#9CA3AF' : 'var(--color-text)', lineHeight: 1.3 }}>
              {label}
            </span>
          </div>
          <Toggle on={enabled} onChange={greyed ? null : onToggle} />
        </div>
        {greyed ? (
          <div style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>Not connected yet</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Frequency</span>
              <Sel value={freq} onChange={onFreq} options={FREQS} disabled={!enabled} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Day</span>
              <Sel value={day} onChange={onDay} options={DAYS} disabled={!enabled} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Time</span>
              <Sel value={time} onChange={onTime} options={TIMES} disabled={!enabled} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GenerateNode({ label, articlesLabel, outputLabel, maxArticles, onMaxArticles, maxOutput, onMaxOutput, lookbackDays, onLookbackDays }) {
  const inputStyle = {
    width: '100%', padding: '3px 6px', borderRadius: 4,
    border: '0.5px solid rgba(255,255,255,0.18)',
    fontFamily: F, fontSize: 10, color: '#fff',
    background: 'rgba(255,255,255,0.08)',
    boxSizing: 'border-box', outline: 'none',
  };
  return (
    <div style={{
      borderRadius: 8, background: NAVY,
      padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', zIndex: 50,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {articlesLabel}
        </span>
        <input type="number" value={maxArticles} min={1} max={20}
          onChange={e => onMaxArticles(Number(e.target.value))} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {outputLabel}
        </span>
        <input type="number" value={maxOutput} min={1} max={20}
          onChange={e => onMaxOutput(Number(e.target.value))} style={inputStyle} />
      </div>
      {onLookbackDays != null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Lookback (days)
          </span>
          <input type="number" value={lookbackDays} min={1} max={365}
            onChange={e => onLookbackDays(Number(e.target.value))} style={inputStyle} />
        </div>
      )}
    </div>
  );
}

function QueueNode({ label, count, color }) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const today = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <div style={{
      borderRadius: 8,
      border: `0.5px solid ${color}`,
      background: 'var(--color-surface)',
    }}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text)', lineHeight: 1.4 }}>
          {today} {time}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
            background: `${color}20`, color,
          }}>
            {count ?? '—'} pending
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SchedulerPage() {
  const setTopbar = useSetTopbar();

  const [blogEnabled,      setBlogEnabled]      = useState(true);
  const [blogFreq,         setBlogFreq]         = useState('Weekly');
  const [blogDay,          setBlogDay]          = useState('Monday');
  const [blogTime,         setBlogTime]         = useState('09:00');
  const [blogMaxArticles,  setBlogMaxArticles]  = useState(5);
  const [blogMaxCarousels, setBlogMaxCarousels] = useState(3);

  const [compEnabled,     setCompEnabled]     = useState(true);
  const [compFreq,        setCompFreq]        = useState('Weekly');
  const [compDay,         setCompDay]         = useState('Wednesday');
  const [compTime,        setCompTime]        = useState('09:00');
  const [compMaxArticles,    setCompMaxArticles]    = useState(5);
  const [compMaxDrafts,      setCompMaxDrafts]      = useState(3);
  const [compLookbackDays,   setCompLookbackDays]   = useState(7);

  const [carouselsPending, setCarouselsPending] = useState(null);
  const [draftsPending,    setDraftsPending]    = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [toast,            setToast]            = useState(null);
  const toastTimer = useRef(null);

  const saveRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/scheduler/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { pipeline: 'blog',       enabled: blogEnabled, frequency: blogFreq, day: blogDay, time: blogTime },
            { pipeline: 'competitor', enabled: compEnabled, frequency: compFreq, day: compDay, time: compTime, lookback_days: compLookbackDays },
          ],
        }),
      });
      if (res.ok) showToast('Settings saved');
    } catch (err) {
      console.error('[scheduler] save error:', err);
    } finally {
      setSaving(false);
    }
  }

  saveRef.current = handleSave;

  useEffect(() => {
    setTopbar({
      title:    'Scheduler',
      subtitle: 'Configure automated pipeline runs',
      actions: (
        <button
          onMouseEnter={e => { e.currentTarget.style.background = '#0f2640'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1a3a5c'; }}
          style={{
            padding: '5px 16px', borderRadius: 6, fontSize: 12,
            fontFamily: F, fontWeight: 500,
            background: '#1a3a5c', color: '#fff',
            border: 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => saveRef.current()}
        >
          Save settings
        </button>
      ),
    });

    fetch(`${BASE_URL}/api/scheduler/settings`)
      .then(r => r.json())
      .then(({ settings }) => {
        for (const s of settings ?? []) {
          if (s.pipeline === 'blog') {
            setBlogEnabled(s.enabled);
            setBlogFreq(s.frequency);
            setBlogDay(s.day);
            setBlogTime(s.time);
          } else if (s.pipeline === 'competitor') {
            setCompEnabled(s.enabled);
            setCompFreq(s.frequency);
            setCompDay(s.day);
            setCompTime(s.time);
            if (s.lookback_days != null) setCompLookbackDays(s.lookback_days);
          }
        }
      })
      .catch(() => {});

    fetch(`${BASE_URL}/api/workflows/blog/carousels`)
      .then(r => r.json())
      .then(data => {
        const items = data.carousels ?? data.items ?? data ?? [];
        setCarouselsPending(Array.isArray(items) ? items.filter(i => i.status === 'pending').length : 0);
      })
      .catch(() => setCarouselsPending(0));

    fetch(`${BASE_URL}/api/blog-drafts`)
      .then(r => r.json())
      .then(data => {
        const items = data.drafts ?? data.items ?? data ?? [];
        setDraftsPending(Array.isArray(items) ? items.filter(i => i.status === 'pending').length : 0);
      })
      .catch(() => setDraftsPending(0));
  }, []);

  return (
    <div style={{ fontFamily: F }}>
      <div style={{
        background: 'var(--color-background-secondary, #F5F7FA)',
        border: '0.5px solid var(--color-border)',
        borderRadius: 12,
        padding: '28px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 50px 170px 50px 170px',
          rowGap: 40,
          alignItems: 'center',
        }}>

          {/* ── Row 1: Blog → Generate Carousels → Carousels queue ── */}
          <SourceNode
            label="Blog" color="#378ADD"
            enabled={blogEnabled} onToggle={setBlogEnabled}
            freq={blogFreq}       onFreq={setBlogFreq}
            day={blogDay}         onDay={setBlogDay}
            time={blogTime}       onTime={setBlogTime}
          />
          <Arrow color="#378ADD" />
          <GenerateNode
            label="Generate Carousels"
            articlesLabel="Max articles" outputLabel="Max carousels"
            maxArticles={blogMaxArticles}  onMaxArticles={setBlogMaxArticles}
            maxOutput={blogMaxCarousels}   onMaxOutput={setBlogMaxCarousels}
          />
          <Arrow color="#378ADD" />
          <QueueNode label="Carousels queue" count={carouselsPending} color="#A78BFA" />

          {/* ── Row 2: Competitor → Generate Blog drafts → Blog drafts queue ── */}
          <SourceNode
            label="Competitor monitor" color="#2F4B8C"
            enabled={compEnabled} onToggle={setCompEnabled}
            freq={compFreq}       onFreq={setCompFreq}
            day={compDay}         onDay={setCompDay}
            time={compTime}       onTime={setCompTime}
          />
          <Arrow color="#2F4B8C" />
          <GenerateNode
            label="Generate Blog drafts"
            articlesLabel="Max articles" outputLabel="Max drafts"
            maxArticles={compMaxArticles} onMaxArticles={setCompMaxArticles}
            maxOutput={compMaxDrafts}     onMaxOutput={setCompMaxDrafts}
            lookbackDays={compLookbackDays} onLookbackDays={setCompLookbackDays}
          />
          <Arrow color="#2F4B8C" />
          <QueueNode label="Blog drafts queue" count={draftsPending} color="#1D9E75" />

          {/* ── Row 3: Ecosystem news (coming soon) ── */}
          <SourceNode
            label="Ecosystem news" color="#EF9F27"
            enabled={false} greyed
          />
          <div style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Coming soon</span>
          </div>

        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#1a3a5c', color: '#fff',
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