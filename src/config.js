// Конфигурация тек environment variables арқылы оқылады.
// Жергілікті ортада мәндер .env файлынан жүктеледі (dotenv),
// бұлттық платформада (Render) — сервис параметрлеріндегі Environment бөлімінен.
require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: String(process.env.DB_SSL).toLowerCase() === 'true',
};

if (!config.databaseUrl) {
  console.error(new Date().toISOString(), 'CONFIG ERROR: DATABASE_URL environment variable орнатылмаған');
}

module.exports = config;
