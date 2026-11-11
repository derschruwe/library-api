const { Pool } = require('pg');
const config = require('./config');
const { log } = require('./logger');

// Connection string кодта емес, тек DATABASE_URL айнымалысынан алынады.
const pool = new Pool({
  connectionString: config.databaseUrl,
  // Бұлттық DB үшін TLS қосылады және сервер сертификаты тексеріледі.
  ssl: config.dbSsl ? { rejectUnauthorized: true } : false,
  max: 5,
  connectionTimeoutMillis: 3000, // DB қолжетімсіз болса, сұраныс ұзақ күтпейді
  idleTimeoutMillis: 30000,
});

// Бос тұрған қосылымдағы күтпеген қате процесті құлатпауы тиіс.
pool.on('error', (err) => {
  log.error('PostgreSQL pool error:', err.message);
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS books (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  author      VARCHAR(150) NOT NULL,
  year        INTEGER CHECK (year BETWEEN 1000 AND 2100),
  genre       VARCHAR(100),
  isbn        VARCHAR(20) UNIQUE,
  available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

const SEED_BOOKS = [
  ['Абай жолы', 'Мұхтар Әуезов', 1942, 'Роман-эпопея', '978-601-7-00001-1', true],
  ['Қан мен тер', 'Әбдіжәміл Нұрпейісов', 1961, 'Роман', '978-601-7-00002-8', true],
  ['Көшпенділер', 'Ілияс Есенберлин', 1976, 'Тарихи роман', '978-601-7-00003-5', false],
  ['Ақ кеме', 'Шыңғыс Айтматов', 1970, 'Повесть', '978-601-7-00004-2', true],
  ['Clean Code', 'Robert C. Martin', 2008, 'Бағдарламалау', '978-0-13-235088-4', true],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', 2017, 'Деректер жүйелері', '978-1-4493-7332-0', true],
];

// Кестені құру және бос болса бастапқы деректерді енгізу (параметрленген INSERT).
async function initDb() {
  await pool.query(SCHEMA_SQL);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM books');
  if (rows[0].count === 0) {
    for (const b of SEED_BOOKS) {
      await pool.query(
        'INSERT INTO books (title, author, year, genre, isbn, available) VALUES ($1, $2, $3, $4, $5, $6)',
        b
      );
    }
    log.info(`Seed: books кестесіне ${SEED_BOOKS.length} жазба қосылды`);
  }
}

module.exports = { pool, initDb };
