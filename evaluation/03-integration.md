# 3. Integration — Frontend ↔ Backend ↔ Microservices

## 3.1 End-to-End Flow

```
[ React (5173) ]
      │  fetch  http://localhost:8080/api/...
      ▼
[ API Gateway (8080) ]  ── verify JWT, attach x-user-* headers
      │
      ├── /api/auth/*         → Auth Service       (4001) → auth.db
      ├── /api/books/*        → Catalog Service    (4002) → catalog.db
      └── /api/reservations/* → Reservation Service(4003) → reservation.db
                                                  │
                                                  └── internal copy +/-
                                                      → Catalog Service
```

## 3.2 Single Entry Point

The frontend calls **only** `http://localhost:8080/api/*`. All cross-service routing happens in the gateway.

[`backend/api-gateway/server.js`](../e-library-reservation-system/backend/api-gateway/server.js):
- `/api/auth/*`        → `AUTH_URL/auth/*`        (no token required)
- `/api/books/*`       → `CATALOG_URL/books/*`    (token required for write ops)
- `/api/reservations/*`→ `RESERVATION_URL/reservations/*` (token required)

## 3.3 Authentication Forwarding

1. User logs in via gateway → `POST /api/auth/login` → auth-service returns `{ user, token }`.
2. Frontend stores `token` in `localStorage`.
3. Subsequent requests include `Authorization: Bearer <token>`.
4. Gateway middleware `authenticate()` verifies the JWT once and forwards user identity to downstream services as headers:
   - `x-user-id`, `x-user-role`, `x-user-name`.
5. Services treat these headers as authoritative (no JWT library dependency in services).

## 3.4 Cross-Service Communication

Reservation service calls catalog service to keep stock consistent:

```js
// reservation-service/server.js
await fetch(`${CATALOG_URL}/internal/books/${bookId}/decrement`, {
  method: 'POST',
  headers: { 'x-service-key': SERVICE_KEY },
});
```

Catalog `internal/*` endpoints require a shared `SERVICE_KEY` so that **only other services**, not browsers or gateway clients, can mutate stock counters without an admin token.

Sequence diagram (create reservation): [`docs/architecture-diagram.md`](../e-library-reservation-system/docs/architecture-diagram.md).

## 3.5 Data Persistence

- One **SQLite** file per service: `auth.db`, `catalog.db`, `reservation.db` under `backend/data/`.
- Schemas + ER diagram: [`docs/db-schema.md`](../e-library-reservation-system/docs/db-schema.md).
- DB schemas auto-create on service start; sample users + books seed if missing.

## 3.6 Configuration & Ports

Defaults (overridable via env vars):

| Variable          | Default                  |
|-------------------|--------------------------|
| `GATEWAY_PORT`    | `8080`                   |
| `AUTH_PORT`       | `4001`                   |
| `CATALOG_PORT`    | `4002`                   |
| `RESERVATION_PORT`| `4003`                   |
| `JWT_SECRET`      | `super-secret-key`       |
| `SERVICE_KEY`     | `library-internal-key`   |

Sample env file: [`backend/.env.example`](../e-library-reservation-system/backend/.env.example).

## 3.7 CORS

Each service enables `cors()` for development. The gateway is the only origin the frontend must reach in normal operation.

## 3.8 End-to-End Test (manual)

```bash
# 1) Login (gateway → auth)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@elibrary.com","password":"Student@123"}' | jq -r .token)

# 2) List books (gateway → catalog)
curl http://localhost:8080/api/books

# 3) Create reservation (gateway → reservation → catalog stock decrement)
curl -X POST http://localhost:8080/api/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":1,"startDate":"2026-05-10","endDate":"2026-05-17"}'

# 4) View own reservations
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/reservations
```

## 3.9 Failure Handling

- Gateway returns `401` if token missing/invalid before contacting downstream service.
- Reservation service returns the catalog error verbatim when stock can’t be decremented.
- If a service is down, the gateway returns a `502` from `http-proxy-middleware`.
