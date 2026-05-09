const express = require('express');
const cors = require('cors');
const path = require('path');
const { openDatabase, run, get, all } = require('../shared/db');

const app = express();
const PORT = Number(process.env.RESERVATION_PORT || 4003);
const CATALOG_URL = process.env.CATALOG_URL || `http://localhost:${process.env.CATALOG_PORT || 4002}`;
const SERVICE_KEY = process.env.SERVICE_KEY || 'library-internal-key';

app.use(cors());
app.use(express.json());

const db = openDatabase(path.join(__dirname, '../data/reservation.db'));

async function initialize() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      book_title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('requested','approved','rejected','returned')) DEFAULT 'requested',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

function getUserContext(req) {
  return {
    id: Number(req.headers['x-user-id']),
    role: String(req.headers['x-user-role'] || ''),
    name: String(req.headers['x-user-name'] || ''),
  };
}

function requireStaffOrAdmin(req, res, next) {
  const role = (req.headers['x-user-role'] || '').toLowerCase();
  if (!['staff', 'admin'].includes(role)) {
    return res.status(403).json({ message: 'staff/admin access required' });
  }
  return next();
}

app.get('/health', (_req, res) => {
  res.json({ service: 'reservation-service', status: 'ok' });
});

app.get('/reservations', async (req, res) => {
  try {
    const user = getUserContext(req);
    const role = user.role.toLowerCase();

    let rows;
    if (['admin', 'staff'].includes(role)) {
      rows = await all(db, 'SELECT * FROM reservations ORDER BY created_at DESC');
    } else {
      rows = await all(db, 'SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
    }

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'failed to fetch reservations', error: error.message });
  }
});

app.post('/reservations', async (req, res) => {
  try {
    const user = getUserContext(req);
    const { bookId, startDate, endDate } = req.body;

    if (!bookId || !startDate || !endDate) {
      return res.status(400).json({ message: 'bookId, startDate and endDate are required' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'startDate must be <= endDate' });
    }

    const bookResponse = await fetch(`${CATALOG_URL}/books/${bookId}`);
    if (!bookResponse.ok) {
      return res.status(404).json({ message: 'book not found' });
    }

    const book = await bookResponse.json();
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'book is currently unavailable' });
    }

    const reserveCopy = await fetch(`${CATALOG_URL}/internal/books/${bookId}/decrement`, {
      method: 'POST',
      headers: { 'x-service-key': SERVICE_KEY },
    });

    if (!reserveCopy.ok) {
      const err = await reserveCopy.json();
      return res.status(400).json({ message: err.message || 'book copy could not be reserved' });
    }

    const result = await run(
      db,
      `INSERT INTO reservations (book_id, book_title, user_id, user_name, user_role, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'requested')`,
      [book.id, book.title, user.id, user.name, user.role, startDate, endDate]
    );

    const created = await get(db, 'SELECT * FROM reservations WHERE id = ?', [result.id]);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'failed to create reservation', error: error.message });
  }
});

app.patch('/reservations/:id/status', requireStaffOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'returned'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved, rejected, or returned' });
    }

    const reservation = await get(db, 'SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!reservation) return res.status(404).json({ message: 'reservation not found' });

    if (reservation.status === status) {
      return res.json({ message: 'status unchanged', reservation });
    }

    if ((status === 'rejected' || status === 'returned') && reservation.status !== 'returned') {
      await fetch(`${CATALOG_URL}/internal/books/${reservation.book_id}/increment`, {
        method: 'POST',
        headers: { 'x-service-key': SERVICE_KEY },
      });
    }

    await run(
      db,
      `UPDATE reservations
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, req.params.id]
    );

    const updated = await get(db, 'SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'failed to update reservation status', error: error.message });
  }
});

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Reservation service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize reservation service', error);
    process.exit(1);
  });
