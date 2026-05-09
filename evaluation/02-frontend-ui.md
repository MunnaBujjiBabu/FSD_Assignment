# 2. Frontend UI — Navigation & Interactivity

## 2.1 Stack & Structure

- **React 18** with **Vite** dev server
- **React Router v6** for client-side routing
- Plain CSS (custom design tokens) for responsive layout
- Modular components and pages

Source: [`frontend/src/`](../e-library-reservation-system/frontend/src)

```
src/
├── App.jsx              # Routes + auth state
├── main.jsx             # Root + BrowserRouter
├── styles.css           # Theme + responsive grid
├── components/
│   ├── Navbar.jsx       # Top navigation, user info, logout
│   ├── BookCard.jsx     # Reusable card with reserve button
│   └── ProtectedRoute.jsx
├── pages/
│   ├── LoginPage.jsx    # Demo creds + form + token storage
│   ├── BooksPage.jsx    # Catalog + search + reserve flow
│   └── ReservationsPage.jsx # Table + status actions
└── services/api.js      # Centralized API client
```

Component hierarchy: [`docs/component-hierarchy.md`](../e-library-reservation-system/docs/component-hierarchy.md)

## 2.2 Navigation

- `BrowserRouter` with declarative `<Routes>`.
- Routes:
  - `/` → Books (public)
  - `/login` → Login (auto-redirect to `/` if already authenticated)
  - `/reservations` → Reservations (wrapped by `ProtectedRoute`)
  - `*` → fallback redirect to `/`
- `<Navbar>` switches links based on `user` (Login vs. Logout).
- Programmatic navigation after logout via `useNavigate()`.

## 2.3 Interactivity

| Interaction                           | Where                       |
|---------------------------------------|------------------------------|
| Login form with inline error message  | `LoginPage.jsx`              |
| Search books by title/author          | `BooksPage.jsx`              |
| Reserve button (disabled when 0 copies) | `BookCard.jsx`             |
| Optimistic refresh after reserve      | `BooksPage.loadBooks()`      |
| Approve / Reject / Mark Returned      | `ReservationsPage.jsx`       |
| Token persistence across reloads      | `App.jsx` + `localStorage`   |
| Loading and error UI states           | All pages                    |

## 2.4 State Management

- **Top-level user state** in `App.jsx`, persisted to `localStorage`.
- **Per-page state** for fetched data, loading flags, and error messages.
- **Centralized fetch wrapper** in `services/api.js` automatically attaches the JWT.

```js
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
```

## 2.5 Responsiveness

- CSS grid auto-fills book cards (`repeat(auto-fill, minmax(250px, 1fr))`).
- Mobile breakpoint at `768px` collapses navbar and demo-creds layout.
- Form controls use generous touch targets and clear focus states.

## 2.6 Accessibility & UX Details

- Labels associated with inputs via `htmlFor`/`id`.
- Buttons disable while loading to prevent double-submit.
- Inline success and error banners using semantic colors.
- Demo accounts visibly listed on login screen for easy grading/demo.

## 2.7 Wireframes

See [`docs/wireframes.md`](../e-library-reservation-system/docs/wireframes.md) for text-based wireframes of Login, Books, and Reservations pages.
