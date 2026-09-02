/**
 * routes/users.js
 *
 * Mounts user management endpoints on the Express router.
 * All routes are prefixed with /api/users (applied in app.js).
 * All routes are protected — require a valid JWT.
 *
 * Planned endpoints:
 *  GET    /api/users          → usersController.getAll
 *  GET    /api/users/:id      → usersController.getById
 *  POST   /api/users          → usersController.create
 *  PUT    /api/users/:id      → usersController.update
 *  DELETE /api/users/:id      → usersController.remove
 */

const { Router } = require('express');
const usersController = require('../controllers/usersController');
const { protect }     = require('../middleware/authMiddleware');

const router = Router();

router.get('/',        usersController.getAll);
router.post('/',       usersController.create);
router.delete('/:id',  usersController.remove);

module.exports = router;
