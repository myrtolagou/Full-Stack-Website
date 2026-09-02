import { useEffect } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';

const F      = "'Inter', system-ui, sans-serif";
const COLOR  = '#D95E8A';
const LIGHT  = '#FCEEF4';
const DARK   = '#7A2445';
const BORDER = '#F0AECB';

const STEPS = [
  { n: 1, title: 'Ingest RSS feeds',    desc: "Pulls latest items from TechCrunch, VentureBeat, and configured feeds" },
  { n: 2, title: 'Extract & classify',  desc: 'Identifies companies, sectors, event types, and funding amounts' },
  { n: 3, title: 'Match topics',        desc: "Matches news to BcnCor's strategic content topics" },
];

const RUN_LOG = [
  { time: '04:01:12', text: 'Fetching RSS from TechCrunch, VentureBeat…' },
  { time: '04:01:18', text: '14 new items ingested' },
  { time: '04:01:31', text: 'Classification complete — 5 topic matches' },
  { time: '04:01:32', text: '5 drafts added to Content inbox' },
];

const STATS = [
  { label: 'Items ingested', value: 14 },
  { label: 'Topic matches',  value: 5  },
  { label: 'Added to inbox', value: 5  },
];

const card = { background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '16px 20px' };

export default function NewsPage() {
  const setTopbar = useSetTopbar();

  useEffect(() => {
    setTopbar({ title: 'Ecosystem news workflow', subtitle: 'Ingest RSS feeds → classify → match topics', actions: null });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F }}>

      {/* Coming soon banner */}
      <div style={{
        background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 8,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 14 }}>⚠</span>
        <span style={{ fontSize: 12, color: '#92400E', fontWeight: 500 }}>
          This workflow is not yet active.
        </span>
      </div>

      <div style={{ opacity: 0.5, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Card 1 — How it works */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 3 }}>How it works</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Automated RSS ingestion and topic matching pipeline</div>

        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 12, width: 160 }}>
                <div style={{ fontSize: 10, color: COLOR, fontWeight: 600, marginBottom: 4 }}>Step {step.n}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              <div style={{ width: 28, textAlign: 'center', fontSize: 14, color: '#C4C4C4', flexShrink: 0 }}>→</div>
            </div>
          ))}
          <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 12, width: 160, background: LIGHT, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: COLOR, fontWeight: 600, marginBottom: 4 }}>Output</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: DARK, marginBottom: 4 }}>Drafts → inbox</div>
            <div style={{ fontSize: 11, color: DARK, lineHeight: 1.5 }}>Matched items sent as content drafts for review</div>
          </div>
        </div>
      </div>

      {/* Card 2 — Run */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>Ready to run</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Last run: Today at 04:01 (scheduled)</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, background: '#F0FAF6', color: '#2A7A4A', borderRadius: 12, padding: '3px 10px' }}>● Active</span>
          <button style={{ padding: '0 16px', height: 34, background: COLOR, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: F }}>
            Run news workflow
          </button>
        </div>
      </div>

      {/* Card 3 — Results */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Last run results</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {STATS.map(({ label, value }) => (
            <div key={label} style={{ border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '10px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: COLOR, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 8 }}>Run log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {RUN_LOG.map(({ time, text }, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', flexShrink: 0 }}>{time}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>{/* end opacity wrapper */}
    </div>
  );
}