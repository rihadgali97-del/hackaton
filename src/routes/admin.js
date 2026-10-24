const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { authenticate, allowRoles } = require('../middleware/auth');
const { z, categorySlug, statuses, priorities } = require('../utils/validation');
const { addPriorityBrief } = require('../utils/priority-brief');

const router = express.Router();
const reportColumns = `r.id, r.title, r.description, r.category, r.neighborhood, r.landmark,
  r.image_url, r.latitude, r.longitude, r.status, r.priority, r.assigned_to, r.created_at, r.updated_at, r.resolved_at,
  cat.name AS category_name, assignee.name AS assigned_to_name,
  (SELECT COUNT(*) FROM report_confirmations c WHERE c.report_id = r.id) AS confirmations`;

router.get('/reports', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${reportColumns} FROM reports r LEFT JOIN categories cat ON cat.slug = r.category LEFT JOIN users assignee ON assignee.id = r.assigned_to ORDER BY r.created_at DESC, r.id DESC`);
  res.json({ data: rows.map(addPriorityBrief) });
}));

router.patch('/reports/:id', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(statuses).optional(), priority: z.enum(priorities).optional(), assigned_to: z.number().int().positive().nullable().optional(), note: z.string().trim().max(1000).optional() }).refine((v) => Object.keys(v).length > 0, 'Provide a field to update').refine((v) => v.status !== 'rejected' || Boolean(v.note?.trim()), { message: 'A reason is required when rejecting a report.', path: ['note'] }).parse(req.body);
  if ('assigned_to' in body && req.user.role !== 'super_admin') return res.status(403).json({ error: { code: 'SUPER_ADMIN_REQUIRED', message: 'Only a super admin can assign staff.' } });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT id, category, status, priority, assigned_to, resolved_at FROM reports WHERE id = ? FOR UPDATE', [req.params.id]);
    const report = rows[0];
    if (!report) { await conn.rollback(); return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } }); }
    let newAssignee = report.assigned_to;
    if ('assigned_to' in body) {
      newAssignee = body.assigned_to;
      if (newAssignee != null) {
        const [staff] = await conn.execute('SELECT id FROM users WHERE id = ? AND role = \'staff\' AND is_active = TRUE AND category = ?', [newAssignee, report.category]);
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

router.get('/categories', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT c.slug, c.name, c.description, c.is_active, c.created_at,
    COUNT(DISTINCT r.id) AS report_count,
    COUNT(DISTINCT u.id) AS staff_count
    FROM categories c LEFT JOIN reports r ON r.category = c.slug LEFT JOIN users u ON u.category = c.slug AND u.role = 'staff'
    GROUP BY c.slug ORDER BY c.name ASC`);
  res.json({ data: rows });
}));

router.post('/categories', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(255).optional().default('') }).parse(req.body);
  const slug = body.name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60).replace(/_+$/g, '');
  if (!categorySlug.safeParse(slug).success) return res.status(400).json({ error: { code: 'INVALID_CATEGORY_NAME', message: 'Use a name with at least one English letter or number.' } });
  await pool.execute('INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)', [slug, body.name, body.description || null]);
  res.status(201).json({ data: { slug, name: body.name, description: body.description || null, is_active: true } });
}));

router.patch('/categories/:slug', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80).optional(), description: z.string().trim().max(255).nullable().optional(), is_active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, 'Provide a category field to update').parse(req.body);
  const updates = [];
  const values = [];
  for (const field of ['name', 'description', 'is_active']) {
    if (Object.hasOwn(body, field)) { updates.push(`${field} = ?`); values.push(field === 'description' && body[field] === '' ? null : body[field]); }
  }
  const [result] = await pool.execute(`UPDATE categories SET ${updates.join(', ')} WHERE slug = ?`, [...values, req.params.slug]);
  if (!result.affectedRows) {
    const [existing] = await pool.execute('SELECT slug FROM categories WHERE slug = ?', [req.params.slug]);
    if (!existing.length) return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' } });
  }
  const [rows] = await pool.execute('SELECT slug, name, description, is_active FROM categories WHERE slug = ?', [req.params.slug]);
  res.json({ data: rows[0] });
}));

router.delete('/categories/:slug', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const [result] = await pool.execute('UPDATE categories SET is_active = FALSE WHERE slug = ?', [req.params.slug]);
  if (!result.affectedRows) return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' } });
  res.json({ data: { slug: req.params.slug, is_active: false, archived: true } });
}));

router.get('/staff', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT u.id, u.name, u.email, u.category, c.name AS category_name, u.is_active, u.created_at,
    COUNT(r.id) AS assigned_reports,
    SUM(r.status = 'in_progress') AS active_reports
    FROM users u LEFT JOIN categories c ON c.slug = u.category LEFT JOIN reports r ON r.assigned_to = u.id
    WHERE u.role = 'staff' GROUP BY u.id, c.name ORDER BY u.name ASC`);
  res.json({ data: rows });
}));

router.post('/staff', authenticate, allowRoles('admin', 'super_admin'), asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(12).max(128), category: categorySlug }).parse(req.body);
  const [categories] = await pool.execute('SELECT slug FROM categories WHERE slug = ? AND is_active = TRUE', [body.category]);
  if (!categories.length) return res.status(400).json({ error: { code: 'INVALID_CATEGORY', message: 'Choose an active staff category.' } });
  const hash = await bcrypt.hash(body.password, 12);
  const [result] = await pool.execute(`INSERT INTO users (name, email, password_hash, role, category) VALUES (?, ?, ?, 'staff', ?)`, [body.name, body.email, hash, body.category]);
  res.status(201).json({ data: { id: result.insertId, name: body.name, email: body.email, role: 'staff', category: body.category } });
}));

router.use(authenticate, allowRoles('super_admin'));

router.patch('/staff/:id', asyncHandler(async (req, res) => {
  const body = z.object({ is_active: z.boolean() }).parse(req.body);
  const [result] = await pool.execute(`UPDATE users SET is_active = ? WHERE id = ? AND role = 'staff'`, [body.is_active, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: { code: 'STAFF_NOT_FOUND', message: 'Staff member not found.' } });
  res.json({ data: { id: Number(req.params.id), is_active: body.is_active } });
}));

module.exports = router;
