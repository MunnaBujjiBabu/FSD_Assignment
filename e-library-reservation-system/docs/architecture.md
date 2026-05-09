# Architecture Notes

## Services
- API Gateway: entry point, JWT auth check, request forwarding.
- Auth Service: user login/register and token-based identity.
- Catalog Service: book CRUD and stock (availability) management.
- Reservation Service: reservation lifecycle and status updates.

## Persistence
- SQLite databases:
  - `backend/data/auth.db`
  - `backend/data/catalog.db`
  - `backend/data/reservation.db`

## Inter-service Communication
- Reservation service calls catalog internal endpoints:
  - decrement copy on reservation creation
  - increment copy on reject/return

## Roles
- `student`: browse, reserve, view own reservations
- `staff`: all student actions + update reservation statuses
- `admin`: all staff actions + catalog CRUD
