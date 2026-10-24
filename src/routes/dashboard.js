const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();
router.get('/stats', asyncHandler(async (req, res) => {
  const [counts] = await pool.query(`SELECT COUNT(*) AS total,
    SUM(status = 'reported') AS reported,
    SUM(status = 'under_review') AS under_review,
    SUM(status = 'in_progress') AS in_progress,
    SUM(status = 'resolved') AS resolved,
    SUM(status = 'rejected') AS rejected,
    SUM(priority = 'urgent' AND status NOT IN ('resolved','rejected')) AS urgent_open,
    SUM(assigned_to IS NULL AND status NOT IN ('resolved','rejected')) AS unassigned
    FROM reports`);
  const [categories] = await pool.query('SELECT category, COUNT(*) AS count FROM reports GROUP BY category ORDER BY count DESC');
  const [recent] = await pool.query(`SELECT id, title, category, neighborhood, status, priority, created_at FROM reports ORDER BY created_at DESC, id DESC LIMIT 5`);
  const c = counts[0];
  res.json({ data: { total: Number(c.total), by_status: { reported: Number(c.reported), under_review: Number(c.under_review), in_progress: Number(c.in_progress), resolved: Number(c.resolved), rejected: Number(c.rejected) }, urgent_open: Number(c.urgent_open), unassigned: Number(c.unassigned), by_category: categories.map((row) => ({ category: row.category, count: Number(row.count) })), recent } });
}));

module.exports = router;
