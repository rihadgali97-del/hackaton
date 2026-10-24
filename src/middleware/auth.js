const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

async function authenticate(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Sign in to continue.' } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1', [payload.sub],
    );
    if (!users[0] || !users[0].is_active) return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'This account is unavailable.' } });
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Your session is invalid or expired.' } });
    }
    next(error);
  }
}

function optionalAuthenticate(req, res, next) {
  if (!req.get('authorization')) return next();
  return authenticate(req, res, next);
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to do this.' } });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuthenticate, allowRoles };
