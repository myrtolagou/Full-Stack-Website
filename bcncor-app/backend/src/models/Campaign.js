/**
 * models/Campaign.js
 *
 * Provides raw SQL query functions for the `campaigns` table.
 *
 * Planned query functions:
 *  findAll    — SELECT all campaigns, optionally filter by status or created_by
 *  findById   — SELECT campaign by primary key
 *  create     — INSERT new campaign row, return created record
 *  update     — UPDATE campaign fields by ID, return updated record
 *  remove     — DELETE campaign by ID
 */

const db = require('../config/db');

async function findAll(filters = {}) {
  // TODO: SELECT * FROM campaigns ORDER BY created_at DESC
  // TODO: optionally append WHERE status = $1 or created_by = $1 based on filters
}

async function findById(id) {
  // TODO: SELECT * FROM campaigns WHERE id = $1
}

async function create(data) {
  // TODO: INSERT INTO campaigns (name, description, status, scheduled_at, created_by)
  //       VALUES ($1,$2,$3,$4,$5) RETURNING *
}

async function update(id, fields) {
  // TODO: build dynamic SET clause from fields object, UPDATE and RETURNING
}

async function remove(id) {
  // TODO: DELETE FROM campaigns WHERE id = $1
}

module.exports = { findAll, findById, create, update, remove };
