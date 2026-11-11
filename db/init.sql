-- Электрондық кітапхана: books кестесінің құрылымы және мысал деректер.
-- Қолданба іске қосылғанда да кесте автоматты түрде құрылады (src/db.js),
-- бұл файл Docker Compose ішіндегі PostgreSQL-ды бірінші іске қосу үшін және құжаттама ретінде.

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
);

INSERT INTO books (title, author, year, genre, isbn, available) VALUES
  ('Абай жолы', 'Мұхтар Әуезов', 1942, 'Роман-эпопея', '978-601-7-00001-1', TRUE),
  ('Қан мен тер', 'Әбдіжәміл Нұрпейісов', 1961, 'Роман', '978-601-7-00002-8', TRUE),
  ('Көшпенділер', 'Ілияс Есенберлин', 1976, 'Тарихи роман', '978-601-7-00003-5', FALSE),
  ('Ақ кеме', 'Шыңғыс Айтматов', 1970, 'Повесть', '978-601-7-00004-2', TRUE),
  ('Clean Code', 'Robert C. Martin', 2008, 'Бағдарламалау', '978-0-13-235088-4', TRUE),
  ('Designing Data-Intensive Applications', 'Martin Kleppmann', 2017, 'Деректер жүйелері', '978-1-4493-7332-0', TRUE)
ON CONFLICT (isbn) DO NOTHING;
