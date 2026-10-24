require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./pool');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    const dir = path.join(__dirname, 'migrations');
    const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.sql')).sort();
    for (const filename of files) {
      const [rows] = await connection.execute('SELECT filename FROM schema_migrations WHERE filename = ?', [filename]);
      if (rows.length) continue;
      const sql = await fs.readFile(path.join(dir, filename), 'utf8');
      console.log(`Applying ${filename}`);
      // MySQL DDL implicitly commits; migration files are intentionally idempotent.
      for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
    }
    console.log('Database migrations are up to date.');
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
