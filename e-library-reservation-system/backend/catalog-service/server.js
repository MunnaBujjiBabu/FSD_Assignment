const express = require('express');
const cors = require('cors');
const path = require('path');
const { openDatabase, run, get, all } = require('../shared/db');

const app = express();
const PORT = Number(process.env.CATALOG_PORT || 4002);
const SERVICE_KEY = process.env.SERVICE_KEY || 'library-internal-key';

app.use(cors());
app.use(express.json());

const db = openDatabase(path.join(__dirname, '../data/catalog.db'));

async function initialize() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      genre TEXT NOT NULL,
      isbn TEXT UNIQUE,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const sampleBooks = [
    ['Atomic Habits', 'James Clear', 'Self-Help', '9780735211292', 5, 5, 'Tiny changes, remarkable results.'],
    ['Clean Code', 'Robert C. Martin', 'Programming', '9780132350884', 4, 4, 'A handbook of agile software craftsmanship.'],
    ['The Pragmatic Programmer', 'Andrew Hunt', 'Programming', '9780135957059', 3, 3, 'Journey to mastery for software developers.'],
    ['Deep Work', 'Cal Newport', 'Productivity', '9781455586691', 2, 2, 'Rules for focused success in a distracted world.'],
    ['Sapiens', 'Yuval Noah Harari', 'History', '9780062316097', 6, 6, 'A brief history of humankind.'],
    ['The Alchemist', 'Paulo Coelho', 'Fiction', '9780061122415', 7, 7, 'A fable about following your dream.']
  ];

  for (const book of sampleBooks) {
    const existing = await get(db, 'SELECT id FROM books WHERE isbn = ?', [book[3]]);
    if (!existing) {
      await run(
        db,
        `INSERT INTO books (title, author, genre, isbn, total_copies, available_copies, summary)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        book
      );
    }
  }
}

function requireAdmin(req, res, next) {
  if ((req.headers['x-user-role'] || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'admin access required' });
  }
  return next();
}

function requireInternal(req, res, next) {
  if (req.headers['x-service-key'] !== SERVICE_KEY) {
    return res.status(403).json({ message: 'internal access only' });
  }
  return next();
}

app.get('/health', (_req, res) => {
  res.json({ service: 'catalog-service', status: 'ok' });
});

app.get('/books', async (req, res) => {
  try {
    const { search = '', genre = '', availableOnly = 'false' } = req.query;
    const filters = [];
    const params = [];

    if (search) {
      filters.push('(title LIKE ? OR author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (genre) {
      filters.push('genre = ?');
      params.push(genre);
    }

    if (availableOnly === 'true') {
      filters.push('available_copies > 0');
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = await all(
      db,
      `SELECT id, title, author, genre, isbn, total_copies as totalCopies,
              available_copies as availableCopies, summary
       FROM books ${whereClause}
       ORDER BY title ASC`,
      params
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'failed to fetch books', error: error.message });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const row = await get(
      db,
      `SELECT id, title, author, genre, isbn, total_copies as totalCopies,
              available_copies as availableCopies, summary
       FROM books WHERE id = ?`,
      [req.params.id]
    );

    if (!row) return res.status(404).json({ message: 'book not found' });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ message: 'failed to fetch book', error: error.message });
  }
});

app.post('/books', requireAdmin, async (req, res) => {
  try {
    const { title, author, genre, isbn, totalCopies = 1, summary = '' } = req.body;
    if (!title || !author || !genre || !isbn) {
      return res.status(400).json({ message: 'title, author, genre, isbn are required' });
    }

    const result = await run(
      db,
      `INSERT INTO books (title, author, genre, isbn, total_copies, available_copies, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, author, genre, isbn, totalCopies, totalCopies, summary]
    );

    const created = await get(db, 'SELECT * FROM books WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'failed to create book', error: error.message });
  }
});

app.put('/books/:id', requireAdmin, async (req, res) => {
  try {
    const { title, author, genre, isbn, totalCopies, summary } = req.body;
    const current = await get(db, 'SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'book not found' });

    const nextTotal = Number(totalCopies ?? current.total_copies);
    const borrowed = current.total_copies - current.available_copies;
    const nextAvailable = Math.max(0, nextTotal - borrowed);

    await run(
      db,
      `UPDATE books
       SET title = ?, author = ?, genre = ?, isbn = ?, total_copies = ?, available_copies = ?, summary = ?
       WHERE id = ?`,
      [
        title ?? current.title,
        author ?? current.author,
        genre ?? current.genre,
        isbn ?? current.isbn,
        nextTotal,
        nextAvailable,
        summary ?? current.summary,
        req.params.id,
      ]
    );

    const updated = await get(db, 'SELECT * FROM books WHERE id = ?', [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'failed to update book', error: error.message });
  }
});

app.delete('/books/:id', requireAdmin, async (req, res) => {
  try {
    const current = await get(db, 'SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ message: 'book not found' });

    await run(db, 'DELETE FROM books WHERE id = ?', [req.params.id]);
    return res.json({ message: 'book deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'failed to delete book', error: error.message });
  }
});

app.post('/internal/books/:id/decrement', requireInternal, async (req, res) => {
  try {
    const book = await get(db, 'SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) return res.status(404).json({ message: 'book not found' });
    if (book.available_copies <= 0) return res.status(400).json({ message: 'no available copies' });

    await run(db, 'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [req.params.id]);
    return res.json({ message: 'book copy reserved' });
  } catch (error) {
    return res.status(500).json({ message: 'failed to reserve copy', error: error.message });
  }
});

app.post('/internal/books/:id/increment', requireInternal, async (req, res) => {
  try {
    const book = await get(db, 'SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) return res.status(404).json({ message: 'book not found' });
    if (book.available_copies >= book.total_copies) {
      return res.status(400).json({ message: 'all copies already available' });
    }

    await run(db, 'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [req.params.id]);
    return res.json({ message: 'book copy returned' });
  } catch (error) {
    return res.status(500).json({ message: 'failed to return copy', error: error.message });
  }
});

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Catalog service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize catalog service', error);
    process.exit(1);
  });
