const express = require('express');
const router  = express.Router();
const { getPromptSettings, savePromptSettings } = require('../controllers/carouselPromptsController');

router.get('/prompt-settings',  getPromptSettings);
router.post('/prompt-settings', savePromptSettings);

module.exports = router;
