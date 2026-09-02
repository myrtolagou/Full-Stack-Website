const { Router }           = require('express');
const ownContentController = require('../controllers/ownContentController');

const router = Router();
router.post('/run',             ownContentController.run);
router.get('/linkedin-posts',   ownContentController.getLinkedInPosts);
router.get('/instagram-posts',  ownContentController.getInstagramPosts);
module.exports = router;
