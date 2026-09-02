const { Router }       = require('express');
const reportsController = require('../controllers/reportsController');

const router = Router();
router.post('/generate', reportsController.generate);
module.exports = router;