import { useEffect, useState } from 'react';
import { api } from '../services/api';

function ReservationsPage({ user }) {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getReservations();
      setReservations(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.updateReservationStatus(id, status);
      await loadReservations();
    } catch (e) {
      setError(e.message);
    }
  };

  const canManage = ['admin', 'staff'].includes((user?.role || '').toLowerCase());

  return (
    <section>
      <div className="page-header">
        <h2>Reservations</h2>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading reservations...</p>
      ) : reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Book</th>
                <th>User</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{reservation.id}</td>
                  <td>{reservation.book_title}</td>
                  <td>{reservation.user_name}</td>
                  <td>{reservation.start_date} to {reservation.end_date}</td>
                  <td>{reservation.status}</td>
                  <td>
                    {canManage ? (
                      <div className="action-buttons">
                        <button onClick={() => updateStatus(reservation.id, 'approved')}>Approve</button>
                        <button onClick={() => updateStatus(reservation.id, 'rejected')}>Reject</button>
                        <button onClick={() => updateStatus(reservation.id, 'returned')}>Mark Returned</button>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ReservationsPage;
