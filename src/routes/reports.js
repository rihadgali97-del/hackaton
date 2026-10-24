const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');
const { authenticate, optionalAuthenticate, allowRoles } = require('../middleware/auth');
const { z, categorySlug, statuses, priorities, reportSchema } = require('../utils/validation');
const { findDuplicateReports } = require('../utils/duplicates');
const { detectImageExtension } = require('../utils/image-type');
const { addPriorityBrief } = require('../utils/priority-brief');

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads');
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 8, parts: 9, fieldNameSize: 50, fieldSize: 5000, fieldNestingDepth: 0 },
}).single('image');
function parseReportImage(req, res, next) {
  uploadImage(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return next();
    req.imageExtension = detectImageExtension(req.file.buffer);
    if (!req.imageExtension) return res.status(400).json({ error: { code: 'INVALID_IMAGE_TYPE', message: 'Upload a valid JPEG, PNG, or WebP image.' } });
    next();
  });
}

const router = express.Router();
const publicColumns = `r.id, r.title, r.description, r.category, r.neighborhood, r.landmark,
  r.image_url, r.resolution_image_url, r.latitude, r.longitude, r.status, r.priority, r.assigned_to, r.created_at, r.updated_at, r.resolved_at,
  cat.name AS category_name, assignee.name AS assigned_to_name,
  (SELECT COUNT(*) FROM report_confirmations c WHERE c.report_id = r.id) AS confirmations`;
function enrichReport(report, req) {
  const enriched = addPriorityBrief(report);
  const canSeePendingEvidence = ['admin', 'super_admin'].includes(req.user?.role)
    || (req.user?.role === 'staff' && String(report.assigned_to) === String(req.user.id));
  if (report.status !== 'resolved' && !canSeePendingEvidence) delete enriched.resolution_image_url;
  return enriched;
}

