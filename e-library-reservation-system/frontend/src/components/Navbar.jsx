import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="brand">E-Library Reservation</div>
      <nav>
        <Link to="/">Books</Link>
        {user && <Link to="/reservations">Reservations</Link>}
      </nav>
      <div className="nav-user">
        {user ? (
          <>
            <span>{user.name} ({user.role})</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
