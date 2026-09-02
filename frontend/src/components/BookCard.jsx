function BookCard({ book }) {
  return (
    <div className="book-card">
      <img src={book.cover_url} alt={book.title} className="book-cover" />

      <div className="book-info">
        <h3>{book.title}</h3>

        <p>By {book.author}</p>

        <p>{book.description}</p>

        <div className="book-details">
          <span>📅 {book.published_year}</span>
          <span>⭐ {book.average_rating}</span>
        </div>
      </div>
    </div>
  );
}

export default BookCard;
