const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();
router.get('/stats', optionalAuthenticate, asyncHandler(async (req, res) => {
  const staffScope = req.user?.role === 'staff';
  const where = staffScope ? ' WHERE assigned_to = ?' : '';
  const params = staffScope ? [req.user.id] : [];
  const [counts] = await pool.execute(`SELECT COUNT(*) AS total,
    SUM(status = 'reported') AS reported,
    SUM(status = 'under_review') AS under_review,
    SUM(status = 'in_progress') AS in_progress,
    SUM(status = 'pending_verification') AS pending_verification,
    SUM(status = 'resolved') AS resolved,
    SUM(status = 'rejected') AS rejected,
    SUM(priority = 'urgent' AND status NOT IN ('resolved','rejected')) AS urgent_open,
    SUM(assigned_to IS NULL AND status NOT IN ('resolved','rejected')) AS unassigned
    FROM reports${where}`, params);
  const [categories] = await pool.execute(`SELECT category, COUNT(*) AS count FROM reports${where} GROUP BY category ORDER BY count DESC`, params);
  const [recent] = await pool.execute(`SELECT id, title, category, neighborhood, status, priority, created_at FROM reports${where} ORDER BY created_at DESC, id DESC LIMIT 5`, params);
  const c = counts[0];
  res.json({ data: { total: Number(c.total), by_status: { reported: Number(c.reported), under_review: Number(c.under_review), in_progress: Number(c.in_progress), pending_verification: Number(c.pending_verification), resolved: Number(c.resolved), rejected: Number(c.rejected) }, urgent_open: Number(c.urgent_open), unassigned: Number(c.unassigned), by_category: categories.map((row) => ({ category: row.category, count: Number(row.count) })), recent } });
}));

module.exports = router;
