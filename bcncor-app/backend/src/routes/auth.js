/**
 * routes/auth.js
 *
 * Mounts authentication endpoints on the Express router.
 * All routes are prefixed with /api/auth (applied in app.js).
 *
 * Planned endpoints:
 *  POST   /api/auth/login    → authController.login
 *  POST   /api/auth/logout   → authController.logout
 *  GET    /api/auth/me       → authMiddleware + authController.getCurrentUser
 */

const { Router } = require('express');
const authController = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');

const router = Router();

// TODO: router.post('/login',  authController.login);
// TODO: router.post('/logout', protect, authController.logout);
// TODO: router.get('/me',      protect, authController.getCurrentUser);

module.exports = router;
