/**
 * controllers/workflowsController.js
 *
 * Handles all marketing workflow operations.
 * Delegates DB queries to the Workflow model.
 *
 * Functions:
 *  getAll   — return all workflows (optionally filtered by status/campaign)
 *  getById  — return a single workflow by ID
 *  create   — create a new workflow record
 *  update   — update workflow fields (name, trigger, steps, status)
 *  remove   — delete a workflow by ID
 */

const Workflow = require('../models/Workflow');

async function getAll(req, res, next) {
  // TODO:
  // const workflows = await Workflow.findAll();
  // res.json({ workflows });
}

async function getById(req, res, next) {
  // TODO:
  // const workflow = await Workflow.findById(req.params.id);
  // if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
  // res.json({ workflow });
}

async function create(req, res, next) {
  // TODO:
  // const workflow = await Workflow.create({ ...req.body, created_by: req.user.id });
  // res.status(201).json({ workflow });
}

async function update(req, res, next) {
  // TODO:
  // const workflow = await Workflow.update(req.params.id, req.body);
  // if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
  // res.json({ workflow });
}

async function remove(req, res, next) {
  // TODO:
  // await Workflow.remove(req.params.id);
  // res.sendStatus(204);
}

module.exports = { getAll, getById, create, update, remove };
