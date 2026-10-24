const mysql = require('mysql2/promise');
require('dotenv').config();

// Use DATABASE_URL if available (for Render/TiDB Cloud), otherwise fall back to local variables
const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true, // Required for TiDB Cloud secure connection
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z',
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'fixnearme',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z',
    };

const pool = mysql.createPool(poolConfig);

module.exports = pool;