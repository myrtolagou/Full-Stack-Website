import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useSetTopbar } from '../../context/TopbarContext';
import { BASE_URL } from '../../config';

const F = "'Inter', system-ui, sans-serif";

const COMPETITOR_COLORS = {
  'Competitor 3':       { border: '#378ADD', bg: '#E6F1FB', text: '#0C447C' },
  'Competitor 7':       { border: '#D4537E', bg: '#FBEAF0', text: '#72243E' },
  'Competitor 5':  { border: '#EF9F27', bg: '#FAEEDA', text: '#633806' },
  'Competitor 1':        { border: '#1D9E75', bg: '#E1F5EE', text: '#085041' },
  'Competitor 2': { border: '#7F77DD', bg: '#EEEDFE', text: '#3C3489' },
  'Competitor 6':      { border: '#D85A30', bg: '#FAECE7', text: '#712B13' },
  'Competitor 4':        { border: '#639922', bg: '#EAF3DE', text: '#27500A' },
};

const STATUS_STYLES = {
  pending:   { bg: '#FAEEDA', color: '#633806', label: 'Pending review' },
  approved:  { bg: '#E1F5EE', color: '#085041', label: 'Approved' },
  published: { bg: '#E6F1FB', color: '#0C447C', label: 'Published' },
};

function Badge({ bg, color, children, style = {} }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: bg, color, whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  );
}

function CompetitorBadge({ name }) {
  const col = COMPETITOR_COLORS[name] || { bg: '#F1EFE8', text: '#5F5E5A' };
  return <Badge bg={col.bg} color={col.text}>{name}</Badge>;
}

