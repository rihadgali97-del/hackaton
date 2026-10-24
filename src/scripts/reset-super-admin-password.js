require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (at least 12 characters) for this command.');
  }

  const [users] = await pool.execute(
    "SELECT id FROM users WHERE email = ? AND role = 'super_admin' LIMIT 1",
    [email],
  );
  if (!users.length) throw new Error('No super-admin account matches that email. No password was changed.');

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, users[0].id]);
  console.log('Super-admin password updated. Sign in with that account email and your new password.');
}

main()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());
