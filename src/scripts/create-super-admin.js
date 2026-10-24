require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function main() {
  const { SUPER_ADMIN_NAME: name, SUPER_ADMIN_EMAIL: email, SUPER_ADMIN_PASSWORD: password } = process.env;
  if (!name || !email || !password || password.length < 12) {
    throw new Error('Set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD (at least 12 characters) in your environment.');
  }
  const [existing] = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
  if (existing.length) throw new Error('A super admin already exists. Use the authenticated staff-management API for later account changes.');
  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'super_admin')", [name.trim(), email.trim().toLowerCase(), hash]);
  console.log(`Created initial super admin with user id ${result.insertId}.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