function EditorToolbar({ editor }) {
  if (!editor) return null;
  const btnBase   = { border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontSize: 13, fontFamily: F, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 28, minWidth: 28 };
  const btnActive = { ...btnBase, background: '#E6F1FB', color: '#0C447C' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: '0.5px solid var(--color-border)', flexWrap: 'wrap', background: '#FAFBFC' }}>
      {[
        { label: <strong>B</strong>, action: () => editor.chain().focus().toggleBold().run(),      isActive: editor.isActive('bold') },
        { label: <em>I</em>,         action: () => editor.chain().focus().toggleItalic().run(),    isActive: editor.isActive('italic') },
        { label: <u>U</u>,           action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline') },
      ].map(({ label, action, isActive }, i) => (
        <button key={i} style={isActive ? btnActive : btnBase} onMouseDown={e => { e.preventDefault(); action(); }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}>{label}</button>
      ))}
      <div style={{ width: '0.5px', height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
      {[
        { label: <span style={{ fontSize: 11, fontWeight: 600 }}>H2</span>, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
        { label: <span style={{ fontSize: 11, fontWeight: 600 }}>H3</span>, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive('heading', { level: 3 }) },
      ].map(({ label, action, isActive }, i) => (
        <button key={i} style={isActive ? btnActive : btnBase} onMouseDown={e => { e.preventDefault(); action(); }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}>{label}</button>
      ))}
      <div style={{ width: '0.5px', height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
      {[
        { label: '≡',  action: () => editor.chain().focus().toggleBulletList().run(),  isActive: editor.isActive('bulletList') },
        { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList') },
        { label: '"',  action: () => editor.chain().focus().toggleBlockquote().run(),  isActive: editor.isActive('blockquote') },
      ].map(({ label, action, isActive }, i) => (
        <button key={i} style={isActive ? btnActive : btnBase} onMouseDown={e => { e.preventDefault(); action(); }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}>{label}</button>
      ))}
      <div style={{ width: '0.5px', height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
      {[
        { label: '↩', action: () => editor.chain().focus().undo().run(), isActive: false },
        { label: '↪', action: () => editor.chain().focus().redo().run(), isActive: false },
      ].map(({ label, action, isActive }, i) => (
        <button key={i} style={btnBase} onMouseDown={e => { e.preventDefault(); action(); }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>{label}</button>
      ))}
    </div>
  );
}

export default function BlogDraftsPage() {
  const setTopbar = useSetTopbar();

  const [drafts, setDrafts]               = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [editedTitle, setEditedTitle]     = useState('');
  const [editedBody, setEditedBody]       = useState('');
  const [chatMessages, setChatMessages]   = useState([]);
  const [chatInput, setChatInput]         = useState('');
  const [chatLoading, setChatLoading]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [pasteMode, setPasteMode]         = useState(false);
  const [pastedText, setPastedText]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [toasts, setToasts]               = useState([]);
  const [queueFilter, setQueueFilter]     = useState('all');
  const chatBottomRef                     = useRef(null);

  function showToast(msg, type = 'success') {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Click "Generate draft" to create content, or start writing…' }),
    ],
    content: '',
    onUpdate: ({ editor }) => setEditedBody(editor.getHTML()),
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tiptap-styles';
    style.textContent = `
      .ProseMirror { padding: 20px 0; min-height: 480px; outline: none; font-family: 'Inter', system-ui, sans-serif; font-size: 14px; line-height: 1.8; color: var(--color-text); }
      .ProseMirror h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; color: var(--color-text); }
      .ProseMirror h3 { font-size: 15px; font-weight: 600; margin: 18px 0 6px; color: var(--color-text); }
      .ProseMirror p { margin: 0 0 12px; }
      .ProseMirror ul, .ProseMirror ol { padding-left: 20px; margin: 0 0 12px; }
      .ProseMirror li { margin-bottom: 4px; }
      .ProseMirror blockquote { border-left: 3px solid #1a3a5c; margin: 16px 0; padding: 8px 0 8px 16px; color: var(--color-text-muted); font-style: italic; border-radius: 0 4px 4px 0; }
      .ProseMirror strong { font-weight: 600; }
      .ProseMirror em { font-style: italic; }
      .ProseMirror a { color: #185FA5; text-decoration: underline; cursor: pointer; }
      .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: var(--color-text-muted); pointer-events: none; height: 0; }
      .ProseMirror:focus { outline: none; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .claude-spinner { width: 18px; height: 18px; animation: spin 1.2s linear infinite; }
    `;
    if (!document.getElementById('tiptap-styles')) document.head.appendChild(style);
    return () => { const el = document.getElementById('tiptap-styles'); if (el) el.remove(); };
  }, []);

  async function fetchDrafts() {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts`);
      const data = await res.json();
      const list = data.drafts || [];
      setDrafts(list);
      if (list.length > 0) setSelectedDraft(list[0]);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    setTopbar({ title: 'Blog drafts', subtitle: "Competitor articles rewritten in BcnCor's voice", actions: null });
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (!selectedDraft) return;
    setEditedTitle(selectedDraft.title || '');
    setEditedBody(selectedDraft.body || '');
    if (editor) editor.commands.setContent(selectedDraft.body || '');
    setChatMessages([{ role: 'claude', text: selectedDraft.body ? 'Draft loaded. Ask me to improve any part of the article.' : 'No draft generated yet. Click "Generate draft" to create the article, or start writing.' }]);
    setPasteMode(false);
    setPastedText('');
  }, [selectedDraft?.id, editor]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  function openDraft(draft) { setSelectedDraft(draft); }

  async function handleSave() {
    if (!selectedDraft) return;
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle, body: editedBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedDraft(data.draft);
        setDrafts(prev => prev.map(d => d.id === data.draft.id ? data.draft : d));
        showToast('Saved successfully');
      } else {
        showToast('Failed to save', 'error');
      }
    } catch {
      showToast('Failed to save', 'error');
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/blog-drafts/${id}`, { method: 'DELETE' });
      if (!res.ok) { showToast('Failed to delete', 'error'); return; }
      const remaining = drafts.filter(d => d.id !== id);
      setDrafts(remaining);
      if (selectedDraft?.id === id) setSelectedDraft(remaining[0] || null);
      showToast('Draft deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  }

  async function handleApprove() {
    if (!selectedDraft) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('Failed to approve', 'error'); return; }
      setSelectedDraft(data.draft);
      setDrafts(prev => prev.map(d => d.id === data.draft.id ? data.draft : d));
      setQueueFilter('approved');
      showToast('Draft approved');
    } catch {
      showToast('Failed to approve', 'error');
    }
  }

  async function handleGenerate() {
    if (!selectedDraft || generating) return;
    setGenerating(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}/generate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const updated = data.draft;
        setSelectedDraft(updated);
        setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
        setEditedTitle(updated.title || '');
        setEditedBody(updated.body  || '');
        if (editor) editor.commands.setContent(updated.body || '');
        showToast('Draft generated');
      } else if (res.status === 422) {
        setPasteMode(true);
      } else {
        showToast(data.message || 'Failed to generate draft', 'error');
      }
    } catch {
      showToast('Failed to generate draft', 'error');
    }
    setGenerating(false);
  }

  async function handleGenerateFromPaste() {
    if (!selectedDraft || generating || pastedText.trim().length < 100) return;
    setGenerating(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.draft;
        setSelectedDraft(updated);
        setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
        setEditedTitle(updated.title || '');
        setEditedBody(updated.body  || '');
        if (editor) editor.commands.setContent(updated.body || '');
        setPasteMode(false);
        setPastedText('');
        showToast('Draft generated');
      } else {
        showToast(data.message || 'Failed to generate draft', 'error');
      }
    } catch {
      showToast('Failed to generate draft', 'error');
    }
    setGenerating(false);
  }

  async function handleApply(recommendations) {
    if (!selectedDraft || generating) return;
    setGenerating(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendations }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.draft;
        setSelectedDraft(updated);
        setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
        setEditedTitle(updated.title || '');
        setEditedBody(updated.body  || '');
        if (editor) editor.commands.setContent(updated.body || '');
        showToast('Draft written');
      } else {
        showToast(data.message || 'Failed to generate draft', 'error');
      }
    } catch {
      showToast('Failed to generate draft', 'error');
    }
    setGenerating(false);
  }

  async function handleSendChat(msg) {
    const message = msg || chatInput;
    if (!message.trim() || !selectedDraft) return;
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/blog-drafts/${selectedDraft.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, currentBody: editedBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'claude', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'claude', text: 'Something went wrong. Please try again.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'claude', text: 'Could not reach Claude. Check your API key in Settings.' }]);
    }
    setChatLoading(false);
  }

  const wordCount = Math.round(
    (editor?.getText() || editedBody.replace(/<[^>]*>/g, '')).split(/\s+/).filter(Boolean).length
  );

  // ── EDITOR VIEW ──────────────────────────────────────────────────────────────
  if (selectedDraft) {
    const st = STATUS_STYLES[selectedDraft.status] || STATUS_STYLES.pending;
    const queueFiltered = drafts.filter(d => queueFilter === 'all' || d.status === queueFilter);
    const hasBody = !!(selectedDraft.body && selectedDraft.body.trim());

    return (
      <div style={{ display: 'flex', height: 'calc(100% + 36px)', overflow: 'hidden', fontFamily: F, margin: '-18px -20px' }}>

        {/* ── Left queue ── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '0.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>
          <div style={{ padding: '8px 10px', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Queue · {drafts.filter(d => d.status === 'pending').length}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Done' }].map(({ key, label }) => {
                const active = queueFilter === key;
                return (
                  <button key={key} onClick={() => setQueueFilter(key)}
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
            {queueFiltered.map(draft => {
              const active    = draft.id === selectedDraft.id;
              const aiPending = draft.aiGenerated && draft.status === 'pending';
              const s   = STATUS_STYLES[draft.status] || STATUS_STYLES.pending;
              const col = COMPETITOR_COLORS[draft.competitor] || { bg: '#F1EFE8', text: '#5F5E5A' };
              const wc  = Math.round((draft.body || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length);
              return (
                <div key={draft.id} onClick={() => openDraft(draft)}
                  style={{ padding: '9px 10px', cursor: 'pointer', background: active ? '#E6F1FB' : 'transparent', borderLeft: (active || aiPending) ? '3px solid #378ADD' : '3px solid transparent', borderRadius: aiPending && !active ? '0 8px 8px 0' : undefined, borderBottom: '0.5px solid var(--color-border)', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#EBF4FC'; e.currentTarget.style.borderLeft = '3px solid rgba(55,138,221,0.35)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = (active || aiPending) ? '3px solid #378ADD' : '3px solid transparent'; } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, background: col.bg, color: col.text, borderRadius: 10, padding: '1px 6px' }}>{draft.competitor}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, fontWeight: 500, background: s.bg, color: s.color, borderRadius: 10, padding: '1px 6px' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {draft.title || draft.sourceTitle || 'Untitled draft'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-subtle)' }}>
                      {draft.date}{wc > 0 ? ` · ${wc} words` : ' · No draft yet'}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(draft.id); }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C0392B'; e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      style={{ padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 4, lineHeight: 1, flexShrink: 0 }}
                      title="Delete draft"
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
          </div>
        </div>

        {/* ── Editor column ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)', borderRight: '0.5px solid var(--color-border)' }}>
          {/* Toolbar */}
          <div style={{ flexShrink: 0, borderBottom: '0.5px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <EditorToolbar editor={editor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12, flexShrink: 0 }}>
              <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
              <button onClick={handleSave} disabled={saving}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#E6EFF8'; e.currentTarget.style.color = '#1a3a5c'; } }}
                onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500, cursor: saving ? 'default' : 'pointer', background: 'transparent', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={handleApprove}
                onMouseEnter={e => { e.currentTarget.style.background = '#178A63'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1D9E75'; }}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: F, fontWeight: 500, cursor: 'pointer', background: '#1D9E75', color: '#fff', border: 'none' }}>
                Approve
              </button>
            </div>
          </div>

          {/* Scrollable page */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px 60px' }}>
            <div style={{ maxWidth: 620, margin: '0 auto' }}>

              {/* Toasts */}
              <div style={{ position: 'fixed', bottom: 24, right: 320, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
                {toasts.map(t => (
                  <div key={t.id} style={{ padding: '10px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: F, background: t.type === 'error' ? '#FDF2F5' : '#F0FBF6', color: t.type === 'error' ? '#A32D2D' : '#1D9E75', border: `0.5px solid ${t.type === 'error' ? '#F0C4D4' : '#A3D9BB'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {t.msg}
                  </div>
                ))}
              </div>

              {/* Source bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, marginBottom: 20, borderBottom: '0.5px solid var(--color-border)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Based on:</span>
                <CompetitorBadge name={selectedDraft.competitor} />
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDraft.sourceTitle}</span>
                <a href={selectedDraft.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#185FA5', textDecoration: 'none', flexShrink: 0, marginLeft: 'auto' }}>View original →</a>
              </div>

              {/* Title */}
              <textarea
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                rows={2}
                style={{ width: '100%', fontSize: 24, fontWeight: 500, border: 'none', background: 'transparent', color: 'var(--color-text)', outline: 'none', fontFamily: F, lineHeight: 1.3, marginBottom: 6, resize: 'none', overflow: 'hidden', boxSizing: 'border-box' }}
              />

              {/* Byline */}
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                BcnCor · {selectedDraft.date}{wordCount > 0 ? ` · ~${wordCount} words` : ''}
              </div>

              <div style={{ height: 3, background: '#1a3a5c', borderRadius: 2, marginBottom: 0 }} />

              {/* Body — generate CTA / paste fallback / editor */}
              {!hasBody ? (
                pasteMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 320, gap: 12, padding: '40px 0' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>Paste the article text</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      The site couldn't be scraped automatically. Paste the article content below and Claude will rewrite it in BcnCor's voice.
                    </div>
                    <textarea
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste the article text here…"
                      rows={10}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontFamily: F, fontSize: 12, lineHeight: 1.6, resize: 'vertical', background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setPasteMode(false); setPastedText(''); }}
                        style={{ padding: '7px 16px', borderRadius: 6, fontSize: 12, fontFamily: F, background: 'transparent', color: 'var(--color-text-muted)', border: '0.5px solid var(--color-border)', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={handleGenerateFromPaste} disabled={generating || pastedText.trim().length < 100}
                        style={{ padding: '7px 20px', borderRadius: 6, fontSize: 13, fontFamily: F, fontWeight: 600, cursor: (generating || pastedText.trim().length < 100) ? 'default' : 'pointer', background: (generating || pastedText.trim().length < 100) ? '#9CA3AF' : '#1a3a5c', color: '#fff', border: 'none' }}>
                        {generating ? 'Generating…' : '✦ Generate from pasted text'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 14, padding: '40px 0' }}>
                    <div style={{ fontSize: 32, color: 'var(--color-border)' }}>✦</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', textAlign: 'center' }}>No draft generated yet</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                      Claude will scrape the source article and rewrite it in BcnCor's voice.
                    </div>
                    <button onClick={handleGenerate} disabled={generating}
                      style={{ marginTop: 4, padding: '10px 24px', borderRadius: 8, fontSize: 13, fontFamily: F, fontWeight: 600, cursor: generating ? 'default' : 'pointer', background: generating ? '#9CA3AF' : '#1a3a5c', color: '#fff', border: 'none' }}>
                      {generating ? 'Generating…' : '✦ Generate draft'}
                    </button>
                  </div>
                )
              ) : (
                <EditorContent editor={editor} style={{ minHeight: 480 }} />
              )}
            </div>
          </div>
        </div>

        {/* ── Chat column ── */}
        <div style={{ width: 300, flexShrink: 0, background: '#F5F1EB', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '0.5px solid #E2DAD0' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '0.5px solid #E2DAD0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="2"  x2="12" y2="6"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="2"  y1="12" x2="6"  y2="12" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="18" y1="12" x2="22" y2="12" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="4.93"  y1="4.93"  x2="7.76"  y2="7.76"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="19.07" y1="4.93"  x2="16.24" y2="7.76"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="7.76"  y1="16.24" x2="4.93"  y2="19.07" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 400, color: '#1C1917', fontFamily: 'Georgia, "Times New Roman", serif' }}>Claude Assistant</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  <div style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, lineHeight: 1.55, maxWidth: '85%', background: '#E8E3DC', color: '#1C1917', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: F }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '100%' }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: '#1C1917', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      {msg.text}
                    </div>
                    {(msg.isRecommendations || i > 0) && (
                      <button
                        onClick={() => {
                          if (msg.isRecommendations) {
                            handleApply(msg.text);
                          } else {
                            if (editor) editor.commands.setContent(msg.text);
                            setEditedBody(msg.text);
                            showToast('Applied to draft');
                          }
                        }}
                        disabled={msg.isRecommendations && generating}
                        onMouseEnter={e => { if (!(msg.isRecommendations && generating)) { e.currentTarget.style.background = msg.isRecommendations ? '#0f2640' : '#E8E3DC'; e.currentTarget.style.color = msg.isRecommendations ? '#fff' : '#1C1917'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = msg.isRecommendations ? '#1a3a5c' : 'transparent'; e.currentTarget.style.color = msg.isRecommendations ? '#fff' : '#78716C'; }}
                        style={{ alignSelf: 'flex-start', fontSize: 10.5, padding: '4px 12px', borderRadius: 20, background: msg.isRecommendations ? '#1a3a5c' : 'transparent', color: msg.isRecommendations ? '#fff' : '#78716C', border: msg.isRecommendations ? 'none' : '0.5px solid #C8BFB5', cursor: (msg.isRecommendations && generating) ? 'default' : 'pointer', fontFamily: F, marginTop: 2, transition: 'background 0.15s', opacity: (msg.isRecommendations && generating) ? 0.5 : 1 }}>
                        {msg.isRecommendations ? (generating ? 'Writing…' : '✦ Write full draft') : 'Apply to draft'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
                <svg className="claude-spinner" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="2"  x2="12" y2="6"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="12" y1="18" x2="12" y2="22" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="2"  y1="12" x2="6"  y2="12" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="18" y1="12" x2="22" y2="12" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="4.93"  y1="4.93"  x2="7.76"  y2="7.76"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="19.07" y1="4.93"  x2="16.24" y2="7.76"  stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="7.76"  y1="16.24" x2="4.93"  y2="19.07" stroke="#D4724A" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: '12px 14px', borderTop: '0.5px solid #E2DAD0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, background: '#FFFFFF', borderRadius: 24, border: '0.5px solid #D6CFC6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Ask Claude…"
                rows={1}
                style={{ flex: 1, fontSize: 12, border: 'none', outline: 'none', padding: '10px 14px', resize: 'none', background: 'transparent', fontFamily: F, color: '#1C1917', lineHeight: 1.5, maxHeight: 100 }}
              />
              <button onClick={() => handleSendChat()} disabled={chatLoading}
                onMouseEnter={e => { if (!chatLoading) e.currentTarget.style.background = '#3D3834'; }}
                onMouseLeave={e => { if (!chatLoading) e.currentTarget.style.background = '#1C1917'; }}
                style={{ background: chatLoading ? '#D6CFC6' : '#1C1917', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: '50%', margin: '6px 8px 6px 0', cursor: chatLoading ? 'default' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty / loading state ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: F }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
          {loading ? 'Loading…' : 'No blog drafts yet'}
        </div>
        {!loading && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Go to the Competitor monitor and click "+ Blog post" on any article
          </div>
        )}
      </div>
    </div>
  );
}