router.get('/', optionalAuthenticate, asyncHandler(async (req, res) => {
  const querySchema = z.object({
    search: z.string().trim().max(120).optional(), q: z.string().trim().max(120).optional(), category: z.string().optional(), status: z.string().optional(),
    priority: z.string().optional(), neighborhood: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
  });
  const q = querySchema.parse(req.query);
  const where = [];
  const params = [];
  if (req.user?.role === 'staff') { where.push('r.assigned_to = ?'); params.push(req.user.id); }
  const search = q.search || q.q;
  if (search) { where.push('(r.title LIKE ? OR r.description LIKE ? OR r.landmark LIKE ?)'); const term = `%${search}%`; params.push(term, term, term); }
  for (const [field, value] of [['category', q.category], ['status', q.status], ['priority', q.priority], ['neighborhood', q.neighborhood]]) {
    if (!value) continue;
    const valid = field === 'status' ? statuses : field === 'priority' ? priorities : null;
    if (field === 'category' && !categorySlug.safeParse(value).success) return res.status(400).json({ error: { code: 'INVALID_FILTER', message: 'Invalid category filter.' } });
    if (valid && !valid.includes(value)) return res.status(400).json({ error: { code: 'INVALID_FILTER', message: `Invalid ${field} filter.` } });
    where.push(`r.${field} = ?`); params.push(value);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (q.page - 1) * q.limit;
  const [rows] = await pool.execute(`SELECT ${publicColumns} FROM reports r LEFT JOIN categories cat ON cat.slug = r.category LEFT JOIN users assignee ON assignee.id = r.assigned_to ${clause} ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`, [...params, q.limit, offset]);
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM reports r ${clause}`, params);
  const total = Number(countRows[0].total);
  res.json({ data: rows.map((row) => enrichReport(row, req)), pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) } });
}));

router.get('/:id', optionalAuthenticate, asyncHandler(async (req, res) => {
  const staffScope = req.user?.role === 'staff' ? ' AND r.assigned_to = ?' : '';
  const params = req.user?.role === 'staff' ? [req.params.id, req.user.id] : [req.params.id];
  const [rows] = await pool.execute(`SELECT ${publicColumns} FROM reports r LEFT JOIN categories cat ON cat.slug = r.category LEFT JOIN users assignee ON assignee.id = r.assigned_to WHERE r.id = ?${staffScope}`, params);
  if (!rows[0]) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
  res.json({ data: enrichReport(rows[0], req) });
}));

router.post('/check-duplicates', optionalAuthenticate, asyncHandler(async (req, res) => {
  if (req.user?.role === 'staff') return res.status(403).json({ error: { code: 'STAFF_SCOPE', message: 'Staff can only review reports assigned to them.' } });
  const data = reportSchema.parse(req.body);
  const [activeCategories] = await pool.execute('SELECT slug FROM categories WHERE slug = ? AND is_active = TRUE', [data.category]);
  if (!activeCategories.length) return res.status(400).json({ error: { code: 'INVALID_CATEGORY', message: 'Choose an active report category.' } });
  const [candidates] = await pool.execute(
    `SELECT id, title, description, category, neighborhood, landmark, latitude, longitude, status, priority, created_at
     FROM reports WHERE status NOT IN ('resolved','rejected') AND category = ?
     ORDER BY created_at DESC LIMIT 200`,
    [data.category],
  );
  const threshold = Number(process.env.DUPLICATE_THRESHOLD || 60);
  const matches = findDuplicateReports(candidates, data, threshold);
  res.json({ data: matches, threshold, suggestions_only: true });
}));

router.post('/', optionalAuthenticate, parseReportImage, asyncHandler(async (req, res) => {
  if (req.user?.role === 'staff') return res.status(403).json({ error: { code: 'STAFF_SCOPE', message: 'Staff accounts cannot submit community reports.' } });
  const data = reportSchema.parse(req.body);
  const [activeCategories] = await pool.execute('SELECT slug FROM categories WHERE slug = ? AND is_active = TRUE', [data.category]);
  if (!activeCategories.length) return res.status(400).json({ error: { code: 'INVALID_CATEGORY', message: 'Choose an active report category.' } });
  const userId = req.get('authorization') ? req.user?.id : null;
  let imageUrl = null;
  let imagePath = null;
  let conn;
  try {
    conn = await pool.getConnection();
    if (req.file) {
      const filename = `${crypto.randomUUID()}.${req.imageExtension}`;
      await fs.mkdir(uploadDirectory, { recursive: true });
      imagePath = path.join(uploadDirectory, filename);
      imageUrl = `/uploads/${filename}`;
      await fs.writeFile(imagePath, req.file.buffer, { flag: 'wx' });
    }
    await conn.beginTransaction();
    const [result] = await conn.execute(
      `INSERT INTO reports (title, description, image_url, category, neighborhood, landmark, latitude, longitude, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.description, imageUrl, data.category, data.neighborhood, data.landmark || null, data.latitude ?? null, data.longitude ?? null, userId || null],
    );
    await conn.execute(`INSERT INTO report_updates (report_id, user_id, old_status, new_status, old_priority, new_priority, note)
      VALUES (?, ?, NULL, 'reported', NULL, 'medium', 'Report submitted')`, [result.insertId, userId || null]);
    await conn.commit();
    res.status(201).json({ data: { id: result.insertId, ...data, image_url: imageUrl, status: 'reported', priority: 'medium' } });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    if (imagePath) await fs.unlink(imagePath).catch(() => {});
    throw error;
  } finally { conn?.release(); }
}));

router.post('/:id/confirm', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role === 'staff') return res.status(403).json({ error: { code: 'STAFF_SCOPE', message: 'Staff accounts cannot confirm community reports.' } });
  const [reports] = await pool.execute('SELECT id FROM reports WHERE id = ?', [req.params.id]);
  if (!reports.length) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
  const [result] = await pool.execute('INSERT IGNORE INTO report_confirmations (report_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(409).json({ error: { code: 'ALREADY_CONFIRMED', message: 'You already confirmed this report.' } });
  res.status(201).json({ data: { confirmed: true } });
}));

