# 4. Problem Statement & Design

## 4.1 Title

**E-Library Reservation System** — a campus-friendly portal for browsing, reserving, and tracking library books with role-based control.

## 4.2 Why This Problem (User-Centric Motivation)

Most small libraries (school, college, club, community) still use spreadsheets or paper logs to track book lending. This causes:
- **Lost or duplicate reservations** (no overlap protection).
- **No visibility** into what is currently available.
- **Manual approval bottleneck** because there is no shared digital workflow.
- **No audit trail** of who borrowed what and when.

A focused web app solves this with three clear personas — **Student**, **Staff**, **Admin** — each with the minimum permissions required.

## 4.3 Personas & Goals

| Persona | Goal                                                                 |
|---------|----------------------------------------------------------------------|
| Student | Find an available book quickly and reserve it for a date range.      |
| Staff   | Approve/reject reservations, mark returns, keep stock accurate.      |
| Admin   | Curate the catalog (add, edit, remove books) and manage everything.  |

## 4.4 Why It’s Innovative / Interesting (vs. trivial CRUD)

1. **Microservice decomposition** — Auth, Catalog, and Reservation are independently runnable services with their own DBs (not one monolith).
2. **API gateway** as a single auth choke-point — services stay decoupled from the JWT library.
3. **Cross-service stock invariant** — reservation service mutates catalog stock through an internal, key-protected endpoint to prevent inconsistencies.
4. **Role-aware data scoping** — students only see their own reservations, while staff/admin see all.
5. **Denormalized snapshots** (`book_title`, `user_name`) inside reservations reduce cross-service joins for the dashboard view, a real-world trade-off.
6. **Self-seeding services** — first run auto-creates schemas and demo data for instant grading/demo.

## 4.5 Key Design Decisions

| Decision                                                         | Reason |
|------------------------------------------------------------------|--------|
| SQLite per service                                               | Simple, file-based, demonstrates DB-per-service principle without infra overhead. |
| JWT verified only at gateway, forwarded as `x-user-*` headers    | Keeps services dependency-light and easy to test. |
| Internal `SERVICE_KEY` for catalog `internal/*` endpoints        | Prevents browsers/external callers from mutating stock without admin credentials. |
| Stock decrement on reservation create, increment on reject/return | Models real-world inventory simply, avoids per-day calendar complexity. |
| `availableOnly` and `search` query params on `/books`            | Better UX without needing client-side filtering. |
| React Router with a `ProtectedRoute` HOC                          | Clean separation of public vs. authenticated pages. |
| Demo credentials surfaced on the Login screen                     | Smoother grading/demo experience. |

## 4.6 In-Scope vs. Out-of-Scope

**In scope (MVP):**
- Login + role-based UI
- Browse / search books
- Reserve, approve, reject, mark returned
- Catalog CRUD via API
- Sample data seed

**Deliberately out of scope** (kept simple per assignment scope):
- Email notifications, password reset, refresh tokens
- Per-day calendar bookings (we use copy-availability instead)
- Multi-tenant / multi-library
- Production-grade observability

## 4.7 Mapped to Assignment’s Sample Equipment-Lending Categories

| Sample Feature                | E-Library Equivalent                          |
|--------------------------------|------------------------------------------------|
| User auth & roles              | Same — student / staff / admin                 |
| Equipment management           | Book catalog management                        |
| Borrowing & return             | Reserve, approve, mark returned                |
| Dashboard listing & search     | Books page with search + availability filter   |
| Responsive React frontend      | Vite + React + responsive CSS grid             |

## 4.8 Future Extensions (Discussion / Demo Talking Points)

- Per-day reservation calendar with overlap prevention.
- Notifications on approval/return.
- Penalty / late-fee tracking.
- Pagination and faceted search.
- Containerization (Docker Compose) and CI/CD pipeline.
