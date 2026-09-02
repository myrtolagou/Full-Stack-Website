/**
 * controllers/blogDraftsController.js
 *
 * DB-backed blog drafts. Table is created on startup if it doesn't exist.
 * Flow: create() → inserts a pending row (no Claude call).
 *       generateDraft() → scrapes source URL, calls Claude, saves body to DB.
 *       chat() → calls Claude with the current body for editing assistance.
 */

const db                  = require('../config/db');
const Anthropic           = require('@anthropic-ai/sdk');
const axios               = require('axios');
const cheerio             = require('cheerio');
const { getAnthropicKey } = require('./settingsController');

const SCRAPE_OPTS = {
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
};

async function scrapeUrl(url) {
  const { data: html } = await axios.get(url, SCRAPE_OPTS);
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, [class*="menu"], [class*="sidebar"], [class*="widget"], iframe, noscript').remove();
  const contentEl = $('article, main, .post-content, .entry-content, [class*="content"]').first();
  let text = '';
  if (contentEl.length) {
    text = contentEl.text().replace(/\s+/g, ' ').trim();
  } else {
    const parts = [];
    $('body p').each((_, el) => {
      const t = $(el).text().replace(/\s+/g, ' ').trim();
      if (t.length > 40) parts.push(t);
    });
    text = parts.join('\n\n');
  }
  return text.slice(0, 8000);
}

// ── Table init ────────────────────────────────────────────────────────────────

