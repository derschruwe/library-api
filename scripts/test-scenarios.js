// ПЖ №7 және №8 міндетті тест сценарийлерін автоматты түрде орындайды.
// Қолдану:  node scripts/test-scenarios.js [BASE_URL]
//   мысалы: node scripts/test-scenarios.js https://library-api-xxxx.onrender.com
// Сценарий жазбаларды тек өзі құрған тест-кітапта өзгертеді/жояды — нақты деректер сақталады.

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text.slice(0, 80); }
  return { status: res.status, json };
}

const results = [];
function check(no, name, method, path, expected, res) {
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  results.push({ no, name, request: `${method} ${path}`, expected: String(expected), actual: res.status, ok });
  const preview = JSON.stringify(res.json);
  console.log(`${ok ? 'PASS' : 'FAIL'}  #${no} ${name}\n      ${method} ${path} -> ${res.status} (күтілген ${expected})\n      ${preview.length > 220 ? preview.slice(0, 220) + '…' : preview}`);
}

(async () => {
  console.log(`BASE_URL = ${BASE}\n`);

  let r = await call('GET', '/');
  check(1, 'Жария URL ашылады', 'GET', '/', 200, r);

  r = await call('GET', '/api/books');
  check(2, 'GET барлық объектілер', 'GET', '/api/books', 200, r);
  const firstId = r.json?.data?.[0]?.id ?? 1;

  r = await call('GET', `/api/books/${firstId}`);
  check(3, 'GET бар ID', 'GET', `/api/books/${firstId}`, 200, r);

  r = await call('GET', '/api/books/999999');
  check(4, 'GET жоқ ID', 'GET', '/api/books/999999', 404, r);

  const newBook = { title: 'Тест кітабы (автотест)', author: 'Автотест', year: 2026, genre: 'Тест' };
  r = await call('POST', '/api/books', newBook);
  check(5, 'Дұрыс POST', 'POST', '/api/books', 201, r);
  const newId = r.json?.id;

  r = await call('POST', '/api/books', { year: 2020 });
  check(6, 'Қате POST (title, author жоқ)', 'POST', '/api/books', 400, r);

  r = await call('PATCH', `/api/books/${newId}`, { available: false, genre: 'Жаңартылған' });
  check('7a', 'PATCH жаңарту', 'PATCH', `/api/books/${newId}`, 200, r);

  r = await call('PUT', `/api/books/${newId}`, { title: 'Тест кітабы (PUT)', author: 'Автотест', year: 2025 });
  check('7b', 'PUT толық жаңарту', 'PUT', `/api/books/${newId}`, 200, r);

  r = await call('PUT', `/api/books/${newId}`, { title: '' });
  check('7c', 'PUT валидация қатесі', 'PUT', `/api/books/${newId}`, 400, r);

  r = await call('DELETE', `/api/books/${newId}`);
  check('7d', 'DELETE жою', 'DELETE', `/api/books/${newId}`, 200, r);

  r = await call('DELETE', `/api/books/${newId}`);
  check('7e', 'DELETE қайталау (жоқ ID)', 'DELETE', `/api/books/${newId}`, 404, r);

  r = await call('GET', '/api/books/abc');
  check('7f', 'Қате ID форматы', 'GET', '/api/books/abc', 400, r);

  r = await call('GET', '/health');
  check(8, '/health', 'GET', '/health', 200, r);

  r = await call('GET', '/health/db');
  check(9, '/health/db', 'GET', '/health/db', 200, r);

  const passed = results.filter((x) => x.ok).length;
  console.log(`\nНӘТИЖЕ: ${passed}/${results.length} сценарий өтті`);
  console.log('\n#10 сценарий (DB әдейі қолжетімсіз -> /health/db 503) README-дегі нұсқаулық бойынша қолмен орындалады.');
  if (process.env.RESULTS_JSON) require('fs').writeFileSync(process.env.RESULTS_JSON, JSON.stringify(results, null, 2));
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => {
  console.error('Тест орындалмады:', e.message);
  process.exit(2);
});
