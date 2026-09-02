/**
 * routes/competitor.js
 *
 * Competitor workflow endpoints — all prefixed with /api/workflows/competitor (mounted in app.js)
 *
 *  GET  /api/workflows/competitor/sources                          → list configured competitors
 *  GET  /api/workflows/competitor/articles                         → all scraped articles
 *  GET  /api/workflows/competitor/status                           → last run stats + log
 *  POST /api/workflows/competitor/run                              → scrape competitors
 *  POST /api/workflows/competitor/articles/:articleId/send-to-inbox → push to shared inbox
 */

const { Router }           = require('express');
const competitorController = require('../controllers/competitorController');

const router = Router();

router.get('/sources',                              competitorController.sources);
router.get('/articles',                             competitorController.articles);
router.get('/status',                               competitorController.status);
router.get('/linkedin-posts',                       competitorController.getLinkedInPosts);
router.get('/instagram-posts',                      competitorController.getInstagramPosts);
router.post('/run',                                 competitorController.run);
router.post('/score',                               competitorController.scoreAll);
router.post('/articles/:articleId/send-to-inbox',   competitorController.sendToInbox);
router.post('/auto-draft',                          competitorController.autoDraft);

module.exports = router;