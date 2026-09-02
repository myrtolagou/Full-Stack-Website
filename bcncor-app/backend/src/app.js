/**
 * app.js
 *
 * Configures and exports the Express application instance.
 * Responsibilities:
 *  - Apply global middleware: JSON body parsing, CORS, request logging
 *  - Mount all route modules under /api/*
 *  - Mount the global error handler last
 *
 * Route map:
 *  /api/auth       → routes/auth.js
 *  /api/users      → routes/users.js
 *  /api/campaigns  → routes/campaigns.js
 *  /api/workflows  → routes/workflows.js
 */

const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/auth');
const usersRoutes       = require('./routes/users');
const campaignsRoutes   = require('./routes/campaigns');
const workflowsRoutes   = require('./routes/workflows');
const blogRoutes        = require('./routes/blog');
const competitorRoutes  = require('./routes/competitor');
const competitorsRoutes = require('./routes/competitors');
const { router: canvaAuthRoutes } = require('./routes/canvaAuth');
const reportsRoutes               = require('./routes/reports');
const settingsRoutes              = require('./routes/settings');
const errorHandler      = require('./middleware/errorHandler');

let schedulerService;
try {
  schedulerService = require('./services/schedulerService');
} catch (err) {
  console.error('[scheduler] failed to load scheduler service:', err.message);
}

const app = express();

// ── Global Middleware ──────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5200',
  'https://bcncor-content-agents.web.app',
];
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// TODO: add morgan request logger here (e.g. morgan('dev'))

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/competitors',           competitorsRoutes);
app.use('/api/workflows/blog',       blogRoutes);
app.use('/api/workflows/competitor', competitorRoutes);
app.use('/api/workflows',            workflowsRoutes);
app.use('/api/blog-drafts',      require('./routes/blogDrafts'));
app.use('/api/carousel-prompts', require('./routes/carouselPrompts'));
app.use('/auth/canva',        canvaAuthRoutes);
app.use('/api/reports',      reportsRoutes);
app.use('/api/settings',     settingsRoutes);
app.use('/api/carousels',    require('./routes/carousels'));
app.use('/api/calendar',    require('./routes/calendar'));
app.use('/api/own-content', require('./routes/ownContent'));
app.use('/api/scheduler',   require('./routes/scheduler'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global Error Handler (must be last) ───────────────────
app.use(errorHandler);

if (schedulerService) {
  try {
    schedulerService.start().catch(err => console.error('[scheduler] startup error:', err.message));
  } catch (err) {
    console.error('[scheduler] startup error:', err.message);
  }
}

module.exports = app;
