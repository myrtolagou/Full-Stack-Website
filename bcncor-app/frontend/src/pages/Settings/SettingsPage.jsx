import { useEffect, useState } from 'react';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F = "'Inter', system-ui, sans-serif";

const defaultClaudePrompt = `Here is my Canva carousel template and the slide content. Please replace all text in the template with the content below, matching each slide in order. Keep all fonts, colors, and formatting exactly as they are.

Canva template: {canvaUrl}

{slideText}`;

const inputStyle = {
  width: '100%', height: 36, padding: '0 10px',
  border: '0.5px solid var(--color-border)', borderRadius: 6,
  fontSize: 12, color: 'var(--color-text)', outline: 'none',
  boxSizing: 'border-box', fontFamily: F, background: 'var(--color-surface)',
};

const labelStyle = {
  fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5, display: 'block',
};

const card = { background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 };

const TIER_COLORS = {
  'Top priority':    { bg: '#E6F1FB', color: '#0C447C' },
  'Relevant':        { bg: '#FAEEDA', color: '#633806' },
  'Loosely related': { bg: '#F1EFE8', color: '#5F5E5A' },
};

function saveBtnStyle(active) {
  return {
    padding: '5px 14px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
    fontFamily: F, cursor: active ? 'pointer' : 'default',
    background: active ? '#1a3a5c' : '#E5E7EB',
    color: active ? '#fff' : '#9CA3AF',
  };
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 32, height: 18, borderRadius: 9,
      background: on ? '#1a3a5c' : '#D1D5DB',
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

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: 4, verticalAlign: 'middle' }}
          onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--color-border)', color: 'var(--color-text-muted)', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', flexShrink: 0 }}>i</span>
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', fontSize: 11, padding: '7px 10px', borderRadius: 6, whiteSpace: 'pre-wrap', maxWidth: 240, zIndex: 200, lineHeight: 1.5, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {text}
        </div>
      )}
    </span>
  );
}

