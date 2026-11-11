const express = require('express');
const { pool } = require('../db');
const { validateBook, parseId } = require('../validation');

const router = express.Router();
const COLUMNS = 'id, title, author, year, genre, isbn, available, created_at, updated_at';
const FIELDS = ['title', 'author', 'year', 'genre', 'isbn', 'available'];

// ID параметрін тексеретін көмекші middleware
function requireValidId(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'id оң бүтін сан болуы тиіс' });
  req.bookId = id;
  next();
}

// GET /api/books — барлық кітаптар (міндетті емес сүзгі: ?author=, ?available=true)
router.get('/', async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.author) {
    params.push(`%${req.query.author}%`);
    where.push(`author ILIKE $${params.length}`);
  }
  if (req.query.available === 'true' || req.query.available === 'false') {
    params.push(req.query.available === 'true');
    where.push(`available = $${params.length}`);
  }
  const sql = `SELECT ${COLUMNS} FROM books ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`;
  const { rows } = await pool.query(sql, params);
  res.status(200).json({ count: rows.length, data: rows });
});

// GET /api/books/:id — бір кітап
router.get('/:id', requireValidId, async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM books WHERE id = $1`, [req.bookId]);
  if (rows.length === 0) return res.status(404).json({ error: `id=${req.bookId} кітап табылмады` });
  res.status(200).json(rows[0]);
});

// POST /api/books — жаңа кітап
router.post('/', async (req, res) => {
  const { errors, data } = validateBook(req.body);
  if (errors.length) return res.status(400).json({ error: 'Валидация қатесі', details: errors });

  const { rows } = await pool.query(
    `INSERT INTO books (title, author, year, genre, isbn, available)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [data.title, data.author, data.year ?? null, data.genre ?? null, data.isbn ?? null, data.available ?? true]
  );
  res.status(201).location(`/api/books/${rows[0].id}`).json(rows[0]);
});

// PUT /api/books/:id — толық жаңарту (title, author міндетті)
router.put('/:id', requireValidId, async (req, res) => {
  const { errors, data } = validateBook(req.body);
  if (errors.length) return res.status(400).json({ error: 'Валидация қатесі', details: errors });

  const { rows } = await pool.query(
    `UPDATE books SET title=$1, author=$2, year=$3, genre=$4, isbn=$5, available=$6, updated_at=NOW()
     WHERE id=$7 RETURNING ${COLUMNS}`,
    [data.title, data.author, data.year ?? null, data.genre ?? null, data.isbn ?? null, data.available ?? true, req.bookId]
  );
  if (rows.length === 0) return res.status(404).json({ error: `id=${req.bookId} кітап табылмады` });
  res.status(200).json(rows[0]);
});

// PATCH /api/books/:id — ішінара жаңарту
router.patch('/:id', requireValidId, async (req, res) => {
  const { errors, data } = validateBook(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'Валидация қатесі', details: errors });

  // Баған аттары тек ақ тізімнен (FIELDS) алынады, мәндер — параметр ретінде.
  const keys = FIELDS.filter((f) => f in data);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const params = keys.map((k) => data[k]);
  params.push(req.bookId);

  const { rows } = await pool.query(
    `UPDATE books SET ${set}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: `id=${req.bookId} кітап табылмады` });
  res.status(200).json(rows[0]);
});

// DELETE /api/books/:id — жою
router.delete('/:id', requireValidId, async (req, res) => {
  const { rows } = await pool.query(`DELETE FROM books WHERE id = $1 RETURNING ${COLUMNS}`, [req.bookId]);
  if (rows.length === 0) return res.status(404).json({ error: `id=${req.bookId} кітап табылмады` });
  res.status(200).json({ message: 'Кітап жойылды', deleted: rows[0] });
});

module.exports = router;
