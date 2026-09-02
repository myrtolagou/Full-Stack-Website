/**
 * models/Workflow.js
 *
 * Provides raw SQL query functions for the `workflows` table.
 *
 * Planned query functions:
 *  findAll    — SELECT all workflows, optionally filter by campaign_id or status
 *  findById   — SELECT workflow by primary key
 *  create     — INSERT new workflow row, return created record
 *  update     — UPDATE workflow fields by ID, return updated record
 *  remove     — DELETE workflow by ID
 */

const db = require('../config/db');

async function findAll(filters = {}) {
  // TODO: SELECT * FROM workflows ORDER BY created_at DESC
  // TODO: optionally filter by campaign_id or status
}

async function findById(id) {
  // TODO: SELECT * FROM workflows WHERE id = $1
}

async function create(data) {
  // TODO: INSERT INTO workflows (name, description, trigger_type, steps, status, campaign_id, created_by)
  //       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  // NOTE: steps is stored as JSONB
}

async function update(id, fields) {
  // TODO: build dynamic SET clause from fields object, UPDATE and RETURNING
}

async function remove(id) {
  // TODO: DELETE FROM workflows WHERE id = $1
}

module.exports = { findAll, findById, create, update, remove };
