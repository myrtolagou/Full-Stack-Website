const db     = require('../config/db');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');

// ── Encryption helpers (AES-256-CBC) ────────────────────────────────────────

function getEncKey() {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET not set in environment');
  return crypto.scryptSync(secret, 'bcncor-salt', 32);
}

function encrypt(text) {
  const iv  = crypto.randomBytes(16);
  const key = getEncKey();
  const c   = crypto.createCipheriv('aes-256-cbc', key, iv);
  return `${iv.toString('hex')}:${c.update(text, 'utf8', 'hex') + c.final('hex')}`;
}

function decrypt(data) {
  const [ivHex, enc] = data.split(':');
  const key = getEncKey();
  const d   = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
  return d.update(enc, 'hex', 'utf8') + d.final('utf8');
}

// ── Exported key resolver (used by all controllers) ─────────────────────────

async function getAnthropicKey() {
  try {
    const { rows } = await db.query("SELECT value FROM app_config WHERE key='anthropic_key'");
    if (rows.length && rows[0].value && process.env.ENCRYPTION_SECRET) {
      return decrypt(rows[0].value);
    }
  } catch { /* fall through */ }
  return process.env.ANTHROPIC_API_KEY;
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS scoring_dimensions (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      min_points INTEGER NOT NULL DEFAULT 0,
      max_points INTEGER NOT NULL DEFAULT 3,
      rubric TEXT DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT true,
      channels TEXT[] DEFAULT ARRAY['blog','linkedin','instagram'],
      sort_order INTEGER DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      tier VARCHAR(50) NOT NULL DEFAULT 'Relevant',
      keywords TEXT[] DEFAULT '{}',
      sort_order INTEGER DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS thresholds (
      id SERIAL PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      min_points INTEGER NOT NULL,
      max_points INTEGER NOT NULL,
      action TEXT DEFAULT '',
      badge_bg VARCHAR(20) DEFAULT '#F1EFE8',
      badge_color VARCHAR(20) DEFAULT '#5F5E5A',
      sort_order INTEGER DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_prompts (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) UNIQUE NOT NULL,
      system_prompt TEXT DEFAULT '',
      generation_prompt TEXT DEFAULT '',
      max_tokens INTEGER DEFAULT 2000,
      language VARCHAR(50) DEFAULT 'spanish',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Seed scoring_dimensions
  const { rows: dimCount } = await db.query('SELECT COUNT(*) FROM scoring_dimensions');
  if (parseInt(dimCount[0].count, 10) === 0) {
    const dims = [
      ['strategic', 'Strategic topic relevance', "How closely the article aligns with BcnCor's priority topics", 0, 3, '', true, ['blog','linkedin','instagram'], 1],
      ['intent',    'Funnel stage & buyer intent', 'Awareness, consideration, or decision-stage content', 0, 2, '', true, ['blog','linkedin','instagram'], 2],
      ['seo',       'SEO / traffic potential', 'Search demand and ranking signals for this topic', 0, 2, '', true, ['blog'], 3],
      ['engagement','Engagement signals', 'Visible social proof: shares, comments, reactions', 0, 2, '', true, ['linkedin','instagram'], 4],
      ['gap',       'Content gap / differentiation', 'Whether BcnCor already covers this topic well', -1, 1, '', true, ['blog','linkedin','instagram'], 5],
    ];
    for (const [key, name, description, min_points, max_points, rubric, enabled, channels, sort_order] of dims) {
      await db.query(
        `INSERT INTO scoring_dimensions (key, name, description, min_points, max_points, rubric, enabled, channels, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (key) DO NOTHING`,
        [key, name, description, min_points, max_points, rubric, enabled, channels, sort_order]
      );
    }
  }

  // Seed topics
  const { rows: topicCount } = await db.query('SELECT COUNT(*) FROM topics');
  if (parseInt(topicCount[0].count, 10) === 0) {
    const topicsData = [
      ['Seed funding in Spain', 'Top priority',    ['seed round', 'ronda semilla', 'pre-seed', 'financiación startup'], 1],
      ['CFO services',          'Top priority',    ['CFO externo', 'fractional CFO', 'director financiero'],             2],
      ['Startup growth',        'Relevant',        ['crecimiento startup', 'scale-up', 'Series A'],                      3],
      ['Accelerators & programs','Loosely related', ['aceleradora', 'incubadora'],                                       4],
    ];
    for (const [name, tier, keywords, sort_order] of topicsData) {
      await db.query(
        'INSERT INTO topics (name, tier, keywords, sort_order) VALUES ($1,$2,$3,$4)',
        [name, tier, keywords, sort_order]
      );
    }
  }

  // Seed thresholds
  const { rows: threshCount } = await db.query('SELECT COUNT(*) FROM thresholds');
  if (parseInt(threshCount[0].count, 10) === 0) {
    const thresholdsData = [
      ['High priority',   6, 8, 'Act within 1 week',       '#E6F1FB', '#0C447C', 1],
      ['Medium priority', 4, 5, 'Add to editorial backlog', '#FAEEDA', '#633806', 2],
      ['Low priority',    0, 3, 'Monitor only',             '#F1EFE8', '#5F5E5A', 3],
    ];
    for (const [label, min_points, max_points, action, badge_bg, badge_color, sort_order] of thresholdsData) {
      await db.query(
        `INSERT INTO thresholds (label, min_points, max_points, action, badge_bg, badge_color, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [label, min_points, max_points, action, badge_bg, badge_color, sort_order]
      );
    }
  }
}

ensureTables().catch(err => console.error('[settings] table init failed:', err));

// ── Dimensions ──────────────────────────────────────────────────────────────

function mapDim(row) {
  return {
    id:          row.id,
    key:         row.key,
    name:        row.name,
    description: row.description,
    min_points:  row.min_points,
    max_points:  row.max_points,
    rubric:      row.rubric,
    enabled:     row.enabled,
    channels:    row.channels || [],
    sort_order:  row.sort_order,
  };
}

async function getDimensions(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM scoring_dimensions ORDER BY sort_order');
    res.json(rows.map(mapDim));
  } catch (err) { next(err); }
}

async function updateDimension(req, res, next) {
  try {
    const { key } = req.params;
    const { name, description, min_points, max_points, rubric, enabled, channels } = req.body;

    const fields = [];
    const values = [];
    let i = 1;
    if (name        !== undefined) { fields.push(`name=$${i++}`);        values.push(name); }
    if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description); }
    if (min_points  !== undefined) { fields.push(`min_points=$${i++}`);  values.push(min_points); }
    if (max_points  !== undefined) { fields.push(`max_points=$${i++}`);  values.push(max_points); }
    if (rubric      !== undefined) { fields.push(`rubric=$${i++}`);      values.push(rubric); }
    if (enabled     !== undefined) { fields.push(`enabled=$${i++}`);     values.push(enabled); }
    if (channels    !== undefined) { fields.push(`channels=$${i++}`);    values.push(channels); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(key);

    const { rows } = await db.query(
      `UPDATE scoring_dimensions SET ${fields.join(',')} WHERE key=$${i} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Dimension not found' });
    res.json(mapDim(rows[0]));
  } catch (err) { next(err); }
}

// ── Topics ──────────────────────────────────────────────────────────────────

function mapTopic(row) {
  return {
    id:       row.id,
    name:     row.name,
    tier:     row.tier,
    keywords: row.keywords || [],
  };
}

async function getTopics(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM topics ORDER BY sort_order, id');
    res.json(rows.map(mapTopic));
  } catch (err) { next(err); }
}

async function createTopic(req, res, next) {
  try {
    const { name, tier, keywords } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const { rows: countRows } = await db.query('SELECT COUNT(*) FROM topics');
    const sort_order = parseInt(countRows[0].count, 10) + 1;
    const { rows } = await db.query(
      'INSERT INTO topics (name, tier, keywords, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [name.trim(), tier || 'Relevant', keywords || [], sort_order]
    );
    res.status(201).json(mapTopic(rows[0]));
  } catch (err) { next(err); }
}

async function updateTopic(req, res, next) {
  try {
    const { id } = req.params;
    const { name, tier, keywords } = req.body;
    const { rows } = await db.query(
      'UPDATE topics SET name=$1, tier=$2, keywords=$3 WHERE id=$4 RETURNING *',
      [name?.trim() || '', tier || 'Relevant', keywords || [], id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Topic not found' });
    res.json(mapTopic(rows[0]));
  } catch (err) { next(err); }
}

async function deleteTopic(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM topics WHERE id=$1 RETURNING id', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Topic not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) { next(err); }
}

// ── Thresholds ──────────────────────────────────────────────────────────────

function mapThreshold(row) {
  return {
    id:          row.id,
    label:       row.label,
    min_points:  row.min_points,
    max_points:  row.max_points,
    action:      row.action,
    badge_bg:    row.badge_bg,
    badge_color: row.badge_color,
    sort_order:  row.sort_order,
  };
}

async function getThresholds(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM thresholds ORDER BY sort_order, id');
    res.json(rows.map(mapThreshold));
  } catch (err) { next(err); }
}

async function updateThreshold(req, res, next) {
  try {
    const { id } = req.params;
    const { label, min_points, max_points, action, badge_bg, badge_color } = req.body;
    const { rows } = await db.query(
      `UPDATE thresholds SET label=$1, min_points=$2, max_points=$3, action=$4, badge_bg=$5, badge_color=$6
       WHERE id=$7 RETURNING *`,
      [label, min_points, max_points, action, badge_bg, badge_color, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Threshold not found' });
    res.json(mapThreshold(rows[0]));
  } catch (err) { next(err); }
}

// ── AI Prompts ──────────────────────────────────────────────────────────────

async function getPrompts(_req, res, next) {
  try {
    const { rows } = await db.query('SELECT * FROM ai_prompts ORDER BY type');
    res.json(rows);
  } catch (err) { next(err); }
}

async function upsertPrompt(req, res, next) {
  try {
    const { type } = req.params;
    const { system_prompt, generation_prompt, max_tokens, language } = req.body;

    console.log('[upsertPrompt] type:', type);
    console.log('[upsertPrompt] body keys:', Object.keys(req.body));
    console.log('[upsertPrompt] system_prompt length:', (system_prompt || '').length);
    console.log('[upsertPrompt] generation_prompt length:', (generation_prompt || '').length);
    console.log('[upsertPrompt] max_tokens:', max_tokens, '| language:', language);

    const params = [type, system_prompt || '', generation_prompt || '', max_tokens || 2000, language || 'spanish'];
    console.log('[upsertPrompt] params[0] (type):', params[0]);

    const { rows } = await db.query(
      `INSERT INTO ai_prompts (type, system_prompt, generation_prompt, max_tokens, language, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (type) DO UPDATE SET
         system_prompt=EXCLUDED.system_prompt,
         generation_prompt=EXCLUDED.generation_prompt,
         max_tokens=EXCLUDED.max_tokens,
         language=EXCLUDED.language,
         updated_at=NOW()
       RETURNING *`,
      params
    );

    console.log('[upsertPrompt] rows returned:', rows.length);
    if (rows[0]) console.log('[upsertPrompt] saved row type:', rows[0].type, '| system_prompt length:', rows[0].system_prompt?.length);

    res.json(rows[0]);
  } catch (err) {
    console.error('[upsertPrompt] ERROR:', err.message);
    console.error('[upsertPrompt] ERROR detail:', err);
    next(err);
  }
}

// ── App Config (API key + Blog URL) ─────────────────────────────────────────

async function getConfig(_req, res, next) {
  try {
    const { rows } = await db.query(
      "SELECT key, value FROM app_config WHERE key IN ('anthropic_key','blog_url','canva_template_url','claude_prompt')"
    );
    const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({
      anthropicKeySet:  !!(cfg.anthropic_key),
      blogUrl:          cfg.blog_url           || '',
      canvaTemplateUrl: cfg.canva_template_url || '',
      claudePrompt:     cfg.claude_prompt      || '',
    });
  } catch (err) { next(err); }
}

async function saveConfig(req, res, next) {
  try {
    const { anthropicKey, blogUrl, canvaTemplateUrl, claudePrompt } = req.body;
    if (anthropicKey?.trim()) {
      const enc = encrypt(anthropicKey.trim());
      await db.query(
        "INSERT INTO app_config (key,value) VALUES ('anthropic_key',$1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()",
        [enc]
      );
    }
    if (blogUrl !== undefined) {
      await db.query(
        "INSERT INTO app_config (key,value) VALUES ('blog_url',$1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()",
        [blogUrl || '']
      );
    }
    if (canvaTemplateUrl !== undefined) {
      await db.query(
        "INSERT INTO app_config (key,value) VALUES ('canva_template_url',$1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()",
        [canvaTemplateUrl || '']
      );
    }
    if (claudePrompt !== undefined) {
      await db.query(
        "INSERT INTO app_config (key,value) VALUES ('claude_prompt',$1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()",
        [claudePrompt || '']
      );
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ── Test scorer ──────────────────────────────────────────────────────────────

function buildTestPrompt(text, channel, topicsText, existingTitles) {
  const isLinkedIn  = channel === 'linkedin';
  const isInstagram = channel === 'instagram';
  const isSocial    = isLinkedIn || isInstagram;

  const engagementDim = isSocial
    ? '- engagement (0–2): Social proof. 2 = High (>50 interactions) | 1 = Moderate (10–50) | 0 = Low (<10)\n'
    : '- seo (0–2): SEO potential in Spain. 2 = High-demand keyword | 1 = Moderate/niche | 0 = No SEO value\n';
  const engKey   = isSocial ? 'engagement' : 'seo';
  const jsonBase = `"strategic":0,"strategic_reason":"...","intent":0,"intent_reason":"...","${engKey}":0,"${engKey}_reason":"...","gap":0,"gap_reason":"..."`;

  return `You are a content scoring assistant for BcnCor, a Spanish startup advisory firm (CFO services, startup funding, strategic consulting).

Score this ${channel} content. Return ONLY valid JSON — no markdown, no extra text.

SCORING DIMENSIONS:
- strategic (0–3): Alignment with topics (${topicsText}). 3 = Direct match | 2 = Adjacent | 1 = Loosely related | 0 = Not relevant
- intent (0–2): Buyer intent for startup founders. 2 = Decision/action stage | 1 = Awareness | 0 = No founder focus
${engagementDim}- gap (−1, 0, or 1): Does BcnCor already cover this topic?
  1 = Not covered | 0 = Partially covered | −1 = Already covered well

BCNCOR'S EXISTING BLOG TITLES (for gap analysis):
- ${existingTitles}

CONTENT TO SCORE:
${text}

Return exactly: {${jsonBase}}`;
}

async function testScore(req, res, next) {
  try {
    const { text, channel = 'blog' } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

    const apiKey = await getAnthropicKey();
    if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured' });

    const [{ rows: blogRows }, { rows: topicsRows }, { rows: threshRows }] = await Promise.all([
      db.query('SELECT title FROM blog_articles ORDER BY scraped_at DESC LIMIT 100'),
      db.query('SELECT name, tier, keywords FROM topics ORDER BY sort_order'),
      db.query('SELECT * FROM thresholds ORDER BY min_points DESC'),
    ]);

    const existingTitles = blogRows.map(r => r.title).filter(Boolean).join('\n- ') || '(none yet)';
    const topicsText     = topicsRows.length
      ? topicsRows.map(t => `${t.name} (${t.tier}): ${(t.keywords||[]).join(', ')}`).join(' | ')
      : 'seed funding Spain, CFO services, startup growth, accelerators';

    const prompt = buildTestPrompt(text.trim(), channel, topicsText, existingTitles);
    const client = new Anthropic({ apiKey });
    const msg    = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw  = msg.content[0].text.trim().replace(/^```[a-z]*\n?/i,'').replace(/```$/,'').trim();
    const dims = JSON.parse(raw);

    const isSocial = channel === 'linkedin' || channel === 'instagram';
    const engKey   = isSocial ? 'engagement' : 'seo';
    const dimRows  = [
      { key: 'strategic', label: 'Strategic relevance', score: dims.strategic || 0, max: 3, reason: dims.strategic_reason || '' },
      { key: 'intent',    label: 'Buyer intent',        score: dims.intent    || 0, max: 2, reason: dims.intent_reason    || '' },
      { key: engKey,      label: isSocial ? 'Engagement signals' : 'SEO potential', score: dims[engKey] || 0, max: 2, reason: dims[`${engKey}_reason`] || '' },
      { key: 'gap',       label: 'Content gap',         score: dims.gap       || 0, max: 1, reason: dims.gap_reason       || '' },
    ];
    const total    = dimRows.reduce((s, d) => s + d.score, 0);
    const totalMax = dimRows.reduce((s, d) => s + d.max,   0);
    const thresh   = threshRows.find(t => total >= t.min_points) || threshRows[threshRows.length - 1];

    res.json({
      total, totalMax,
      priority:      thresh?.label      || 'Low priority',
      priorityBg:    thresh?.badge_bg   || '#F1EFE8',
      priorityColor: thresh?.badge_color|| '#5F5E5A',
      dims: dimRows,
    });
  } catch (err) { next(err); }
}

module.exports = {
  getAnthropicKey,
  getDimensions, updateDimension,
  getTopics, createTopic, updateTopic, deleteTopic,
  getThresholds, updateThreshold,
  getPrompts, upsertPrompt,
  getConfig, saveConfig,
  testScore,
};
