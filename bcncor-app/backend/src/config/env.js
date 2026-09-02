/**
 * config/env.js
 *
 * Loads environment variables from the .env file and validates that all
 * required variables are present before the app starts.
 * Responsibilities:
 *  - Call dotenv.config() once, at the top of the dependency tree
 *  - Validate required keys; throw a clear error if any are missing
 *  - Export a typed `env` object so the rest of the app never reads
 *    process.env directly
 *
 * TODO:
 *  - Add all required keys to REQUIRED_VARS
 *  - Throw with a descriptive message listing any missing keys
 *  - Export env object with PORT (number), DATABASE_URL, JWT_SECRET,
 *    JWT_EXPIRES_IN, NODE_ENV
 */

require('dotenv').config();

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

// TODO: validate — check each key exists in process.env, collect missing ones,
//       and throw if any are absent.

const env = {
  PORT:                 parseInt(process.env.PORT, 10) || 3001,
  DATABASE_URL:         process.env.DATABASE_URL,
  JWT_SECRET:           process.env.JWT_SECRET,
  JWT_EXPIRES_IN:       process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV:             process.env.NODE_ENV || 'development',
  ANTHROPIC_API_KEY:    process.env.ANTHROPIC_API_KEY,
  CANVA_CLIENT_ID:      process.env.CANVA_CLIENT_ID,
  CANVA_CLIENT_SECRET:  process.env.CANVA_CLIENT_SECRET,
  CANVA_REDIRECT_URI:   process.env.CANVA_REDIRECT_URI,
};

module.exports = { env };
