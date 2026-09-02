const { Router } = require('express');
const calendarController = require('../controllers/calendarController');

const router = Router();
router.get('/', calendarController.getCalendar);
module.exports = router;
