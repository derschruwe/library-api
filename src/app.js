const path = require('path');
const express = require('express');
const { requestLogger, log, describeError } = require('./logger');
const booksRouter = require('./routes/books');
const healthRouter = require('./routes/health');

const app = express();

app.disable('x-powered-by');
app.use(requestLogger);
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/health', healthRouter);
app.use('/api/books', booksRouter);

// API туралы қысқаша ақпарат
app.get('/api', (req, res) => {
  res.json({
    name: 'Электрондық кітапхана API',
    resource: '/api/books',
    endpoints: [
      'GET /api/books', 'GET /api/books/:id', 'POST /api/books',
      'PUT /api/books/:id', 'PATCH /api/books/:id', 'DELETE /api/books/:id',
      'GET /health', 'GET /health/db',
    ],
  });
});

// Белгісіз маршрут — 404
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут табылмады: ${req.method} ${req.originalUrl}` });
});

// Орталықтандырылған қателерді өңдеу
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Бұзылған JSON — клиент қатесі (400)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Сұраныс денесіндегі JSON қате' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Сұраныс денесі тым үлкен' });
  }
  // PostgreSQL: бірегейлік шектеуі бұзылды (мысалы, бірдей ISBN)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Мұндай ISBN бар кітап бұрыннан бар' });
  }

  // Қалған қателер: техникалық мәлімет тек журналда; клиентке stack trace,
  // connection string немесе ішкі хабарлама жіберілмейді.
  log.error(`${req.method} ${req.originalUrl} ->`, describeError(err));
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
