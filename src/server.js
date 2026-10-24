require('dotenv').config();
const express = require('express');
const path = require('node:path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/pool');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const { notFound, errorHandler } = require('./middleware/errors');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}
const duplicateThreshold = Number(process.env.DUPLICATE_THRESHOLD || 60);
if (!Number.isFinite(duplicateThreshold) || duplicateThreshold < 0 || duplicateThreshold > 100) {
  throw new Error('DUPLICATE_THRESHOLD must be a number from 0 to 100.');
}
const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a whole number from 1 to 65535.');
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { dotfiles: 'deny', index: false, fallthrough: false, maxAge: '1h' }));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), limit: Number(process.env.RATE_LIMIT_MAX || 100), standardHeaders: 'draft-7', legacyHeaders: false }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Please wait a little and try again.' } } });
const reportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many report requests. Please wait a little and try again.' } } });

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reports/check-duplicates', reportLimiter);
app.use('/api/reports', (req, res, next) => req.method === 'POST' && req.path === '/' ? reportLimiter(req, res, next) : next(), reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', notFound);
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(port, () => console.log(`FixNearMe API listening on port ${port}`));
  const shutdown = () => server.close(async () => { await pool.end(); process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
