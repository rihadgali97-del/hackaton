const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('../utils/validation');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const credentials = z.object({ email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(10).max(128) });
const signup = credentials.extend({ name: z.string().trim().min(2).max(120) });
const issueToken = (user) => jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

router.post('/register', asyncHandler(async (req, res) => {
  const data = signup.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const [result] = await pool.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'resident\')', [data.name, data.email, passwordHash]);
  const user = { id: result.insertId, name: data.name, email: data.email, role: 'resident' };
  res.status(201).json({ data: { user, token: issueToken(user) } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = credentials.parse(req.body);
  const [rows] = await pool.execute('SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1', [data.email]);
  const user = rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(data.password, user.password_hash))) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
  }
  delete user.password_hash;
  res.json({ data: { user, token: issueToken(user) } });
}));

router.get('/me', authenticate, (req, res) => res.json({ data: { user: req.user } }));
module.exports = router;
