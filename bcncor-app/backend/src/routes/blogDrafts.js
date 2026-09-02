const { Router } = require('express');
const ctrl = require('../controllers/blogDraftsController');

const router = Router();

router.post('/create',          ctrl.create);
router.get('/',                 ctrl.list);
router.get('/prompt-settings',  ctrl.getPromptSettings);
router.post('/prompt-settings', ctrl.savePromptSettings);
router.get('/:id',              ctrl.get);
router.patch('/:id',            ctrl.update);
router.delete('/:id',           ctrl.remove);
router.post('/:id/generate',    ctrl.generateDraft);
router.post('/:id/chat',        ctrl.chat);
router.post('/:id/apply',       ctrl.apply);
router.post('/:id/regenerate',  ctrl.regenerate);
router.get('/:id/export-docx',  ctrl.exportDocx);

module.exports = router;
