# Assumptions

- Single-campus deployment; horizontal scaling not required for the assignment scope.
- SQLite is acceptable per service for demo purposes. In production, each service would use its own dedicated DB engine (e.g., PostgreSQL).
- Authentication uses simulated JWT; password reset, email verification, and refresh tokens are out of scope.
- Reservations are simple date-range requests; overlap prevention is enforced through copy-availability decrement (no per-day calendar lock).
- Roles: `student`, `staff`, `admin`. Only admin can manage catalog; staff/admin can update reservation status.
- Frontend talks only to the API Gateway (`http://localhost:8080`), never directly to microservices.
- Internal microservice-to-microservice calls use a shared static `SERVICE_KEY`. In production, mTLS or signed service tokens would be used.
