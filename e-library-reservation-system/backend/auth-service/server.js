const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { openDatabase, run, get } = require('../shared/db');
const { signToken, verifyToken } = require('../shared/auth');

const app = express();
const PORT = Number(process.env.AUTH_PORT || 4001);

app.use(cors());
app.use(express.json());

const db = openDatabase(path.join(__dirname, '../data/auth.db'));

async function initialize() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const users = [
    { name: 'Admin User', email: 'admin@elibrary.com', password: 'Admin@123', role: 'admin' },
    { name: 'Staff User', email: 'staff@elibrary.com', password: 'Staff@123', role: 'staff' },
    { name: 'Student One', email: 'student1@elibrary.com', password: 'Student@123', role: 'student' },
    { name: 'Student Two', email: 'student2@elibrary.com', password: 'Student@123', role: 'student' },
  ];

  for (const user of users) {
    const existing = await get(db, 'SELECT id FROM users WHERE email = ?', [user.email]);
    if (!existing) {
      const hash = await bcrypt.hash(user.password, 10);
      await run(
        db,
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, hash, user.role]
      );
    }
  }
}

app.get('/health', (_req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'invalid role' });
    }

    const existing = await get(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      db,
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );

    const user = await get(db, 'SELECT id, name, email, role FROM users WHERE id = ?', [result.id]);
    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: 'registration failed', error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await get(db, 'SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'invalid credentials' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (error) {
    return res.status(500).json({ message: 'login failed', error: error.message });
  }
});

app.get('/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'missing token' });
    }

    const payload = verifyToken(token);
    return res.json({ user: payload });
  } catch (_error) {
    return res.status(401).json({ message: 'invalid token' });
  }
});

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize auth service', error);
    process.exit(1);
  });
