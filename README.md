# FSD_Assignment — E-Library Reservation System

Full-stack mini project built for the **BITS Full Stack Application Development** assignment.
The project demonstrates a modern React frontend, a microservice-based Node.js backend, an API gateway, and SQLite persistence — built primarily with AI-assisted development (GitHub Copilot / Claude).

> Project lives in: [`e-library-reservation-system/`](./e-library-reservation-system)

---

## 1. Problem Statement

A web-based **E-Library Reservation System** that lets students reserve books, staff/admin manage reservations, and admin manage the catalog. It models the real workflow of a small library with role-based access, availability tracking, and reservation lifecycle (request → approve/reject → returned).

## 2. Tech Stack

| Layer        | Technology                                  |
|--------------|----------------------------------------------|
| Frontend     | React 18 + Vite + React Router               |
| Backend      | Node.js + Express (4 services)               |
| API Gateway  | Express + http-proxy-middleware + JWT verify |
| Database     | SQLite (one DB per service)                  |
| Auth         | JWT (bcrypt-hashed passwords)                |
| Tooling      | Concurrently, Nodemon                        |

## 3. Architecture

```
[ React (5173) ] → [ API Gateway (8080) ] → [ Auth (4001) ]
                                          → [ Catalog (4002) ] ↔ [ Reservation (4003) ]
                                                              (internal copy +/- calls)
```

- The **API Gateway** is the single entry point for the frontend.
- It validates JWTs, attaches `x-user-*` headers, and proxies to the right service.
- The **Reservation service** calls the **Catalog service** internally to decrement/increment available copies.
- Each microservice owns its own SQLite database.

Detailed diagrams: [`docs/architecture-diagram.md`](./e-library-reservation-system/docs/architecture-diagram.md)

## 4. Features

- Login / role-based access (`student`, `staff`, `admin`)
- Browse & search books
- Reserve a book (auto-decrements available copies)
- Staff/Admin: approve, reject, mark as returned
- Admin: catalog CRUD (via API)
- Sample users + books auto-seeded on first run

## 5. Project Structure

```
e-library-reservation-system/
├── backend/
│   ├── api-gateway/          # JWT verify + proxy
│   ├── auth-service/         # users, login, register
│   ├── catalog-service/      # books CRUD + stock
│   ├── reservation-service/  # reservations lifecycle
│   ├── shared/               # db helpers, JWT utilities
│   ├── seed-all.js           # reset DB files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, BookCard, ProtectedRoute
│   │   ├── pages/            # Login, Books, Reservations
│   │   ├── services/api.js   # API client (talks to gateway)
│   │   └── App.jsx, main.jsx, styles.css
│   └── package.json
├── docs/                     # API, architecture, schema, AI log
└── package.json              # workspace scripts
```

Frontend component hierarchy: [`docs/component-hierarchy.md`](./e-library-reservation-system/docs/component-hierarchy.md)

## 6. Prerequisites

- Node.js 18+ (tested on Node 22)
- npm 9+
- macOS / Linux / Windows (use WSL on Windows for best results)

## 7. Setup & Run

```bash
# 1. Clone
git clone https://github.com/MunnaBujjiBabu/FSD_Assignment.git
cd FSD_Assignment/e-library-reservation-system

# 2. Install root + backend + frontend dependencies
npm install
npm run install:all

# 3. (Optional) reset the SQLite databases — sample data re-seeds on next start
npm run seed

# 4. Start everything (4 backend services + Vite dev server)
npm run dev
```

Then open the app:

- Frontend: http://localhost:5173
- API Gateway: http://localhost:8080
- Health checks: `/health` on each service (4001, 4002, 4003, 8080)

> If `npm` is not on your PATH or has permission issues on macOS, fix with:
> `sudo chown -R $(whoami) ~/.npm` and ensure `/usr/local/bin` is on your PATH.

### Run services individually (alt.)

```bash
cd e-library-reservation-system/backend
node auth-service/server.js
node catalog-service/server.js
node reservation-service/server.js
node api-gateway/server.js

cd ../frontend
npm run dev
```

