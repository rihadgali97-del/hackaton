const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { authenticate, allowRoles } = require('../middleware/auth');
const { z } = require('../utils/validation');

const router = express.Router();
router.use(authenticate, allowRoles('admin', 'super_admin', 'staff'));

router.get('/', asyncHandler(async (req, res) => {
  const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(50).default(30) }).parse(req.query);
  const [rows] = await pool.execute(
    'SELECT id, report_id, type, title, body, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    [req.user.id, limit],
  );
  const [counts] = await pool.execute('SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND read_at IS NULL', [req.user.id]);
  res.json({ data: rows, unread_count: Number(counts[0].unread_count) });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  const [result] = await pool.execute('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL', [req.user.id]);
  res.json({ data: { marked_read: result.affectedRows } });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
  const [result] = await pool.execute('UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!result.affectedRows) {
    const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found.' } });
  }
  res.json({ data: { id, read: true } });
}));

module.exports = router;
