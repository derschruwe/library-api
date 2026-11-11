// Кіріс деректерін тексеру. Міндетті өрістер: title, author.
const MAX_YEAR = new Date().getFullYear();

function isNonEmptyString(v, max) {
  return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
}

/**
 * @param {object} body  - req.body
 * @param {boolean} partial - true болса (PATCH), тек берілген өрістер тексеріледі
 * @returns {{ errors: string[], data: object }}
 */
function validateBook(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Сұраныс денесі JSON объект болуы тиіс'], data };
  }

  const has = (k) => body[k] !== undefined;

  // Міндетті өріс №1: title
  if (!partial || has('title')) {
    if (!isNonEmptyString(body.title, 200)) errors.push('title міндетті (1–200 таңба)');
    else data.title = body.title.trim();
  }

  // Міндетті өріс №2: author
  if (!partial || has('author')) {
    if (!isNonEmptyString(body.author, 150)) errors.push('author міндетті (1–150 таңба)');
    else data.author = body.author.trim();
  }

  // Қосымша өрістер
  if (has('year') && body.year !== null) {
    if (!Number.isInteger(body.year) || body.year < 1000 || body.year > MAX_YEAR) {
      errors.push(`year 1000–${MAX_YEAR} аралығындағы бүтін сан болуы тиіс`);
    } else data.year = body.year;
  } else if (has('year')) data.year = null;

  if (has('genre') && body.genre !== null) {
    if (typeof body.genre !== 'string' || body.genre.length > 100) errors.push('genre 100 таңбадан аспайтын мәтін болуы тиіс');
    else data.genre = body.genre.trim() || null;
  } else if (has('genre')) data.genre = null;

  if (has('isbn') && body.isbn !== null) {
    if (typeof body.isbn !== 'string' || !/^[0-9Xx-]{10,20}$/.test(body.isbn)) errors.push('isbn форматы қате (сандар мен дефис, 10–20 таңба)');
    else data.isbn = body.isbn;
  } else if (has('isbn')) data.isbn = null;

  if (has('available')) {
    if (typeof body.available !== 'boolean') errors.push('available true/false болуы тиіс');
    else data.available = body.available;
  }

  if (partial && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push('Жаңартуға кемінде бір өріс беріңіз');
  }

  return { errors, data };
}

// ID оң бүтін сан болуы тиіс, әйтпесе 400.
function parseId(raw) {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 && id <= 2147483647 ? id : null;
}

module.exports = { validateBook, parseId };
