/**
 * routes/campaigns.js
 *
 * Mounts campaign management endpoints on the Express router.
 * All routes are prefixed with /api/campaigns (applied in app.js).
 * All routes are protected — require a valid JWT.
 *
 * Planned endpoints:
 *  GET    /api/campaigns          → campaignsController.getAll
 *  GET    /api/campaigns/:id      → campaignsController.getById
 *  POST   /api/campaigns          → campaignsController.create
 *  PUT    /api/campaigns/:id      → campaignsController.update
 *  DELETE /api/campaigns/:id      → campaignsController.remove
 */

const { Router } = require('express');
const campaignsController = require('../controllers/campaignsController');
const { protect }         = require('../middleware/authMiddleware');

const router = Router();

// TODO: router.use(protect);
// TODO: router.get('/',       campaignsController.getAll);
// TODO: router.get('/:id',    campaignsController.getById);
// TODO: router.post('/',      campaignsController.create);
// TODO: router.put('/:id',    campaignsController.update);
// TODO: router.delete('/:id', campaignsController.remove);

module.exports = router;
