# Frontend Component Hierarchy

```
<BrowserRouter>
  <App>
    ├── <Navbar user onLogout />
    └── <Routes>
        ├── "/"           → <BooksPage user>
        │                     └── <BookCard book onReserve canReserve />
        ├── "/login"      → <LoginPage onAuth />
        ├── "/reservations" (protected)
        │                  → <ProtectedRoute user>
        │                        └── <ReservationsPage user />
        └── "*"           → <Navigate to="/" />
```

## State Management
- Top-level `App` owns `user` (persisted to `localStorage`).
- Each page manages its own data fetching via `services/api.js`.
- JWT stored in `localStorage` and attached automatically by API client.

## Routing
- React Router v6 with `BrowserRouter`.
- Protected route HOC redirects unauthenticated users to `/login`.
