/**
 * controllers/campaignsController.js
 *
 * Handles all marketing campaign operations.
 * Delegates DB queries to the Campaign model.
 *
 * Functions:
 *  getAll   — return all campaigns (optionally filtered by status/owner)
 *  getById  — return a single campaign by ID
 *  create   — create a new campaign record
 *  update   — update campaign fields (name, status, schedule, etc.)
 *  remove   — delete a campaign by ID
 */

const Campaign = require('../models/Campaign');

async function getAll(req, res, next) {
  // TODO:
  // const campaigns = await Campaign.findAll();
  // res.json({ campaigns });
}

async function getById(req, res, next) {
  // TODO:
  // const campaign = await Campaign.findById(req.params.id);
  // if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  // res.json({ campaign });
}

async function create(req, res, next) {
  // TODO:
  // const campaign = await Campaign.create({ ...req.body, created_by: req.user.id });
  // res.status(201).json({ campaign });
}

async function update(req, res, next) {
  // TODO:
  // const campaign = await Campaign.update(req.params.id, req.body);
  // if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  // res.json({ campaign });
}

async function remove(req, res, next) {
  // TODO:
  // await Campaign.remove(req.params.id);
  // res.sendStatus(204);
}

module.exports = { getAll, getById, create, update, remove };
