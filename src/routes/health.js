const express = require('express');
const { pool } = require('../db');
const { log, describeError } = require('../logger');

const router = express.Router();
const startedAt = Date.now();

// GET /health — тек қолданбаның өзі жұмыс істеп тұрғанын тексереді (DB-ға тәуелсіз).
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'library-api',
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});

// GET /health/db — деректер қорымен байланысты SELECT 1 арқылы тексереді.
router.get('/db', async (req, res) => {
  const t0 = Date.now();
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      latency_ms: Date.now() - t0,
      time: new Date().toISOString(),
    });
  } catch (err) {
    // Толық техникалық себеп тек журналға жазылады, клиентке — жалпы хабарлама.
    log.error('Health DB check failed:', describeError(err));
    res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      time: new Date().toISOString(),
    });
  }
});

module.exports = router;
