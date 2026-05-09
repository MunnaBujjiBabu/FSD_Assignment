function BookCard({ book, onReserve, canReserve }) {
  return (
    <article className="card">
      <h3>{book.title}</h3>
      <p><strong>Author:</strong> {book.author}</p>
      <p><strong>Genre:</strong> {book.genre}</p>
      <p><strong>ISBN:</strong> {book.isbn}</p>
      <p><strong>Available:</strong> {book.availableCopies}/{book.totalCopies}</p>
      <p className="muted">{book.summary}</p>
      {canReserve && (
        <button
          disabled={book.availableCopies <= 0}
          onClick={() => onReserve(book.id)}
        >
          Reserve
        </button>
      )}
    </article>
  );
}

export default BookCard;
