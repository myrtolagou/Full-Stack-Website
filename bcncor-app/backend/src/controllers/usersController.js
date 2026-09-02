/**
 * controllers/usersController.js
 *
 * Handles all user management operations.
 * Delegates DB queries to the User model.
 *
 * Functions:
 *  getAll   — return paginated list of all users
 *  getById  — return a single user by ID
 *  create   — create a new user (hash password via authService)
 *  update   — update user fields (name, email, role)
 *  remove   — soft-delete or hard-delete a user by ID
 */

const User        = require('../models/User');
const authService = require('../services/authService');

async function getAll(req, res, next) {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  // TODO:
  // const user = await User.findById(req.params.id);
  // if (!user) return res.status(404).json({ message: 'User not found' });
  // res.json({ user });
}

async function create(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }
    const password_hash = await authService.hashPassword(password);
    const user = await User.create({ name, email, password_hash, role: role || 'member' });
    res.status(201).json({ user });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  // TODO:
  // const user = await User.update(req.params.id, req.body);
  // if (!user) return res.status(404).json({ message: 'User not found' });
  // res.json({ user });
}

async function remove(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'Admin' || user.email === 'codev@email.com') {
      return res.status(403).json({ message: 'The admin user cannot be deleted.' });
    }
    await User.remove(req.params.id);
    res.sendStatus(204);
  } catch (err) { next(err); }
}

const SEED_USERS = [
  { name: 'Patricio Hunt',                  email: 'patricio.hunt@bcncor.com'  },
  { name: 'Inés Martínez Mate',             email: 'ines.martinez@bcncor.com'  },
  { name: 'Carlota Martínez de Morentin',   email: 'carlota.martinez@bcncor.com' },
];

async function seedUsers() {
  try {
    const password_hash = await authService.hashPassword('1234');
    for (const { name, email } of SEED_USERS) {
      const existing = await User.findByEmail(email);
      if (!existing) {
        await User.create({ name, email, password_hash, role: 'member' });
        console.log(`[seed] Created user: ${email}`);
      }
    }
  } catch (err) {
    console.error('[seed] Failed to seed users:', err.message);
  }
}

module.exports = { getAll, getById, create, update, remove, seedUsers };
