const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('../shared/auth');

const app = express();
const PORT = Number(process.env.GATEWAY_PORT || 8080);

const AUTH_URL = process.env.AUTH_URL || `http://localhost:${process.env.AUTH_PORT || 4001}`;
const CATALOG_URL = process.env.CATALOG_URL || `http://localhost:${process.env.CATALOG_PORT || 4002}`;
const RESERVATION_URL = process.env.RESERVATION_URL || `http://localhost:${process.env.RESERVATION_PORT || 4003}`;

app.use(cors());

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ message: 'authentication token is required' });
    }

    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'invalid token' });
  }
}

function userHeaderProxy(target, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('x-user-id', String(req.user.id));
          proxyReq.setHeader('x-user-role', String(req.user.role));
          proxyReq.setHeader('x-user-name', String(req.user.name));
        }
      },
    },
  });
}

app.get('/health', (_req, res) => {
  res.json({ service: 'api-gateway', status: 'ok' });
});

app.use('/api/auth', createProxyMiddleware({
  target: AUTH_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/auth${path}`,
}));

app.use('/api/books', (req, res, next) => {
  if (req.method === 'GET') return next();
  return authenticate(req, res, next);
}, userHeaderProxy(CATALOG_URL, '/books'));

app.use('/api/reservations', authenticate, userHeaderProxy(RESERVATION_URL, '/reservations'));

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
