import { useEffect, useState } from 'react';
import { api } from '../services/api';
import BookCard from '../components/BookCard';

function BooksPage({ user }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const query = search ? `search=${encodeURIComponent(search)}` : '';
      const result = await api.getBooks(query);
      setBooks(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const reserveBook = async (bookId) => {
    if (!user) {
      setError('Please login to reserve books.');
      return;
    }

    setError('');
    setMessage('');
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    try {
      await api.createReservation({
        bookId,
        startDate: today.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      });
      setMessage('Reservation requested successfully.');
      await loadBooks();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h2>Books Catalog</h2>
        <div className="search-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author"
          />
          <button onClick={loadBooks}>Search</button>
        </div>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onReserve={reserveBook}
              canReserve={Boolean(user)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BooksPage;
