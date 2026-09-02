/**
 * services/schedulerService.js
 *
 * Reads pipeline schedules from scheduler_settings and registers node-cron jobs.
 * Call start() once on app startup. Call reloadSchedules() whenever settings change.
 */

const cron                  = require('node-cron');
const db                    = require('../config/db');
const blogController        = require('../controllers/blogController');
const competitorController  = require('../controllers/competitorController');

// day name → cron day-of-week (0 = Sunday)
const DAY_NUM = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };

let activeJobs = [];

// ── Table init ────────────────────────────────────────────────────────────────

async function initTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS scheduler_settings (
      id            SERIAL PRIMARY KEY,
      pipeline      VARCHAR(50)  UNIQUE NOT NULL,
      enabled       BOOLEAN      NOT NULL DEFAULT false,
      frequency     VARCHAR(20)  NOT NULL DEFAULT 'Weekly',
      day           VARCHAR(20)  NOT NULL DEFAULT 'Monday',
      time          VARCHAR(10)  NOT NULL DEFAULT '09:00',
      lookback_days INTEGER      NOT NULL DEFAULT 7
    )
  `);
  await db.query(`ALTER TABLE scheduler_settings ADD COLUMN IF NOT EXISTS lookback_days INTEGER NOT NULL DEFAULT 7`);
  await db.query(`
    INSERT INTO scheduler_settings (pipeline, enabled, frequency, day, time, lookback_days)
    VALUES ('blog',       false, 'Weekly', 'Monday',    '09:00', 7),
           ('competitor', false, 'Weekly', 'Wednesday', '09:00', 7)
    ON CONFLICT (pipeline) DO NOTHING
  `);
}

// ── Cron expression builder ───────────────────────────────────────────────────

function buildExpr(frequency, day, time) {
  const [h, m]  = (time || '09:00').split(':').map(Number);
  const dayNum  = DAY_NUM[day] ?? 1;

  switch (frequency) {
    case 'Daily':     return `${m} ${h} * * *`;
    case 'Weekly':    return `${m} ${h} * * ${dayNum}`;
    case 'Bi-weekly': return `${m} ${h} * * ${dayNum}`;   // fires weekly; handler skips odd weeks
    case 'Monthly':   return `${m} ${h} 1 * *`;
    default:          return `${m} ${h} * * ${dayNum}`;
  }
}

// ── Thin req/res wrapper to call Express handlers directly ────────────────────

function callHandler(fn, reqOpts = {}) {
  return new Promise((resolve, reject) => {
    const req = { body: {}, params: {}, query: {}, ...reqOpts };
    const res = {
      json:   (data)   => resolve(data),
      status: (code)   => ({ json: (data) => resolve({ _error: true, code, data }) }),
    };
    Promise.resolve()
      .then(() => fn(req, res, (err) => reject(err)))
      .catch(reject);
  });
}

// ── Pipeline runners ──────────────────────────────────────────────────────────

async function runBlogPipeline() {
  console.log('[scheduler] Starting blog pipeline');
  try {
    const r1 = await callHandler(blogController.refresh);
    console.log('[scheduler] blog/refresh done', r1?._error ? `(error ${r1.code})` : '');

    const r2 = await callHandler(blogController.generate, { body: {} });
    console.log('[scheduler] blog/generate done', r2?._error ? `(error ${r2.code})` : '');
  } catch (err) {
    console.error('[scheduler] Blog pipeline error:', err.message);
  }
}

async function runCompetitorPipeline() {
  console.log('[scheduler] Starting competitor pipeline');
  try {
    const r1 = await callHandler(competitorController.run, { body: {} });
    console.log('[scheduler] competitor/run done', r1?._error ? `(error ${r1.code})` : '');

    const r2 = await callHandler(competitorController.scoreAll, { body: { limit: 50 } });
    console.log('[scheduler] competitor/score done', r2?._error ? `(error ${r2.code})` : '');

    const { rows: compSettings } = await db.query("SELECT lookback_days FROM scheduler_settings WHERE pipeline = 'competitor'");
    const lookbackDays = compSettings[0]?.lookback_days ?? 7;
    const r3 = await callHandler(competitorController.autoDraft, { body: { lookback_days: lookbackDays } });
    console.log('[scheduler] competitor/auto-draft done', r3?._error ? `(error ${r3.code})` : '');
  } catch (err) {
    console.error('[scheduler] Competitor pipeline error:', err.message);
  }
}

// ── Schedule registration ─────────────────────────────────────────────────────

async function reloadSchedules() {
  activeJobs.forEach(j => j.stop());
  activeJobs = [];

  const { rows } = await db.query('SELECT * FROM scheduler_settings');

  for (const row of rows) {
    if (!row.enabled) {
      console.log(`[scheduler] ${row.pipeline} pipeline disabled — skipping`);
      continue;
    }

    const expr = buildExpr(row.frequency, row.day, row.time);
    if (!cron.validate(expr)) {
      console.error(`[scheduler] Invalid cron expr for ${row.pipeline}: "${expr}"`);
      continue;
    }

    const handler = row.pipeline === 'blog' ? runBlogPipeline : runCompetitorPipeline;
    const isBiweekly = row.frequency === 'Bi-weekly';
    let weekToggle = false;

    const job = cron.schedule(expr, () => {
      if (isBiweekly) {
        weekToggle = !weekToggle;
        if (!weekToggle) return;   // skip every other firing
      }
      handler();
    }, { timezone: 'Europe/Madrid' });

    activeJobs.push(job);
    console.log(`[scheduler] Registered ${row.pipeline} (${row.frequency}) → "${expr}"`);
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function start() {
  await initTable();
  await reloadSchedules();
  console.log('[scheduler] Scheduler service started');
}

module.exports = { start, reloadSchedules };