export default function SettingsPage() {
  const setTopbar = useSetTopbar();

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  function showToast(msg, type = 'success') {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  // ── API config state ──────────────────────────────────────────────────────────
  const [blogUrl, setBlogUrl]                     = useState('');
  const [loadedBlogUrl, setLoadedBlogUrl]         = useState('');
  const [canvaTemplateUrl, setCanvaTemplateUrl]   = useState('');
  const [loadedCanvaUrl, setLoadedCanvaUrl]       = useState('');
  const [configSaving, setConfigSaving]           = useState(false);
  const [claudePrompt, setClaudePrompt]           = useState('');
  const [loadedClaudePrompt, setLoadedClaudePrompt] = useState('');
  const [claudePromptSaving, setClaudePromptSaving] = useState(false);

  // ── Competitors state ─────────────────────────────────────────────────────────
  const [competitors,      setCompetitors]      = useState([]);
  const [editingId,        setEditingId]        = useState(null);
  const [editDraft,        setEditDraft]        = useState({ name: '', url: '', linkedin_id: '', instagram_id: '' });
  const [editOriginal,     setEditOriginal]     = useState(null);
  const [competitorSaving, setCompetitorSaving] = useState(false);

  function loadCompetitors() {
    fetch(`${BASE_URL}/api/competitors`)
      .then(r => r.json())
      .then(d => setCompetitors(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  useEffect(() => {
    loadCompetitors();
    fetch(`${BASE_URL}/api/settings/config`)
      .then(r => r.json())
      .then(d => {
        setBlogUrl(d.blogUrl || '');
        setLoadedBlogUrl(d.blogUrl || '');
        setCanvaTemplateUrl(d.canvaTemplateUrl || '');
        setLoadedCanvaUrl(d.canvaTemplateUrl || '');
        setClaudePrompt(d.claudePrompt || defaultClaudePrompt);
        setLoadedClaudePrompt(d.claudePrompt || defaultClaudePrompt);
      })
      .catch(() => {});
  }, []);

  function startEdit(c) {
    setEditingId(c.id);
    const draft = { name: c.name, url: c.url, linkedin_id: c.linkedin_id || '', instagram_id: c.instagram_id || '' };
    setEditDraft(draft);
    setEditOriginal(draft);
  }

  function startAdd() {
    setEditingId('new');
    setEditDraft({ name: '', url: '', linkedin_id: '', instagram_id: '' });
    setEditOriginal(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({ name: '', url: '', linkedin_id: '', instagram_id: '' });
    setEditOriginal(null);
  }

  async function saveEdit() {
    if (!editDraft.name.trim() || !editDraft.url.trim()) return;
    setCompetitorSaving(true);
    try {
      const isNew = editingId === 'new';
      const res = await fetch(
        isNew ? `${BASE_URL}/api/competitors` : `${BASE_URL}/api/competitors/${editingId}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editDraft),
        }
      );
      if (res.ok) {
        loadCompetitors();
        cancelEdit();
        showToast('Saved successfully');
      } else {
        showToast('Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setCompetitorSaving(false);
    }
  }

  async function deleteCompetitor(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`${BASE_URL}/api/competitors/${id}`, { method: 'DELETE' });
    loadCompetitors();
    if (editingId === id) cancelEdit();
  }

  // ── AI prompts state ──────────────────────────────────────────────────────────
  const [promptTab, setPromptTab]             = useState('blog-draft');
  const [systemPrompt, setSystemPrompt]       = useState('');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [promptMaxTokens, setPromptMaxTokens] = useState(2000);
  const [promptLanguage, setPromptLanguage]   = useState('spanish');
  const [promptLoading, setPromptLoading]     = useState(false);
  const [carouselSystemPrompt, setCarouselSystemPrompt]       = useState('');
  const [carouselGenerationPrompt, setCarouselGenerationPrompt] = useState('');
  const [carouselMaxTokens, setCarouselMaxTokens]             = useState(4096);
  const [carouselLoading, setCarouselLoading]                 = useState(false);
  const [loadedBlogPrompt, setLoadedBlogPrompt]       = useState({ systemPrompt: '', generationPrompt: '', maxTokens: 2000, language: 'spanish' });
  const [loadedCarouselPrompt, setLoadedCarouselPrompt] = useState({ systemPrompt: '', generationPrompt: '', maxTokens: 4096 });

  useEffect(() => {
    fetch(`${BASE_URL}/api/blog-drafts/prompt-settings`)
      .then(r => r.json())
      .then(d => {
        const sp = d.systemPrompt || '', gp = d.generationPrompt || '', mt = d.maxTokens || 2000, lang = d.language || 'spanish';
        setSystemPrompt(sp); setGenerationPrompt(gp); setPromptMaxTokens(mt); setPromptLanguage(lang);
        setLoadedBlogPrompt({ systemPrompt: sp, generationPrompt: gp, maxTokens: mt, language: lang });
      })
      .catch(() => {});
    fetch(`${BASE_URL}/api/carousel-prompts/prompt-settings`)
      .then(r => r.json())
      .then(d => {
        const sp = d.systemPrompt || '', gp = d.generationPrompt || '', mt = d.maxTokens || 4096;
        setCarouselSystemPrompt(sp); setCarouselGenerationPrompt(gp); setCarouselMaxTokens(mt);
        setLoadedCarouselPrompt({ systemPrompt: sp, generationPrompt: gp, maxTokens: mt });
      })
      .catch(() => {});
  }, []);

  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaLoading, setCanvaLoading]     = useState(false);
  const [canvaError, setCanvaError]         = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:3001/auth/canva/status')
      .then(r => r.json())
      .then(d => setCanvaConnected(d.connected))
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const canvaParam = params.get('canva');
    if (canvaParam === 'connected') setCanvaConnected(true);
    if (canvaParam === 'error') setCanvaError(true);
    if (canvaParam) window.history.replaceState({}, '', '/settings');
  }, []);

  async function handleDisconnect() {
    setCanvaLoading(true);
    await fetch('http://127.0.0.1:3001/auth/canva/disconnect', { method: 'POST' }).catch(() => {});
    setCanvaConnected(false);
    setCanvaLoading(false);
  }

  // ── Config save ───────────────────────────────────────────────────────────────
  const configDirty = blogUrl !== loadedBlogUrl || canvaTemplateUrl !== loadedCanvaUrl;

  async function saveConfig() {
    setConfigSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogUrl, canvaTemplateUrl }),
      });
      if (res.ok) {
        setLoadedBlogUrl(blogUrl);
        setLoadedCanvaUrl(canvaTemplateUrl);
        showToast('Saved successfully');
      } else {
        showToast('Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setConfigSaving(false);
    }
  }

  async function saveClaudePrompt() {
    setClaudePromptSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claudePrompt }),
      });
      if (res.ok) {
        setLoadedClaudePrompt(claudePrompt);
        showToast('Saved successfully');
      } else {
        showToast('Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setClaudePromptSaving(false);
    }
  }

  useEffect(() => {
    setTopbar({
      title:    'Settings',
      subtitle: 'Configure API keys and competitor sources',
    });
  }, []);

  // ── Scoring system state ──────────────────────────────────────────────────────
  const [scoringTab, setScoringTab] = useState('dimensions');

  const [dimensions, setDimensions] = useState([]);
  const [editingDimIdx, setEditingDimIdx] = useState(-1);
  const [dimDraft, setDimDraft]           = useState(null);
  const [dimOriginal, setDimOriginal]     = useState(null);

  const [topics, setTopics] = useState([]);
  const [editingTopicIdx, setEditingTopicIdx] = useState(-1);
  const [topicDraft, setTopicDraft]           = useState(null);
  const [topicOriginal, setTopicOriginal]     = useState(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const [thresholds, setThresholds] = useState([]);
  const [editingThreshIdx, setEditingThreshIdx] = useState(-1);
  const [threshDraft, setThreshDraft]           = useState(null);
  const [threshOriginal, setThreshOriginal]     = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/api/settings/dimensions`).then(r => r.json()),
      fetch(`${BASE_URL}/api/settings/topics`).then(r => r.json()),
      fetch(`${BASE_URL}/api/settings/thresholds`).then(r => r.json()),
    ]).then(([dims, tops, thresh]) => {
      setDimensions((Array.isArray(dims) ? dims : []).map(d => ({
        id: d.id, key: d.key, name: d.name, desc: d.description,
        min: d.min_points, max: d.max_points, rubric: d.rubric || '',
        enabled: d.enabled, channels: d.channels || [],
      })));
      setTopics((Array.isArray(tops) ? tops : []).map(t => ({
        id: t.id, name: t.name, tier: t.tier, keywords: t.keywords || [],
      })));
      setThresholds((Array.isArray(thresh) ? thresh : []).map(t => ({
        id: t.id, label: t.label, min: t.min_points, max: t.max_points,
        action: t.action || '', bg: t.badge_bg, color: t.badge_color,
      })));
    }).catch(() => {});
  }, []);

  const [testText, setTestText]       = useState('');
  const [testResult, setTestResult]   = useState(null);
  const [testChannel, setTestChannel] = useState('blog');
  const [testLoading, setTestLoading] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function toggleDim(idx, val) {
    const n = [...dimensions];
    n[idx] = { ...n[idx], enabled: val };
    setDimensions(n);
    fetch(`${BASE_URL}/api/settings/dimensions/${n[idx].key}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: val }),
    }).catch(() => {});
  }

  function startEditDim(idx) {
    setEditingDimIdx(idx);
    const draft = { ...dimensions[idx], channels: [...(dimensions[idx].channels || [])] };
    setDimDraft(draft);
    setDimOriginal(draft);
  }

  async function saveDim() {
    const next = [...dimensions];
    next[editingDimIdx] = dimDraft;
    setDimensions(next);
    setEditingDimIdx(-1);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/dimensions/${dimDraft.key}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dimDraft.name, description: dimDraft.desc,
          min_points: dimDraft.min, max_points: dimDraft.max,
          rubric: dimDraft.rubric, channels: dimDraft.channels,
        }),
      });
      if (res.ok) showToast('Saved successfully');
      else showToast('Failed to save', 'error');
    } catch {
      showToast('Failed to save', 'error');
    }
    setDimDraft(null);
    setDimOriginal(null);
  }

  function startEditTopic(idx) {
    setEditingTopicIdx(idx);
    const draft = { ...topics[idx], keywords: [...topics[idx].keywords] };
    setTopicDraft(draft);
    setTopicOriginal(draft);
    setNewKeywordInput('');
  }

  async function saveTopic() {
    const isNew = topicDraft.id === null;
    if (isNew) {
      try {
        const res = await fetch(`${BASE_URL}/api/settings/topics`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: topicDraft.name, tier: topicDraft.tier, keywords: topicDraft.keywords }),
        });
        if (res.ok) {
          const saved = await res.json();
          const next = [...topics];
          next[editingTopicIdx] = { id: saved.id, name: saved.name, tier: saved.tier, keywords: saved.keywords || [] };
          setTopics(next);
          showToast('Saved successfully');
        } else {
          const next = [...topics];
          next[editingTopicIdx] = topicDraft;
          setTopics(next);
          showToast('Failed to save', 'error');
        }
      } catch {
        const next = [...topics];
        next[editingTopicIdx] = topicDraft;
        setTopics(next);
        showToast('Failed to save', 'error');
      }
    } else {
      const next = [...topics];
      next[editingTopicIdx] = topicDraft;
      setTopics(next);
      try {
        const res = await fetch(`${BASE_URL}/api/settings/topics/${topicDraft.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: topicDraft.name, tier: topicDraft.tier, keywords: topicDraft.keywords }),
        });
        if (res.ok) showToast('Saved successfully');
        else showToast('Failed to save', 'error');
      } catch {
        showToast('Failed to save', 'error');
      }
    }
    setEditingTopicIdx(-1);
    setTopicDraft(null);
    setTopicOriginal(null);
  }

  function addNewTopic() {
    const newTopic = { id: null, name: '', tier: 'Relevant', keywords: [] };
    const next = [...topics, newTopic];
    setTopics(next);
    setEditingTopicIdx(next.length - 1);
    setTopicDraft(newTopic);
    setTopicOriginal(newTopic);
    setNewKeywordInput('');
  }

  function deleteTopic(idx) {
    const topic = topics[idx];
    if (topic.id !== null) {
      fetch(`${BASE_URL}/api/settings/topics/${topic.id}`, { method: 'DELETE' }).catch(() => {});
    }
    setTopics(topics.filter((_, i) => i !== idx));
    if (editingTopicIdx === idx) { setEditingTopicIdx(-1); setTopicDraft(null); setTopicOriginal(null); }
  }

  function startEditThresh(idx) {
    setEditingThreshIdx(idx);
    const draft = { ...thresholds[idx] };
    setThreshDraft(draft);
    setThreshOriginal(draft);
  }

  async function saveThresh() {
    const next = [...thresholds];
    next[editingThreshIdx] = threshDraft;
    setThresholds(next);
    setEditingThreshIdx(-1);
    try {
      const res = await fetch(`${BASE_URL}/api/settings/thresholds/${threshDraft.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: threshDraft.label, min_points: threshDraft.min, max_points: threshDraft.max,
          action: threshDraft.action, badge_bg: threshDraft.bg, badge_color: threshDraft.color,
        }),
      });
      if (res.ok) showToast('Saved successfully');
      else showToast('Failed to save', 'error');
    } catch {
      showToast('Failed to save', 'error');
    }
    setThreshDraft(null);
    setThreshOriginal(null);
  }

  const CHANNEL_BADGES = [
    { label: 'Blog',      activeBg: '#E6F1FB', activeColor: '#185FA5' },
    { label: 'LinkedIn',  activeBg: '#EAF3DE', activeColor: '#27500A' },
    { label: 'Instagram', activeBg: '#F1EFE8', activeColor: '#5F5E5A' },
  ];

  async function runTestScore() {
    if (!testText.trim() || testLoading) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/settings/test-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, channel: testChannel }),
      });
      const data = await res.json();
      if (res.ok) setTestResult(data);
      else setTestResult({ error: data.error || 'Scoring failed' });
    } catch {
      setTestResult({ error: 'Could not reach backend' });
    }
    setTestLoading(false);
  }

  const btnEdit = {
    padding: '4px 12px', border: '0.5px solid var(--color-border)',
    borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)',
    fontSize: 11, cursor: 'pointer', fontFamily: F, flexShrink: 0,
  };

  const SCORE_TABS = [
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'topics',     label: 'Topics & keywords' },
    { key: 'thresholds', label: 'Thresholds' },
    { key: 'testscorer', label: 'Test scorer' },
  ];

  // ── Dirty checks ──────────────────────────────────────────────────────────────
  const editCompDirty = editingId === 'new'
    ? !!(editDraft.name.trim() && editDraft.url.trim())
    : !!(editOriginal && JSON.stringify(editDraft) !== JSON.stringify(editOriginal) && editDraft.name.trim() && editDraft.url.trim());
  const dimDirty      = !!(dimDraft && dimOriginal && JSON.stringify(dimDraft) !== JSON.stringify(dimOriginal));
  const topicDirty    = !!(topicDraft && (topicDraft.id === null ? !!topicDraft.name.trim() : JSON.stringify(topicDraft) !== JSON.stringify(topicOriginal)));
  const threshDirty   = !!(threshDraft && threshOriginal && JSON.stringify(threshDraft) !== JSON.stringify(threshOriginal));
  const blogPromptDirty = systemPrompt !== loadedBlogPrompt.systemPrompt ||
    generationPrompt !== loadedBlogPrompt.generationPrompt ||
    promptMaxTokens !== loadedBlogPrompt.maxTokens ||
    promptLanguage !== loadedBlogPrompt.language;
  const carouselPromptDirty = carouselSystemPrompt !== loadedCarouselPrompt.systemPrompt ||
    carouselGenerationPrompt !== loadedCarouselPrompt.generationPrompt ||
    carouselMaxTokens !== loadedCarouselPrompt.maxTokens;

  return (
    <div style={{ fontFamily: F, maxWidth: 640 }}>

      {/* Card 1 — API configuration */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 16 }}>URL configuration</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Blog URL</label>
          <input type="text" value={blogUrl} onChange={e => setBlogUrl(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 4 }}>Source URL scraped by the Blog workflow</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Carousel template URL</label>
          <input
            type="text"
            value={canvaTemplateUrl}
            onChange={e => setCanvaTemplateUrl(e.target.value)}
            placeholder="https://canva.link/..."
            style={inputStyle}
          />
        </div>
        <button
          onClick={configDirty && !configSaving ? saveConfig : undefined}
          disabled={!configDirty || configSaving}
          style={saveBtnStyle(configDirty && !configSaving)}
        >
          {configSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Card 2 — Competitor sources */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Competitor sources</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {competitors.map(c => (
            <div key={c.id}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '0.5px solid var(--color-border)', borderRadius: editingId === c.id ? '6px 6px 0 0' : 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.url}</div>
                </div>
                <button onClick={() => editingId === c.id ? cancelEdit() : startEdit(c)} style={btnEdit}>
                  {editingId === c.id ? 'Cancel' : 'Edit'}
                </button>
                <button onClick={() => deleteCompetitor(c.id, c.name)} style={{ ...btnEdit, color: '#D95E8A', borderColor: '#F0C4D4' }}>
                  Delete
                </button>
              </div>
              {/* Inline edit form */}
              {editingId === c.id && (
                <div style={{ border: '0.5px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '12px 12px 14px', background: 'var(--color-background)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input style={inputStyle} value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Blog listing URL <InfoTooltip text={"URL of the competitor's blog listing page.\nThe scraper fetches article links from this URL."} /></label>
                    <input style={inputStyle} value={editDraft.url} onChange={e => setEditDraft(d => ({ ...d, url: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>LinkedIn company ID <span style={{ fontWeight: 400 }}>(optional)</span><InfoTooltip text={"The slug from the competitor's LinkedIn URL.\ne.g. linkedin.com/company/competitor-3-li → competitor-3-li"} /></label>
                    <input style={inputStyle} placeholder="e.g. competitor-3-li" value={editDraft.linkedin_id} onChange={e => setEditDraft(d => ({ ...d, linkedin_id: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Instagram handle <span style={{ fontWeight: 400 }}>(optional)</span><InfoTooltip text={"The @handle (without @) from the competitor's Instagram profile.\ne.g. instagram.com/competitor-6 → competitor-6"} /></label>
                    <input style={inputStyle} placeholder="e.g. competitor-6" value={editDraft.instagram_id} onChange={e => setEditDraft(d => ({ ...d, instagram_id: e.target.value }))} />
                  </div>
                  <button
                    onClick={editCompDirty && !competitorSaving ? saveEdit : undefined}
                    disabled={!editCompDirty || competitorSaving}
                    style={saveBtnStyle(editCompDirty && !competitorSaving)}
                  >
                    {competitorSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add new row */}
          {editingId === 'new' && (
            <div style={{ border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '12px 12px 14px', background: 'var(--color-background)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>New competitor</div>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} placeholder="e.g. Acme Consulting" autoFocus value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Blog listing URL <InfoTooltip text={"URL of the competitor's blog listing page.\nThe scraper fetches article links from this URL."} /></label>
                <input style={inputStyle} placeholder="https://example.com/blog/" value={editDraft.url} onChange={e => setEditDraft(d => ({ ...d, url: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn company ID <span style={{ fontWeight: 400 }}>(optional)</span><InfoTooltip text={"The slug from the competitor's LinkedIn URL.\ne.g. linkedin.com/company/acme → acme"} /></label>
                <input style={inputStyle} placeholder="e.g. acme-consulting" value={editDraft.linkedin_id} onChange={e => setEditDraft(d => ({ ...d, linkedin_id: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Instagram handle <span style={{ fontWeight: 400 }}>(optional)</span><InfoTooltip text={"The @handle (without @) from the competitor's Instagram profile.\ne.g. instagram.com/acme → acme"} /></label>
                <input style={inputStyle} placeholder="e.g. acme" value={editDraft.instagram_id} onChange={e => setEditDraft(d => ({ ...d, instagram_id: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={editCompDirty && !competitorSaving ? saveEdit : undefined}
                  disabled={!editCompDirty || competitorSaving}
                  style={saveBtnStyle(editCompDirty && !competitorSaving)}
                >
                  {competitorSaving ? 'Adding…' : 'Add'}
                </button>
                <button onClick={cancelEdit} style={btnEdit}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {editingId !== 'new' && (
          <button onClick={startAdd} style={{ marginTop: 10, padding: '5px 14px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: F }}>
            + Add competitor
          </button>
        )}
      </div>

      {/* Card 3 — Scoring system */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Scoring system</div>

        {/* Sub-tab pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {SCORE_TABS.map(t => {
            const active = scoringTab === t.key;
            return (
              <button key={t.key} onClick={() => setScoringTab(t.key)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                background: active ? '#1a3a5c' : 'transparent',
                color:      active ? '#fff'    : 'var(--color-text-muted)',
                border:     active ? 'none'    : '0.5px solid var(--color-border)',
              }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Dimensions ── */}
        {scoringTab === 'dimensions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {dimensions.map((dim, idx) => (
              <div key={dim.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border)' }}>
                  <Toggle on={dim.enabled} onChange={val => toggleDim(idx, val)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{dim.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{dim.desc}</div>
                    {idx === 2 && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 2 }}>Claude estimate — connect SEMrush for real data</div>}
                    {idx === 4 && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 2 }}>Checked automatically against content DB</div>}
                    <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                      {CHANNEL_BADGES.map((ch) => {
                        const active = (dim.channels || []).includes(ch.label.toLowerCase());
                        return (
                          <span key={ch.label} style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 8, fontWeight: 500,
                            background: active ? ch.activeBg : '#EBEBEB',
                            color:      active ? ch.activeColor : '#888780',
                            textDecoration: active ? 'none' : 'line-through',
                          }}>{ch.label}</span>
                        );
                      })}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-background)', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {dim.min} – {dim.max} pts
                  </span>
                  <button onClick={() => editingDimIdx === idx ? setEditingDimIdx(-1) : startEditDim(idx)} style={btnEdit}>
                    {editingDimIdx === idx ? 'Close' : 'Edit'}
                  </button>
                </div>
                {editingDimIdx === idx && dimDraft && (
                  <div style={{ background: 'var(--color-background)', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '14px 16px', margin: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input style={inputStyle} value={dimDraft.name} onChange={e => setDimDraft({ ...dimDraft, name: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <input style={inputStyle} value={dimDraft.desc} onChange={e => setDimDraft({ ...dimDraft, desc: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Min points</label>
                        <input type="number" style={inputStyle} value={dimDraft.min} onChange={e => setDimDraft({ ...dimDraft, min: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Max points</label>
                        <input type="number" style={inputStyle} value={dimDraft.max} onChange={e => setDimDraft({ ...dimDraft, max: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Rubric</label>
                      <textarea rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical' }} value={dimDraft.rubric} onChange={e => setDimDraft({ ...dimDraft, rubric: e.target.value })} placeholder="Describe what earns each score level..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Applies to channels</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {['Blog', 'LinkedIn', 'Instagram'].map(ch => {
                          const key = ch.toLowerCase();
                          const active = (dimDraft.channels || []).includes(key);
                          return (
                            <button key={ch} type="button" onClick={() => {
                              const chs = dimDraft.channels || [];
                              setDimDraft({ ...dimDraft, channels: active ? chs.filter(c => c !== key) : [...chs, key] });
                            }} style={{
                              padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: F,
                              background: active ? '#1a3a5c' : 'transparent',
                              color: active ? '#fff' : 'var(--color-text-muted)',
                              border: active ? 'none' : '0.5px solid var(--color-border)',
                            }}>{ch}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={dimDirty ? saveDim : undefined} disabled={!dimDirty} style={saveBtnStyle(dimDirty)}>Save</button>
                      <button onClick={() => { setEditingDimIdx(-1); setDimDraft(null); setDimOriginal(null); }} style={{ ...btnEdit, fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Topics & keywords ── */}
        {scoringTab === 'topics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {topics.map((topic, idx) => {
              const tierCol = TIER_COLORS[topic.tier] || TIER_COLORS['Loosely related'];
              return (
                <div key={topic.id ?? `new-${idx}`}>
                  <div style={{ padding: '10px 0', borderBottom: '0.5px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{topic.name || <span style={{ color: 'var(--color-text-muted)' }}>Untitled topic</span>}</div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: tierCol.bg, color: tierCol.color, whiteSpace: 'nowrap' }}>{topic.tier}</span>
                      <button onClick={() => editingTopicIdx === idx ? setEditingTopicIdx(-1) : startEditTopic(idx)} style={btnEdit}>{editingTopicIdx === idx ? 'Close' : 'Edit'}</button>
                      <button onClick={() => deleteTopic(idx)} style={{ ...btnEdit, color: '#A32D2D', borderColor: 'rgba(163,45,45,0.3)' }}>Delete</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {topic.keywords.map((kw, ki) => (
                        <span key={ki} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--color-background)', border: '0.5px solid var(--color-border)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {kw}
                          <span onClick={() => {
                            const n = [...topics]; n[idx] = { ...n[idx], keywords: n[idx].keywords.filter((_, i) => i !== ki) }; setTopics(n);
                            if (topicDraft && editingTopicIdx === idx) setTopicDraft({ ...topicDraft, keywords: topicDraft.keywords.filter((_, i) => i !== ki) });
                          }} style={{ cursor: 'pointer', opacity: 0.6, fontWeight: 700 }}>×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {editingTopicIdx === idx && topicDraft && (
                    <div style={{ background: 'var(--color-background)', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '14px 16px', margin: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Topic name</label>
                        <input style={inputStyle} value={topicDraft.name} onChange={e => setTopicDraft({ ...topicDraft, name: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Tier</label>
                        <select style={{ ...inputStyle }} value={topicDraft.tier} onChange={e => setTopicDraft({ ...topicDraft, tier: e.target.value })}>
                          {Object.keys(TIER_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Keywords</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', minHeight: 36 }}>
                          {topicDraft.keywords.map((kw, ki) => (
                            <span key={ki} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {kw}
                              <span onClick={() => setTopicDraft({ ...topicDraft, keywords: topicDraft.keywords.filter((_, i) => i !== ki) })} style={{ cursor: 'pointer', fontWeight: 700 }}>×</span>
                            </span>
                          ))}
                          <input
                            style={{ border: 'none', outline: 'none', fontSize: 11, fontFamily: F, minWidth: 80, background: 'transparent' }}
                            value={newKeywordInput}
                            onChange={e => setNewKeywordInput(e.target.value)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && newKeywordInput.trim()) {
                                e.preventDefault();
                                setTopicDraft({ ...topicDraft, keywords: [...topicDraft.keywords, newKeywordInput.trim()] });
                                setNewKeywordInput('');
                              }
                            }}
                            placeholder="Type + Enter to add..."
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={topicDirty ? saveTopic : undefined} disabled={!topicDirty} style={saveBtnStyle(topicDirty)}>Save</button>
                        <button onClick={() => {
                          if (topicDraft?.id === null) setTopics(topics.filter((_, i) => i !== editingTopicIdx));
                          setEditingTopicIdx(-1); setTopicDraft(null); setTopicOriginal(null);
                        }} style={{ ...btnEdit, fontSize: 12 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={addNewTopic} style={{ marginTop: 12, padding: '6px 14px', border: '1.5px dashed var(--color-border)', borderRadius: 6, background: 'transparent', color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: F, textAlign: 'left' }}>
              + Add topic
            </button>
          </div>
        )}

        {/* ── Tab: Thresholds ── */}
        {scoringTab === 'thresholds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {thresholds.map((t, idx) => (
              <div key={t.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border)' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 10, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 70 }}>{t.min} – {t.max} pts</span>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{t.action}</span>
                  <button onClick={() => editingThreshIdx === idx ? setEditingThreshIdx(-1) : startEditThresh(idx)} style={btnEdit}>{editingThreshIdx === idx ? 'Close' : 'Edit'}</button>
                </div>
                {editingThreshIdx === idx && threshDraft && (
                  <div style={{ background: 'var(--color-background)', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '14px 16px', margin: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={labelStyle}>Min score</label>
                        <input type="number" style={inputStyle} value={threshDraft.min} onChange={e => setThreshDraft({ ...threshDraft, min: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Max score</label>
                        <input type="number" style={inputStyle} value={threshDraft.max} onChange={e => setThreshDraft({ ...threshDraft, max: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Priority label</label>
                      <input style={inputStyle} value={threshDraft.label} onChange={e => setThreshDraft({ ...threshDraft, label: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Action description</label>
                      <input style={inputStyle} value={threshDraft.action} onChange={e => setThreshDraft({ ...threshDraft, action: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Badge color</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { bg: '#E6F1FB', color: '#0C447C', label: 'Blue' },
                          { bg: '#FAEEDA', color: '#633806', label: 'Amber' },
                          { bg: '#F1EFE8', color: '#5F5E5A', label: 'Gray' },
                        ].map(swatch => (
                          <div key={swatch.label} onClick={() => setThreshDraft({ ...threshDraft, bg: swatch.bg, color: swatch.color })}
                            style={{ width: 32, height: 20, borderRadius: 10, background: swatch.bg, cursor: 'pointer', border: threshDraft.bg === swatch.bg ? `2px solid ${swatch.color}` : '2px solid transparent' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={threshDirty ? saveThresh : undefined} disabled={!threshDirty} style={saveBtnStyle(threshDirty)}>Save</button>
                      <button onClick={() => { setEditingThreshIdx(-1); setThreshDraft(null); setThreshOriginal(null); }} style={{ ...btnEdit, fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Test scorer ── */}
        {scoringTab === 'testscorer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Article title + summary</label>
              <textarea
                rows={4}
                value={testText}
                onChange={e => setTestText(e.target.value)}
                placeholder="Paste an article title and short summary to test the current scoring rubric..."
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={runTestScore} disabled={testLoading || !testText.trim()} style={{ padding: '7px 18px', borderRadius: 6, fontSize: 12, fontFamily: F, fontWeight: 500, cursor: (testLoading || !testText.trim()) ? 'default' : 'pointer', background: '#1a3a5c', color: '#fff', border: 'none', opacity: !testText.trim() ? 0.5 : 1 }}>
                {testLoading ? 'Scoring…' : 'Run test score ↗'}
              </button>
              <select
                value={testChannel}
                onChange={e => { setTestChannel(e.target.value); setTestResult(null); }}
                style={{ ...inputStyle, width: 'auto', height: 34, paddingRight: 28, cursor: 'pointer' }}
              >
                <option value="blog">Blog article</option>
                <option value="linkedin">LinkedIn post</option>
                <option value="instagram">Instagram post</option>
              </select>
            </div>
            {testResult?.error && (
              <div style={{ fontSize: 12, color: '#D95E8A', padding: '8px 12px', background: '#FDF2F5', border: '0.5px solid #F0C4D4', borderRadius: 6 }}>
                {testResult.error}
              </div>
            )}
            {testResult && !testResult.error && (
              <div style={{ border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1a3a5c' }}>{testResult.total}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>out of {testResult.totalMax} applicable pts · {Math.round(testResult.total / testResult.totalMax * 100)}%</span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: testResult.priorityBg, color: testResult.priorityColor, alignSelf: 'flex-start' }}>{testResult.priority}</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-border)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#1a3a5c', width: `${testResult.total / testResult.totalMax * 100}%` }} />
                </div>
                <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {testResult.dims.map((d, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{d.label}</span>
                        <span style={{ color: '#1a3a5c', fontWeight: 600 }}>{d.score}/{d.max}</span>
                      </div>
                      {d.reason && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{d.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 3.5 — AI prompts */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>AI prompts</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14 }}>Edit the prompts Claude uses to generate content</div>

        {/* Prompt type tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['Blog draft', 'Carousel', 'LinkedIn', 'Instagram'].map(t => {
            const key = t.toLowerCase().replace(' ', '-');
            const active = promptTab === key;
            return (
              <button key={key} onClick={() => setPromptTab(key)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: F, fontWeight: 500,
                background: active ? '#1a3a5c' : 'transparent',
                color:      active ? '#fff'    : 'var(--color-text-muted)',
                border:     active ? 'none'    : '0.5px solid var(--color-border)',
              }}>{t}</button>
            );
          })}
        </div>

        {promptTab === 'blog-draft' ? (
          <>
            {/* Warning */}
            <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#633806', marginBottom: 12 }}>
              Changes affect all future blog drafts. Test before saving.
            </div>

            {/* Variable tokens */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>Available variables — click to insert</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>These are replaced automatically when Claude runs.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['{competitorName}', '{sourceTitle}', '{fullText}', '{matchedKeyword}', '{scoreTotal}', '{contentGapReason}'].map(v => (
                  <span key={v} onClick={() => setGenerationPrompt(p => p + ' ' + v)} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#E6F1FB', color: '#0C447C',
                    fontFamily: 'monospace', cursor: 'pointer',
                  }}>{v}</span>
                ))}
              </div>
            </div>

            {/* System prompt */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>System prompt</label>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>Defines who Claude is. Rarely needs editing.</div>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', minHeight: 80, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '12px 0' }} />

            {/* Generation prompt */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>Generation prompt</label>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>Main instructions for rewriting competitor articles.</div>
              <textarea
                value={generationPrompt}
                onChange={e => setGenerationPrompt(e.target.value)}
                rows={14}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', minHeight: 320, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '12px 0' }} />

            {/* Settings row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Target word count</label>
                <input style={inputStyle} defaultValue="650–900 words" />
              </div>
              <div>
                <label style={labelStyle}>Output language</label>
                <select style={inputStyle} value={promptLanguage} onChange={e => setPromptLanguage(e.target.value)}>
                  <option value="spanish">Spanish</option>
                  <option value="match">Match source</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Max tokens</label>
                <input type="number" style={inputStyle} value={promptMaxTokens} onChange={e => setPromptMaxTokens(Number(e.target.value))} />
              </div>
            </div>

            {/* Button row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={blogPromptDirty && !promptLoading ? async () => {
                  setPromptLoading(true);
                  try {
                    const res = await fetch(`${BASE_URL}/api/blog-drafts/prompt-settings`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ systemPrompt, generationPrompt, maxTokens: promptMaxTokens, language: promptLanguage }),
                    });
                    if (res.ok) {
                      setLoadedBlogPrompt({ systemPrompt, generationPrompt, maxTokens: promptMaxTokens, language: promptLanguage });
                      showToast('Saved successfully');
                    } else {
                      showToast('Failed to save', 'error');
                    }
                  } catch {
                    showToast('Failed to save', 'error');
                  }
                  setPromptLoading(false);
                } : undefined}
                disabled={!blogPromptDirty || promptLoading}
                style={saveBtnStyle(blogPromptDirty && !promptLoading)}
              >
                {promptLoading ? 'Saving…' : 'Save prompt'}
              </button>
              <button
                onClick={() => {
                  fetch(`${BASE_URL}/api/blog-drafts/prompt-settings`)
                    .then(r => r.json())
                    .then(d => {
                      const sp = d.systemPrompt || '', gp = d.generationPrompt || '', mt = d.maxTokens || 2000, lang = d.language || 'spanish';
                      setSystemPrompt(sp); setGenerationPrompt(gp); setPromptMaxTokens(mt); setPromptLanguage(lang);
                      setLoadedBlogPrompt({ systemPrompt: sp, generationPrompt: gp, maxTokens: mt, language: lang });
                    })
                    .catch(() => {});
                }}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontFamily: F, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)' }}
              >
                Reset to default
              </button>
              <button
                onClick={() => alert('Test scorer coming soon')}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontFamily: F, cursor: 'pointer', background: 'transparent', color: '#185FA5', border: '0.5px solid #185FA5' }}
              >
                Test with last article →
              </button>
            </div>
          </>
        ) : promptTab === 'carousel' ? (
          <>
            <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#633806', marginBottom: 12 }}>
              Changes affect all future carousel generations. Test before saving.
            </div>

            {/* Variable tokens */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>Available variables — click to insert</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>These are replaced automatically when Claude runs.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['{title}', '{fullText}', '{slidesSchema}'].map(v => (
                  <span key={v} onClick={() => setCarouselGenerationPrompt(p => p + ' ' + v)} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#E6F1FB', color: '#0C447C',
                    fontFamily: 'monospace', cursor: 'pointer',
                  }}>{v}</span>
                ))}
              </div>
            </div>

            {/* System prompt */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>System prompt</label>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>Defines who Claude is and the brand voice.</div>
              <textarea
                value={carouselSystemPrompt}
                onChange={e => setCarouselSystemPrompt(e.target.value)}
                rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', minHeight: 80, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '12px 0' }} />

            {/* Generation prompt */}
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>Generation prompt</label>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 6 }}>Instructions for generating carousel slides. Use <code style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '0 3px', borderRadius: 3 }}>{'{slidesSchema}'}</code> where the slide structure should be injected.</div>
              <textarea
                value={carouselGenerationPrompt}
                onChange={e => setCarouselGenerationPrompt(e.target.value)}
                rows={14}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', minHeight: 320, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
              />
            </div>

            <div style={{ height: '0.5px', background: 'var(--color-border)', margin: '12px 0' }} />

            {/* Settings row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Max tokens</label>
                <input type="number" style={inputStyle} value={carouselMaxTokens} onChange={e => setCarouselMaxTokens(Number(e.target.value))} />
              </div>
            </div>

            {/* Button row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={carouselPromptDirty && !carouselLoading ? async () => {
                  setCarouselLoading(true);
                  try {
                    const res = await fetch(`${BASE_URL}/api/carousel-prompts/prompt-settings`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ systemPrompt: carouselSystemPrompt, generationPrompt: carouselGenerationPrompt, maxTokens: carouselMaxTokens }),
                    });
                    if (res.ok) {
                      setLoadedCarouselPrompt({ systemPrompt: carouselSystemPrompt, generationPrompt: carouselGenerationPrompt, maxTokens: carouselMaxTokens });
                      showToast('Saved successfully');
                    } else {
                      showToast('Failed to save', 'error');
                    }
                  } catch {
                    showToast('Failed to save', 'error');
                  }
                  setCarouselLoading(false);
                } : undefined}
                disabled={!carouselPromptDirty || carouselLoading}
                style={saveBtnStyle(carouselPromptDirty && !carouselLoading)}
              >
                {carouselLoading ? 'Saving…' : 'Save prompt'}
              </button>
              <button
                onClick={() => {
                  fetch(`${BASE_URL}/api/carousel-prompts/prompt-settings`)
                    .then(r => r.json())
                    .then(d => {
                      const sp = d.systemPrompt || '', gp = d.generationPrompt || '', mt = d.maxTokens || 4096;
                      setCarouselSystemPrompt(sp); setCarouselGenerationPrompt(gp); setCarouselMaxTokens(mt);
                      setLoadedCarouselPrompt({ systemPrompt: sp, generationPrompt: gp, maxTokens: mt });
                    })
                    .catch(() => {});
                }}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontFamily: F, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)' }}
              >
                Reset to default
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Coming soon — only Blog draft and Carousel prompts are configurable right now.
          </div>
        )}
      </div>

      {/* Card 4 — Integrations */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 14 }}>Integrations</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#7B2FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, flexShrink: 0 }}>C</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)' }}>Canva</div>
              <div style={{ fontSize: 11, color: canvaConnected ? '#22c55e' : 'var(--color-text-subtle)' }}>
                {canvaConnected ? 'Connected' : 'Not connected'}
              </div>
            </div>
          </div>
          {canvaConnected ? (
            <button onClick={handleDisconnect} disabled={canvaLoading} style={{ padding: '4px 12px', border: '0.5px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: 11, cursor: canvaLoading ? 'default' : 'pointer', fontFamily: F }}>
              {canvaLoading ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={() => { window.location.href = 'http://127.0.0.1:3001/auth/canva'; }} style={{ padding: '4px 14px', border: 'none', borderRadius: 6, background: 'var(--color-blue)', color: '#fff', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: F }}>
                Connect Canva
              </button>
              {canvaError && <div style={{ fontSize: 10, color: '#ef4444' }}>Connection failed — check Canva app settings</div>}
            </div>
          )}
        </div>
      </div>

      {/* Card 5 — Claude prompt */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4 }}>Claude prompt</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Prompt copied when Carla clicks "Copy to Claude". Use <code style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '0 3px', borderRadius: 3 }}>{'{canvaUrl}'}</code> and <code style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '0 3px', borderRadius: 3 }}>{'{slideText}'}</code> as placeholders.
        </div>
        <textarea
          value={claudePrompt}
          onChange={e => setClaudePrompt(e.target.value)}
          rows={8}
          style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'vertical', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6 }}
        />
        <button
          onClick={claudePrompt !== loadedClaudePrompt && !claudePromptSaving ? saveClaudePrompt : undefined}
          disabled={claudePrompt === loadedClaudePrompt || claudePromptSaving}
          style={{ ...saveBtnStyle(claudePrompt !== loadedClaudePrompt && !claudePromptSaving), marginTop: 10 }}
        >
          {claudePromptSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Toast overlay */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '10px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: F,
            background: t.type === 'error' ? '#FDF2F5' : '#F0FBF6',
            color: t.type === 'error' ? '#A32D2D' : '#1D9E75',
            border: `0.5px solid ${t.type === 'error' ? '#F0C4D4' : '#A3D9BB'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            {t.msg}
          </div>
        ))}
      </div>

    </div>
  );
}