db.query(`
  CREATE TABLE IF NOT EXISTS blog_drafts (
    id SERIAL PRIMARY KEY,
    competitor VARCHAR(100),
    competitor_id VARCHAR(100),
    source_url TEXT,
    source_title TEXT,
    title TEXT,
    body TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    score INTEGER,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() =>
  db.query(`ALTER TABLE blog_drafts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false`)
).catch(err => console.error('[blog_drafts] table init error:', err));

// ── In-memory prompt settings (persisted across requests, reset on restart) ───

let promptSettings = {
  systemPrompt: `You are a senior content writer at BcnCor, a fractional CFO and financial services firm for Spanish startups and SMEs. BcnCor provides fractional CFO services, fundraising support, public financing (ENISA, CDTI, ICO, EIC), legal services, and startup financial advisory. Their clients are Spanish startups with MRR +30K€, founders in seed/Series A/B stages, and growth-stage SMEs.`,

  generationPrompt: `## BCNCOR'S WRITING STYLE — FOLLOW THIS PRECISELY

**Opening hook (2–4 short sentences max):**
Start with a sharp contrast, uncomfortable truth, or provocative statement. Never start with "En este artículo..." or a bland introduction.

**Voice:**
- Direct second person — always "tu startup", "tus inversores", never impersonal
- Authoritative but not arrogant — write as a trusted advisor
- Use first-person authority sparingly: "En BcnCor hemos visto...", "He acompañado rondas donde..."
- Never use filler phrases like "Es importante destacar que..."

**Structure:**
- Use <h2> for main sections, <h3> for subsections
- Short paragraphs — max 3–4 lines each — wrapped in <p> tags
- Use <ul><li> for bullet lists, <ol><li> for numbered steps
- Use <strong> for key terms, numbers, and emphasis
- Include at least one <blockquote><p><strong>⚠️ [Label]:</strong> Text</p></blockquote> callout
- End with a paragraph that naturally references BcnCor and ends with a CTA

**Language rules:**
- Write in Spanish always, unless source is in English
- Keep Spanish financial terms: ENISA, CDTI, ICO, ronda seed, runway, burn rate, cap table
- Include specific numbers — they make articles credible
- Mix short punchy sentences with longer explanatory ones

## CONTENT RULES
- Keep the same core topic as the source article
- DO NOT copy any sentence from the source
- Add Spanish ecosystem context wherever possible
- Target length: 650–900 words

## OUTPUT FORMAT — CRITICAL
Output ONLY a valid HTML fragment. Do NOT include a title — it is stored separately.
Start directly with the opening <p> hook. Use only these tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>.
Do NOT include <html>, <body>, <head>, <h1>, or markdown. No preamble, no explanation.

## SOURCE ARTICLE
Competitor: {competitorName}
Title: {sourceTitle}
Content: {fullText}`,

  reviewPrompt: `Review this competitor article and provide specific, actionable recommendations for how BcnCor should write a response article.

Structure your review as:
**Angle & narrative**: The specific angle BcnCor should take (different from the competitor's approach)
**Key arguments to include**: Specific insights, data, or perspectives missing from the competitor article
**Spanish context**: Real-world examples or references from the Spanish startup ecosystem to include
**Structure**: How to organise the piece — which sections to include, what to emphasise or cut
**Gaps to exploit**: Topics the competitor glossed over or missed that BcnCor can address better

Competitor: {competitorName}
Article title: {sourceTitle}
Content: {fullText}

Write in English. Be specific and reference the actual article content — these recommendations will be used to generate the final article.`,

  maxTokens: 2000,
  language: 'spanish',
};

// ── Row mapper ────────────────────────────────────────────────────────────────

function rowToDraft(row) {
  return {
    id:           row.id,
    competitor:   row.competitor,
    competitorId: row.competitor_id,
    sourceUrl:    row.source_url,
    sourceTitle:  row.source_title,
    title:        row.title || '',
    body:         row.body  || '',
    status:       row.status,
    score:        row.score,
    aiGenerated:  row.ai_generated || false,
    createdAt:    row.created_at,
    date: new Date(row.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

// ── POST /api/blog-drafts/create ──────────────────────────────────────────────
// Inserts a pending row immediately. Does NOT call Claude.

async function create(req, res, next) {
  try {
    const { url, title, competitor, competitor_id, score, ai_generated } = req.body;
    if (!url) return res.status(400).json({ message: 'url is required' });

    const existing = await db.query('SELECT * FROM blog_drafts WHERE source_url = $1 LIMIT 1', [url]);
    if (existing.rows.length) return res.json({ draft: rowToDraft(existing.rows[0]) });

    const result = await db.query(
      `INSERT INTO blog_drafts (competitor, competitor_id, source_url, source_title, title, score, status, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [competitor || null, competitor_id || null, url, title || null, title || null, score || null, ai_generated || false]
    );

    res.json({ draft: rowToDraft(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/blog-drafts ──────────────────────────────────────────────────────

async function list(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM blog_drafts ORDER BY created_at DESC');
    res.json({ drafts: result.rows.map(rowToDraft) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/blog-drafts/:id ──────────────────────────────────────────────────

async function get(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM blog_drafts WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ draft: rowToDraft(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/blog-drafts/:id ────────────────────────────────────────────────

async function update(req, res, next) {
  try {
    const { title, body, status } = req.body;
    const fields = [], values = [];
    let i = 1;
    if (title  !== undefined) { fields.push(`title = $${i++}`);  values.push(title); }
    if (body   !== undefined) { fields.push(`body = $${i++}`);   values.push(body); }
    if (status !== undefined) { fields.push(`status = $${i++}`); values.push(status); }
    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });
    fields.push('updated_at = NOW()');
    values.push(req.params.id);
    const result = await db.query(
      `UPDATE blog_drafts SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ draft: rowToDraft(result.rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/blog-drafts/:id ───────────────────────────────────────────────

async function remove(req, res, next) {
  try {
    const result = await db.query('DELETE FROM blog_drafts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ── Shared helper: get article text for a draft (DB → scrape fallback) ────────

async function getArticleText(draft) {
  const articleResult = await db.query(
    'SELECT title, content_text, excerpt FROM competitor_articles WHERE url = $1 LIMIT 1',
    [draft.source_url]
  );
  const article = articleResult.rows[0];
  let fullText      = article?.content_text || article?.excerpt || '';
  const sourceTitle = article?.title || draft.source_title || '';

  if (!fullText || fullText.length < 100) {
    try { fullText = await scrapeUrl(draft.source_url); } catch { fullText = ''; }
    if (!fullText || fullText.length < 100) {
      throw Object.assign(new Error('Failed to scrape the article. The site may be blocking automated access.'), { statusCode: 422 });
    }
  }
  return { fullText: fullText.slice(0, 8000), sourceTitle };
}

// ── POST /api/blog-drafts/:id/generate ───────────────────────────────────────
// Generates a full blog draft and saves it to the DB.

async function generateDraft(req, res, next) {
  try {
    const draftResult = await db.query('SELECT * FROM blog_drafts WHERE id = $1', [req.params.id]);
    if (!draftResult.rows.length) return res.status(404).json({ message: 'Not found' });
    const draft = draftResult.rows[0];

    let fullText, sourceTitle;
    const manualText = (req.body?.text || '').trim();
    if (manualText.length >= 100) {
      fullText    = manualText.slice(0, 8000);
      sourceTitle = draft.source_title || '';
    } else {
      try {
        ({ fullText, sourceTitle } = await getArticleText(draft));
      } catch (err) {
        return res.status(err.statusCode || 500).json({ message: err.message });
      }
    }

    // Load prompt from ai_prompts table, fall back to hardcoded promptSettings
    const promptRow = await db.query(
      "SELECT system_prompt, generation_prompt, max_tokens FROM ai_prompts WHERE type = 'blog_draft' LIMIT 1"
    );
    const systemPrompt     = promptRow.rows[0]?.system_prompt     || promptSettings.systemPrompt;
    const generationPrompt = promptRow.rows[0]?.generation_prompt || promptSettings.generationPrompt;
    const maxTokens        = promptRow.rows[0]?.max_tokens        || promptSettings.maxTokens;

    const userPrompt = generationPrompt
      .replace('{competitorName}', draft.competitor || 'Unknown')
      .replace('{sourceTitle}',    sourceTitle)
      .replace('{fullText}',       fullText);

    const client   = new Anthropic({ apiKey: await getAnthropicKey() });
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const body  = response.content[0]?.text || '';
    const title = draft.title || `${sourceTitle} — BcnCor`;

    const updated = await db.query(
      `UPDATE blog_drafts SET body = $1, title = $2, source_title = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [body, title, sourceTitle, draft.id]
    );

    res.json({ draft: rowToDraft(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/blog-drafts/:id/apply ──────────────────────────────────────────
// Takes recommendations from the review step, generates full HTML body, saves to DB.

async function apply(req, res, next) {
  try {
    const { recommendations } = req.body;
    if (!recommendations) return res.status(400).json({ message: 'recommendations is required' });

    const draftResult = await db.query('SELECT * FROM blog_drafts WHERE id = $1', [req.params.id]);
    if (!draftResult.rows.length) return res.status(404).json({ message: 'Not found' });
    const draft = draftResult.rows[0];

    let fullText, sourceTitle;
    try {
      ({ fullText, sourceTitle } = await getArticleText(draft));
    } catch (err) {
      return res.status(err.statusCode || 500).json({ message: err.message });
    }

    const basePrompt = promptSettings.generationPrompt
      .replace('{competitorName}', draft.competitor || 'Unknown')
      .replace('{sourceTitle}',    sourceTitle)
      .replace('{fullText}',       fullText);

    const userPrompt = `${basePrompt}

## IMPROVEMENT RECOMMENDATIONS — INCORPORATE THESE
${recommendations}`;

    const client   = new Anthropic({ apiKey: await getAnthropicKey() });
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: promptSettings.maxTokens,
      system:     promptSettings.systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const body  = response.content[0]?.text || '';
    const title = draft.title || `${sourceTitle} — BcnCor`;

    const updated = await db.query(
      `UPDATE blog_drafts SET body = $1, title = $2, source_title = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [body, title, sourceTitle, draft.id]
    );

    res.json({ draft: rowToDraft(updated.rows[0]) });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/blog-drafts/prompt-settings ─────────────────────────────────────

async function getPromptSettings(req, res) {
  res.json(promptSettings);
}

// ── POST /api/blog-drafts/prompt-settings ────────────────────────────────────

async function savePromptSettings(req, res) {
  promptSettings = { ...promptSettings, ...req.body };
  res.json({ success: true, promptSettings });
}

// ── POST /api/blog-drafts/:id/chat ───────────────────────────────────────────

async function chat(req, res, next) {
  try {
    const { message, currentBody } = req.body;
    const draftResult = await db.query('SELECT * FROM blog_drafts WHERE id = $1', [req.params.id]);
    if (!draftResult.rows.length) return res.status(404).json({ message: 'Not found' });
    const draft = draftResult.rows[0];

    const articleResult = await db.query(
      'SELECT title, content_text, excerpt FROM competitor_articles WHERE url = $1 LIMIT 1',
      [draft.source_url]
    );
    const article     = articleResult.rows[0];
    const sourceText  = (article?.content_text || article?.excerpt || '').slice(0, 3000);
    const sourceTitle = article?.title || draft.source_title || '';

    const contextBlock = [
      `Draft title: ${draft.title || '(untitled)'}`,
      currentBody ? `Current draft (HTML):\n${currentBody.slice(0, 6000)}` : 'Current draft: (empty)',
      sourceTitle ? `Source article title: ${sourceTitle}` : '',
      sourceText  ? `Source article content:\n${sourceText}` : '',
    ].filter(Boolean).join('\n\n');

    const client   = new Anthropic({ apiKey: await getAnthropicKey() });
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are an editorial assistant helping a content team at BcnCor, a fractional CFO and financial advisory firm for Spanish startups.

Your job is to help improve, edit, or discuss the blog draft provided. Be direct and conversational — no long preambles or summaries of what you're doing.

Language: match the language the user writes in. If they write in Spanish, respond in Spanish. If they write in English, respond in English.

When producing edited content, output a valid HTML fragment using only these tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. No markdown, no <h1>, no wrapping document tags. If rewriting a section, output only that section. If rewriting the full article, output the full HTML body without the title.

BcnCor's voice: authoritative but not arrogant, second-person direct ("tu startup", "tus inversores"), Spanish financial terms (ENISA, CDTI, ronda seed, runway, burn rate), specific numbers, short punchy paragraphs.`,
      messages: [{
        role:    'user',
        content: `${contextBlock}\n\n---\n\n${message}`,
      }],
    });

    res.json({ reply: response.content[0]?.text || '' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/blog-drafts/:id/regenerate ─────────────────────────────────────

async function regenerate(req, res, next) {
  return generateDraft(req, res, next);
}

// ── GET /api/blog-drafts/:id/export-docx ─────────────────────────────────────

const HEADING_MAP = { h1: 'Heading1', h2: 'Heading2', h3: 'Heading3', h4: 'Heading4' };

function htmlToDocxChildren($, containerEl) {
  const {
    Document, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle,
  } = require('docx');

  const TWIP = n => n * 20; // pt → twips

  function inlineRuns(el) {
    const runs = [];
    $(el).contents().each((_, node) => {
      if (node.type === 'text') {
        const t = node.data;
        if (t) runs.push(new TextRun({ text: t, font: 'Calibri', size: TWIP(11) }));
      } else if (node.type === 'tag') {
        const tag  = node.tagName.toLowerCase();
        const text = $(node).text();
        if (!text) return;
        const bold    = tag === 'strong' || tag === 'b';
        const italics = tag === 'em'     || tag === 'i';
        runs.push(new TextRun({ text, bold, italics, font: 'Calibri', size: TWIP(11) }));
      }
    });
    return runs;
  }

  const children = [];

  $(containerEl).children().each((_, el) => {
    const tag  = el.tagName?.toLowerCase();
    const text = $(el).text().trim();
    if (!text && tag !== 'br') return;

    if (HEADING_MAP[tag]) {
      children.push(new Paragraph({
        text,
        heading: HeadingLevel[HEADING_MAP[tag].toUpperCase().replace('HEADING', 'HEADING_')],
        spacing: { before: TWIP(tag === 'h1' ? 12 : 8), after: TWIP(4) },
      }));
    } else if (tag === 'p') {
      const runs = inlineRuns(el);
      children.push(new Paragraph({
        children: runs.length ? runs : [new TextRun({ text, font: 'Calibri', size: TWIP(11) })],
        spacing: { after: TWIP(8) },
      }));
    } else if (tag === 'ul' || tag === 'ol') {
      $(el).find('li').each((i, li) => {
        const liText = $(li).text().trim();
        if (!liText) return;
        const bullet = tag === 'ol' ? `${i + 1}.` : '•';
        children.push(new Paragraph({
          children: [new TextRun({ text: `${bullet}  ${liText}`, font: 'Calibri', size: TWIP(11) })],
          indent:   { left: TWIP(18) },
          spacing:  { after: TWIP(4) },
        }));
      });
    } else if (tag === 'blockquote') {
      children.push(new Paragraph({
        children: [new TextRun({ text, italics: true, font: 'Calibri', size: TWIP(11), color: '444444' })],
        indent:   { left: TWIP(24) },
        spacing:  { before: TWIP(8), after: TWIP(8) },
        border:   { left: { style: BorderStyle.SINGLE, size: 6, color: '1a3a5c' } },
      }));
    } else if (text) {
      children.push(new Paragraph({
        children: [new TextRun({ text, font: 'Calibri', size: TWIP(11) })],
        spacing:  { after: TWIP(8) },
      }));
    }
  });

  return children;
}

async function exportDocx(req, res, next) {
  try {
    const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = require('docx');

    const { rows } = await db.query('SELECT * FROM blog_drafts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Draft not found' });
    const draft = rows[0];

    const title = draft.title || 'Draft';
    const body  = draft.body  || '';
    const date  = draft.date  || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    const $ = cheerio.load(`<div id="root">${body}</div>`);

    const TWIP = n => n * 20;

    const titlePara = new Paragraph({
      heading:  HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true, font: 'Calibri', size: TWIP(22) })],
      spacing:  { after: TWIP(6) },
    });

    const metaPara = new Paragraph({
      children: [new TextRun({ text: `BcnCor · ${date}`, italics: true, color: '666666', font: 'Calibri', size: TWIP(9) })],
      spacing:  { after: TWIP(16) },
    });

    const bodyChildren = htmlToDocxChildren($, '#root');

    const doc = new Document({
      creator:     'BcnCor',
      title,
      description: `Blog draft: ${title}`,
      sections: [{
        properties: {
          page: { margin: { top: TWIP(72), right: TWIP(72), bottom: TWIP(72), left: TWIP(72) } },
        },
        children: [titlePara, metaPara, ...bodyChildren],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    const safeName = title.slice(0, 60).replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, '').trim().replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.docx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, get, update, remove, getPromptSettings, savePromptSettings, chat, regenerate, generateDraft, apply, exportDocx };
