const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { authenticate, allowRoles } = require('../middleware/auth');
const { z, statuses, priorities } = require('../utils/validation');

const router = express.Router();
const reportColumns = `r.id, r.title, r.description, r.category, r.neighborhood, r.landmark,
  r.latitude, r.longitude, r.status, r.priority, r.assigned_to, r.created_at, r.updated_at, r.resolved_at,
  assignee.name AS assigned_to_name,
  (SELECT COUNT(*) FROM report_confirmations c WHERE c.report_id = r.id) AS confirmations`;

router.get('/reports', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${reportColumns} FROM reports r LEFT JOIN users u ON u.id = r.created_by LEFT JOIN users assignee ON assignee.id = r.assigned_to ORDER BY r.created_at DESC, r.id DESC`);
  res.json({ data: rows });
}));

router.patch('/reports/:id', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(statuses).optional(), priority: z.enum(priorities).optional(), assigned_to: z.number().int().positive().nullable().optional(), note: z.string().trim().max(1000).optional() }).refine((v) => Object.keys(v).length > 0, 'Provide a field to update').refine((v) => v.status !== 'rejected' || Boolean(v.note?.trim()), { message: 'A reason is required when rejecting a report.', path: ['note'] }).parse(req.body);
  if ('assigned_to' in body && req.user.role !== 'super_admin') return res.status(403).json({ error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Only a super admin can assign staff.' } });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT id, status, priority, assigned_to, resolved_at FROM reports WHERE id = ? FOR UPDATE', [req.params.id]);
    const report = rows[0];
    if (!report) { await conn.rollback(); return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } }); }
    let newAssignee = report.assigned_to;
    if ('assigned_to' in body) {
      newAssignee = body.assigned_to;
      if (newAssignee != null) {
        const [staff] = await conn.execute('SELECT id FROM users WHERE id = ? AND role = \'staff\' AND is_active = TRUE', [newAssignee]);
        if (!staff.length) { await conn.rollback(); return res.status(400).json({ error: { code: 'INVALID_STAFF', message: 'Choose an active staff account.' } }); }
      }
    }
    const status = body.status ?? report.status;
    const priority = body.priority ?? report.priority;
    const resolvedAt = status === 'resolved' ? (report.status === 'resolved' ? report.resolved_at : new Date()) : null;
    await conn.execute('UPDATE reports SET status = ?, priority = ?, assigned_to = ?, resolved_at = ? WHERE id = ?', [status, priority, newAssignee, resolvedAt, report.id]);
    const changed = status !== report.status || priority !== report.priority || String(newAssignee) !== String(report.assigned_to) || body.note;
    if (changed) await conn.execute(`INSERT INTO report_updates (report_id, user_id, old_status, new_status, old_priority, new_priority, old_assigned_to, new_assigned_to, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [report.id, req.user.id, report.status, status, report.priority, priority, report.assigned_to, newAssignee, body.note || null]);
    await conn.commit();
    res.json({ data: { id: report.id, status, priority, assigned_to: newAssignee } });
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}));

router.use(authenticate, allowRoles('super_admin'));

router.get('/staff', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT u.id, u.name, u.email, u.is_active, u.created_at,
    COUNT(r.id) AS assigned_reports,
    SUM(r.status = 'in_progress') AS active_reports
    FROM users u LEFT JOIN reports r ON r.assigned_to = u.id
    WHERE u.role = 'staff' GROUP BY u.id ORDER BY u.name ASC`);
  res.json({ data: rows });
}));

router.post('/staff', asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(12).max(128) }).parse(req.body);
  const hash = await bcrypt.hash(body.password, 12);
  const [result] = await pool.execute(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'staff')`, [body.name, body.email, hash]);
  res.status(201).json({ data: { id: result.insertId, name: body.name, email: body.email, role: 'staff' } });
}));

router.patch('/staff/:id', asyncHandler(async (req, res) => {
  const body = z.object({ is_active: z.boolean() }).parse(req.body);
  const [result] = await pool.execute(`UPDATE users SET is_active = ? WHERE id = ? AND role = 'staff'`, [body.is_active, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: { code: 'STAFF_NOT_FOUND', message: 'Staff member not found.' } });
  res.json({ data: { id: Number(req.params.id), is_active: body.is_active } });
}));

module.exports = router;
