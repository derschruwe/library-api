// Журналдау: әр сұраныс аяқталғанда уақыт, HTTP әдісі, URL, статус коды және ұзақтығы жазылады.
function ts() {
  return new Date().toISOString();
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${ts()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`;
    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else console.log(line);
  });
  next();
}

const log = {
  info: (...args) => console.log(ts(), 'INFO', ...args),
  warn: (...args) => console.warn(ts(), 'WARN', ...args),
  error: (...args) => console.error(ts(), 'ERROR', ...args),
};

// Қатенің диагностикаға пайдалы қысқаша сипаттамасы (тек журнал үшін).
// ECONNREFUSED кезінде Node AggregateError береді, оның message бос болуы мүмкін.
function describeError(err) {
  if (!err) return 'unknown error';
  const inner = Array.isArray(err.errors) && err.errors[0];
  const code = err.code || (inner && inner.code) || '';
  const msg = err.message || (inner && inner.message) || '';
  return [code, msg].filter(Boolean).join(' ') || String(err);
}

module.exports = { requestLogger, log, describeError };
