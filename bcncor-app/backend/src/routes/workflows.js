/**
 * routes/workflows.js
 *
 * Mounts workflow management endpoints on the Express router.
 * All routes are prefixed with /api/workflows (applied in app.js).
 * All routes are protected — require a valid JWT.
 *
 * Planned endpoints:
 *  GET    /api/workflows          → workflowsController.getAll
 *  GET    /api/workflows/:id      → workflowsController.getById
 *  POST   /api/workflows          → workflowsController.create
 *  PUT    /api/workflows/:id      → workflowsController.update
 *  DELETE /api/workflows/:id      → workflowsController.remove
 */

const { Router } = require('express');
const workflowsController = require('../controllers/workflowsController');
const { protect }         = require('../middleware/authMiddleware');

const router = Router();

// TODO: router.use(protect);
// TODO: router.get('/',       workflowsController.getAll);
// TODO: router.get('/:id',    workflowsController.getById);
// TODO: router.post('/',      workflowsController.create);
// TODO: router.put('/:id',    workflowsController.update);
// TODO: router.delete('/:id', workflowsController.remove);

module.exports = router;
