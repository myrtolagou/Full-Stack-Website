/**
 * routes/blog.js
 *
 * Blog workflow endpoints — all prefixed with /api/workflows/blog (mounted in app.js)
 *
 *  GET  /api/workflows/blog/preview    → scrape article list, mark new vs seen
 *  POST /api/workflows/blog/run        → process selected articles through Claude
 *  GET  /api/workflows/blog/status     → last run time and stats
 *  GET  /api/workflows/blog/inbox      → generated items for this workflow
 *  POST /api/workflows/blog/generate   → generate/regenerate slides for a single item
 *  GET  /api/workflows/blog/carousels  → all saved carousels
 */

const { Router }     = require('express');
const blogController = require('../controllers/blogController');

const router = Router();

router.get('/preview',    blogController.preview);
router.post('/refresh',   blogController.refresh);
router.post('/run',       blogController.run);
router.get('/status',     blogController.status);
router.get('/inbox',      blogController.inbox);
router.post('/generate',  blogController.generate);
router.get('/carousels',  blogController.listCarousels);

module.exports = router;
