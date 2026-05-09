# 1. Backend APIs — CRUD, Validation, Documentation

## 1.1 Architecture Summary

The backend is split into **three microservices** plus an **API gateway**, all written in Node.js + Express, persisting to per-service SQLite databases.

| Service              | Port | Responsibility                              |
|----------------------|------|----------------------------------------------|
| `auth-service`       | 4001 | Users, register, login, JWT issue            |
| `catalog-service`    | 4002 | Books CRUD, stock (availability) management  |
| `reservation-service`| 4003 | Reservations lifecycle + cross-service stock |
| `api-gateway`        | 8080 | Single entry, JWT verify, routing            |

Code:
- [`backend/auth-service/server.js`](../e-library-reservation-system/backend/auth-service/server.js)
- [`backend/catalog-service/server.js`](../e-library-reservation-system/backend/catalog-service/server.js)
- [`backend/reservation-service/server.js`](../e-library-reservation-system/backend/reservation-service/server.js)
- [`backend/api-gateway/server.js`](../e-library-reservation-system/backend/api-gateway/server.js)

## 1.2 CRUD Coverage

| Resource        | Create | Read              | Update                       | Delete |
|-----------------|--------|-------------------|------------------------------|--------|
| Users           | `POST /auth/register` | `GET /auth/me`        | —                            | —      |
| Books           | `POST /books` (admin) | `GET /books`, `GET /books/:id` | `PUT /books/:id` (admin) | `DELETE /books/:id` (admin) |
| Reservations    | `POST /reservations`  | `GET /reservations`            | `PATCH /reservations/:id/status` (staff/admin) | — (returned via PATCH) |

All endpoints accept and return JSON.

## 1.3 Validation Strategy

- **Request body validation** in route handlers (required fields, allowed enums).
- **Role enforcement** at gateway and per service via `x-user-role` header check.
- **Cross-service guard** via shared `SERVICE_KEY` for catalog `internal/*` endpoints.
- **Database constraints**: `CHECK` constraints on `users.role` and `reservations.status`; `UNIQUE` on email/ISBN.
- **Stock invariants**: copies cannot go below 0 or above `total_copies` (enforced in catalog endpoints).

Examples:
```js
if (!email || !password) {
  return res.status(400).json({ message: 'email and password are required' });
}

if (!['student', 'staff', 'admin'].includes(role)) {
  return res.status(400).json({ message: 'invalid role' });
}
```

## 1.4 Authentication & Authorization

- Passwords are **bcrypt-hashed** in `auth-service`.
- JWT (HS256) signed with shared secret in `shared/auth.js`; payload includes `id`, `role`, `name`, `email`.
- Gateway verifies JWT and forwards `x-user-id`, `x-user-role`, `x-user-name` headers — services never re-verify the token, keeping them decoupled from the auth library.
- Role checks: catalog write endpoints require `admin`; reservation status change requires `staff` or `admin`.

## 1.5 API Documentation

- **OpenAPI 3.0 (Swagger)**: [`docs/openapi.yaml`](../e-library-reservation-system/docs/openapi.yaml) — paste into https://editor.swagger.io to view.
- **Postman collection**: [`docs/postman_collection.json`](../e-library-reservation-system/docs/postman_collection.json) — import directly.
- **Endpoint table** in main README ([README.md §10](../README.md)).

## 1.6 Error Handling

Standardized JSON error response:
```json
{ "message": "human-readable error", "error": "optional details" }
```
HTTP status conventions used:
- `400` — validation errors
- `401` — missing/invalid token
- `403` — role/permission violation
- `404` — resource not found
- `409` — uniqueness conflicts (e.g., email/ISBN)
- `500` — unexpected server errors (logged with stack)

## 1.7 Sample Curl Calls

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elibrary.com","password":"Admin@123"}'

# List books with search
curl "http://localhost:8080/api/books?search=clean&availableOnly=true"

# Reserve a book (use token from login)
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"bookId":1,"startDate":"2026-05-10","endDate":"2026-05-17"}'
```
