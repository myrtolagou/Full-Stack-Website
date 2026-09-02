const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { env } = require('../config/env');

const SALT_ROUNDS = 12;

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

module.exports = { signToken, verifyToken, hashPassword, comparePassword };