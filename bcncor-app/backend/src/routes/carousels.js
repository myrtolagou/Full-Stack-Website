const { Router } = require('express');
const ctrl = require('../controllers/carouselsController');

const router = Router();

router.get('/',               ctrl.list);
router.patch('/:id/status',   ctrl.patchStatus);
router.patch('/:id/slides',   ctrl.patchSlides);
router.delete('/:id',         ctrl.remove);

module.exports = router;
