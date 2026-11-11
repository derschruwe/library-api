const app = require('./app');
const config = require('./config');
const { pool, initDb } = require('./db');
const { log, describeError } = require('./logger');

async function start() {
  // DB қолжетімсіз болса да қолданба іске қосылады: /health 200 қайтарады,
  // /health/db 503 қайтарады — бұл ақауды диагностикалауға мүмкіндік береді.
  try {
    await initDb();
    log.info('Database: қосылым сәтті, books кестесі дайын');
  } catch (err) {
    log.error('Database init failed:', describeError(err));
  }

  const server = app.listen(config.port, () => {
    log.info(`library-api іске қосылды: port=${config.port}, env=${config.env}`);
  });

  const shutdown = (signal) => {
    log.info(`${signal} алынды, сервис тоқтатылуда...`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => log.error('Unhandled rejection:', reason && reason.message));

start();