router.get('/:id/updates', optionalAuthenticate, asyncHandler(async (req, res) => {
  if (req.user?.role === 'staff') {
    const [assigned] = await pool.execute('SELECT id FROM reports WHERE id = ? AND assigned_to = ?', [req.params.id, req.user.id]);
    if (!assigned.length) return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
  }
  const [rows] = await pool.execute(`SELECT ru.id, ru.old_status, ru.new_status, ru.old_priority, ru.new_priority, ru.image_url,
    ru.old_assigned_to, ru.new_assigned_to, ru.note, ru.created_at, u.name AS updated_by,
    old_staff.name AS old_assignee_name, new_staff.name AS new_assignee_name
    FROM report_updates ru LEFT JOIN users u ON u.id = ru.user_id
    LEFT JOIN users old_staff ON old_staff.id = ru.old_assigned_to LEFT JOIN users new_staff ON new_staff.id = ru.new_assigned_to
    WHERE ru.report_id = ? ORDER BY ru.created_at ASC, ru.id ASC`, [req.params.id]);
  const isStaff = req.user?.role === 'staff';
  const canSeeAllEvidence = ['admin', 'super_admin'].includes(req.user?.role) || isStaff;
  res.json({ data: rows.map((row) => ({ ...row, image_url: canSeeAllEvidence || row.new_status === 'resolved' ? row.image_url : null })) });
}));

router.get('/staff/assigned', authenticate, allowRoles('staff'), asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${publicColumns} FROM reports r LEFT JOIN categories cat ON cat.slug = r.category LEFT JOIN users assignee ON assignee.id = r.assigned_to WHERE r.assigned_to = ? ORDER BY r.priority = 'urgent' DESC, r.created_at ASC`, [req.user.id]);
  res.json({ data: rows.map((row) => enrichReport(row, req)) });
}));

router.patch('/staff/reports/:id', authenticate, allowRoles('staff'), parseReportImage, asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(['in_progress', 'resolved']).optional(), note: z.string().trim().max(1000).optional() }).refine((v) => v.status || v.note, 'Provide a status or note').parse(req.body);
  if (body.status === 'resolved' && !req.file) return res.status(400).json({ error: { code: 'RESOLUTION_PHOTO_REQUIRED', message: 'Upload a photo showing the completed repair before submitting it for review.' } });
  if (req.file && body.status !== 'resolved') return res.status(400).json({ error: { code: 'PHOTO_REQUIRES_RESOLUTION', message: 'A completion photo can only be submitted when requesting resolution review.' } });
  const conn = await pool.getConnection();
  let imagePath = null;
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT id, status, priority, assigned_to, resolution_image_url FROM reports WHERE id = ? FOR UPDATE', [req.params.id]);
    const report = rows[0];
    if (!report) { await conn.rollback(); return res.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } }); }
    if (String(report.assigned_to) !== String(req.user.id)) { await conn.rollback(); return res.status(403).json({ error: { code: 'NOT_ASSIGNED', message: 'You can update reports assigned to you.' } }); }
    if (['pending_verification', 'resolved', 'rejected'].includes(report.status)) { await conn.rollback(); return res.status(409).json({ error: { code: 'REPORT_NOT_EDITABLE', message: 'This report is awaiting admin review or is already closed.' } }); }
    const status = body.status === 'resolved' ? 'pending_verification' : body.status || report.status;
    let imageUrl = report.resolution_image_url;
    if (req.file) {
      const filename = `${crypto.randomUUID()}.${req.imageExtension}`;
      await fs.mkdir(uploadDirectory, { recursive: true });
      imagePath = path.join(uploadDirectory, filename);
      imageUrl = `/uploads/${filename}`;
      await fs.writeFile(imagePath, req.file.buffer, { flag: 'wx' });
    }
    await conn.execute('UPDATE reports SET status = ?, resolved_at = NULL, resolution_image_url = ? WHERE id = ?', [status, imageUrl, report.id]);
    const note = body.note || (status === 'pending_verification' ? 'Completion photo submitted for admin review.' : null);
    await conn.execute(`INSERT INTO report_updates (report_id, user_id, old_status, new_status, old_priority, new_priority, old_assigned_to, new_assigned_to, note, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [report.id, req.user.id, report.status, status, report.priority, report.priority, report.assigned_to, report.assigned_to, note, req.file ? imageUrl : null]);
    await conn.commit();
    res.json({ data: { id: report.id, status } });
  } catch (error) { await conn.rollback(); if (imagePath) await fs.unlink(imagePath).catch(() => {}); throw error; } finally { conn.release(); }
}));

module.exports = router;
