import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';
import ReservationsPage from './pages/ReservationsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="content">
        <Routes>
          <Route path="/" element={<BooksPage user={user} />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onAuth={setUser} />}
          />
          <Route
            path="/reservations"
            element={
              <ProtectedRoute user={user}>
                <ReservationsPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
