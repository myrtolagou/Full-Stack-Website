const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/settingsController');

router.get('/dimensions',      ctrl.getDimensions);
router.put('/dimensions/:key', ctrl.updateDimension);

router.get('/topics',        ctrl.getTopics);
router.post('/topics',       ctrl.createTopic);
router.put('/topics/:id',    ctrl.updateTopic);
router.delete('/topics/:id', ctrl.deleteTopic);

router.get('/thresholds',      ctrl.getThresholds);
router.put('/thresholds/:id',  ctrl.updateThreshold);

router.get('/prompts',        ctrl.getPrompts);
router.put('/prompts/:type',  ctrl.upsertPrompt);

router.get('/config',   ctrl.getConfig);
router.put('/config',   ctrl.saveConfig);
router.post('/test-score', ctrl.testScore);

module.exports = router;
