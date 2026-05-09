import { useState } from 'react';
import { api } from '../services/api';

const DEMO_USERS = [
  { role: 'Admin', email: 'admin@elibrary.com', password: 'Admin@123' },
  { role: 'Staff', email: 'staff@elibrary.com', password: 'Staff@123' },
  { role: 'Student', email: 'student1@elibrary.com', password: 'Student@123' },
];

function LoginPage({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login(form);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onAuth(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-box">
      <h2>Login</h2>
      <p className="muted">Use one of the demo users below.</p>
      <div className="demo-box">
        {DEMO_USERS.map((user) => (
          <div key={user.email} className="demo-row">
            <span>{user.role}</span>
            <code>{user.email}</code>
            <code>{user.password}</code>
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default LoginPage;
