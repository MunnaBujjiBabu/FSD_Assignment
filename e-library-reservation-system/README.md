# E-Library Reservation System (Full Stack Assignment)

A complete full-stack mini project with:
- React frontend
- Node.js microservice backend
- SQLite database persistence
- API gateway for routing/auth forwarding
- Seeded sample users and books

## Architecture

- `frontend` (React + Vite, port `5173`)
- `backend/api-gateway` (Express gateway, port `8080`)
- `backend/auth-service` (Express + SQLite, port `4001`)
- `backend/catalog-service` (Express + SQLite, port `4002`)
- `backend/reservation-service` (Express + SQLite, port `4003`)

Flow:
1. Frontend calls gateway at `http://localhost:8080/api`
2. Gateway validates JWT for protected routes
3. Gateway proxies requests to microservices
4. Reservation service talks to catalog service for copy increment/decrement

## Features

- Login with role-based users (student/staff/admin)
- Browse/search books
- Reserve books (students/staff/admin)
- View reservations
- Approve/reject/mark return (staff/admin)
- Book availability auto-updated on reserve/return

## Sample Credentials

- Admin: `admin@elibrary.com` / `Admin@123`
- Staff: `staff@elibrary.com` / `Staff@123`
- Student: `student1@elibrary.com` / `Student@123`

## Quick Start

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Optional: reset databases:

```bash
npm run seed
```

3. Start all services:

```bash
npm run dev
```

4. Open frontend:

- `http://localhost:5173`

## API Endpoints (Gateway)

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- Books:
  - `GET /api/books`
  - `GET /api/books/:id`
  - `POST /api/books` (admin)
  - `PUT /api/books/:id` (admin)
  - `DELETE /api/books/:id` (admin)
- Reservations:
  - `GET /api/reservations` (authenticated)
  - `POST /api/reservations` (authenticated)
  - `PATCH /api/reservations/:id/status` (staff/admin)

## Submission Docs (in `docs/`)

- API (OpenAPI/Swagger): [docs/openapi.yaml](docs/openapi.yaml)
- API (Postman collection): [docs/postman_collection.json](docs/postman_collection.json)
- Architecture: [docs/architecture.md](docs/architecture.md), [docs/architecture-diagram.md](docs/architecture-diagram.md)
- Database schema + ER diagram: [docs/db-schema.md](docs/db-schema.md)
- Component hierarchy: [docs/component-hierarchy.md](docs/component-hierarchy.md)
- Wireframes: [docs/wireframes.md](docs/wireframes.md)
- Assumptions: [docs/assumptions.md](docs/assumptions.md)
- AI usage log + reflection: [docs/ai-usage-log.md](docs/ai-usage-log.md)
- Add your demo video Google Drive link to your final report.