## 8. Sample Credentials (auto-seeded)

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@elibrary.com       | Admin@123    |
| Staff   | staff@elibrary.com       | Staff@123    |
| Student | student1@elibrary.com    | Student@123  |
| Student | student2@elibrary.com    | Student@123  |

Sample books seeded on first start: *Atomic Habits*, *Clean Code*, *The Pragmatic Programmer*, *Deep Work*, *Sapiens*, *The Alchemist*.

## 9. Demo Walkthrough

1. **Login** as a student → browse books.
2. Click **Reserve** on any available book → reservation appears under **Reservations** with status `requested`. Available copies decrement.
3. Logout → **Login** as `staff@elibrary.com`.
4. Open **Reservations** → click **Approve**, **Reject**, or **Mark Returned**.
5. Reject/Return increments the available copies back.
6. Login as `admin@elibrary.com` → manage catalog via API (Postman collection in `docs/`).

## 10. API

- OpenAPI spec: [`docs/openapi.yaml`](./e-library-reservation-system/docs/openapi.yaml) (open in https://editor.swagger.io)
- Postman collection: [`docs/postman_collection.json`](./e-library-reservation-system/docs/postman_collection.json)

Quick reference (all via gateway, base `http://localhost:8080/api`):

| Method | Path                              | Auth        |
|--------|-----------------------------------|-------------|
| POST   | `/auth/login`                     | public      |
| POST   | `/auth/register`                  | public      |
| GET    | `/books` (?search=&genre=)        | public      |
| GET    | `/books/:id`                      | public      |
| POST/PUT/DELETE | `/books`                 | admin       |
| GET    | `/reservations`                   | any auth    |
| POST   | `/reservations`                   | any auth    |
| PATCH  | `/reservations/:id/status`        | staff/admin |

## 11. Documentation

All in [`e-library-reservation-system/docs/`](./e-library-reservation-system/docs):

- [Architecture & sequence diagrams](./e-library-reservation-system/docs/architecture-diagram.md)
- [DB schema + ER diagram](./e-library-reservation-system/docs/db-schema.md)
- [Component hierarchy](./e-library-reservation-system/docs/component-hierarchy.md)
- [UI wireframes](./e-library-reservation-system/docs/wireframes.md)
- [Assumptions](./e-library-reservation-system/docs/assumptions.md)
- [AI usage log + reflection](./e-library-reservation-system/docs/ai-usage-log.md)

## 12. AI-Assisted Development

Approach: **Option A — Build from scratch with AI assistance.**
Tool used: GitHub Copilot Chat (Claude). The AI generated the scaffolding (services, routes, React pages, Swagger, diagrams). Manual review covered: gateway routing fix (path rewrite bug), service-to-service auth header, environment setup, and end-to-end testing.

See full log + reflection: [`docs/ai-usage-log.md`](./e-library-reservation-system/docs/ai-usage-log.md)

## 13. Troubleshooting

- **Port already in use** (`EADDRINUSE`): another instance is running. Find and kill it:
  ```bash
  lsof -i :8080 -i :4001 -i :4002 -i :4003 -sTCP:LISTEN -P -n
  kill <PID>
  ```
- **Login fails / `Cannot POST /login`**: ensure the gateway code is the latest (path rewrites map `/api/auth/*` → `/auth/*`). Restart `api-gateway/server.js`.
- **Reset all data**: `npm run seed` from the project root.
- **CORS errors**: confirm frontend points to `http://localhost:8080/api` (see `frontend/src/services/api.js`).

## 14. Deliverables Checklist

- [x] Source code in GitHub repo (this repo)
- [x] API documentation (Swagger + Postman + Markdown)
- [x] DB schema + ER diagram
- [x] Architecture + sequence diagrams
- [x] Frontend component hierarchy
- [x] UI wireframes
- [x] Assumptions document
- [x] AI usage log + reflection
- [ ] Demo video (Google Drive link to be added here)

## 15. License

For academic use as part of the BITS Pilani Full Stack Application Development assignment.