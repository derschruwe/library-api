# Электрондық кітапхана — бұлттық REST API

Практикалық жұмыс №7–8, «Бұлтты технологиялар». **Нұсқа 1**, ресурс `/api/books`.

Node.js/Express + PostgreSQL негізіндегі бұлттық ақпараттық жүйе: CRUD, валидация, HTTP қателерін өңдеу,
құпия конфигурация environment variables арқылы, `/health` және `/health/db`, сұраныстарды журналдау.

## Архитектура

```
Client / Browser
      │  HTTPS
      ▼
Render Web Service (Node.js / Express)
  ├─ requestLogger  ──► Runtime logs (Render Logs)
  ├─ express.json + validation
  ├─ /api/books  (CRUD)
  ├─ /health, /health/db
  └─ error handler (400/404/409/500, құпиясыз жауап)
      │  SSL, параметрленген SQL
      ▼
Neon PostgreSQL (books кестесі) ──► Persistent data

Environment variables / Secrets: DATABASE_URL, DB_SSL, APP_ENV, PORT
```

## Маршруттар

| Әдіс | URL | Сипаттама | Кодтар |
|---|---|---|---|
| GET | `/api/books` | Барлық кітаптар (`?author=`, `?available=`) | 200, 500 |
| GET | `/api/books/:id` | ID бойынша кітап | 200, 400, 404 |
| POST | `/api/books` | Жаңа кітап (`title`, `author` міндетті) | 201, 400, 409 |
| PUT | `/api/books/:id` | Толық жаңарту | 200, 400, 404 |
| PATCH | `/api/books/:id` | Ішінара жаңарту | 200, 400, 404 |
| DELETE | `/api/books/:id` | Жою | 200, 400, 404 |
| GET | `/health` | Қолданба күйі | 200 |
| GET | `/health/db` | DB байланысы (`SELECT 1`) | 200, 503 |

## Деректер қоры

| Өріс | Түрі | Шектеу |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| title | VARCHAR(200) | NOT NULL |
| author | VARCHAR(150) | NOT NULL |
| year | INTEGER | 1000–2100 |
| genre | VARCHAR(100) | |
| isbn | VARCHAR(20) | UNIQUE |
| available | BOOLEAN | DEFAULT TRUE |
| created_at, updated_at | TIMESTAMPTZ | DEFAULT NOW() |

Кесте мен 6 бастапқы жазба қолданба бірінші рет іске қосылғанда автоматты түрде құрылады (`src/db.js`).

## Жергілікті іске қосу

```bash
npm install
cp .env.example .env        # нақты мәндерді енгізіңіз
npm start                   # http://localhost:3000
npm run test:scenarios      # міндетті тест сценарийлері
```

Docker бар болса: `docker compose up -d --build` (app + db + network + volume).

## Құпия конфигурация

- `.env` файлы `.gitignore` арқылы репозиторийден шығарылған; репозиторийде тек `.env.example` бар.
- Render-де `DATABASE_URL` Environment бөлімінде сақталады (`render.yaml` ішінде `sync: false`).
- Серверлік қате кезінде клиентке тек `{"error":"Internal server error"}` қайтарылады, ал техникалық себеп журналға жазылады.

## Ақауды диагностикалау (тест №10)

1. `DATABASE_URL` хостын уақытша қате мәнге өзгерту (немесе DB-ны тоқтату).
2. `/health` → 200, `/health/db` → 503 `{"status":"degraded","database":"unavailable"}`.
3. Runtime log: `ERROR Health DB check failed: ENOTFOUND ...`.
4. Дұрыс `DATABASE_URL` қалпына келтіру → қайта deploy/restart.
5. `/health/db` → 200, деректер сақталған.
