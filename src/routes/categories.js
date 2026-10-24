const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT slug, name, description FROM categories WHERE is_active = TRUE ORDER BY name ASC');
  res.json({ data: rows });
}));

module.exports = router;
