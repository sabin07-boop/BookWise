import { useEffect, useState } from "react";
import "./App.css";

import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";

const API_URL = "http://localhost:3000";

// =====================================================
// IMAGE URL HELPER
// =====================================================

function getImageCandidates(coverUrl) {
  if (!coverUrl) return [];

  const value = String(coverUrl).trim();

  if (!value) return [];

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return [value];
  }

  const cleanValue = value.replace(/^\/+/, "");

  return [
    value,
    `/${cleanValue}`,
    `/images/${cleanValue}`,
    `/frontend/images/${cleanValue}`,
    `${API_URL}/images/${cleanValue}`,
    `${API_URL}/frontend/images/${cleanValue}`,
  ];
}

// =====================================================
// BOOK COVER
// =====================================================

function BookCover({ book, className = "book-cover" }) {
  const candidates = getImageCandidates(book?.cover_url);

  const [imageIndex, setImageIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImageIndex(0);
    setFailed(false);
  }, [book?.cover_url]);

  const image = candidates[imageIndex];

  const handleError = () => {
    if (imageIndex < candidates.length - 1) {
      setImageIndex((index) => index + 1);
    } else {
      setFailed(true);
    }
  };

  if (!image || failed) {
    return (
      <div className="no-cover">
        <span>📖</span>
        <small>No Cover</small>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={book?.title || "Book"}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}

// =====================================================
// BOOK CARD
// =====================================================

function BookCard({ book, isFavorite, onFavoriteChange }) {
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleFavorite = async () => {
    if (favoriteLoading) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    const bookId = Number(book.id);

    if (!Number.isFinite(bookId)) {
      console.error("Invalid book ID:", book.id);

      alert("Invalid book ID.");
      return;
    }

    setFavoriteLoading(true);

    try {
      // =================================================
      // REMOVE FAVORITE
      // =================================================

      if (isFavorite) {
        console.log("REMOVING FAVORITE:", bookId);

        const response = await fetch(`${API_URL}/api/favorites/${bookId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        console.log("DELETE RESPONSE:", response.status, data);

        // ---------------------------------------------
        // TOKEN EXPIRED
        // ---------------------------------------------

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          window.location.reload();

          return;
        }

        // ---------------------------------------------
        // DELETE ERROR
        // ---------------------------------------------

        if (!response.ok) {
          throw new Error(
            typeof data === "object"
              ? data.error || data.message || "Could not remove favorite."
              : data || "Could not remove favorite.",
          );
        }

        // ---------------------------------------------
        // UPDATE FRONTEND
        // ---------------------------------------------

        onFavoriteChange(book, "remove");

        return;
      }

      // =================================================
      // ADD FAVORITE
      // =================================================

      console.log("ADDING FAVORITE:", bookId);

      const response = await fetch(`${API_URL}/api/favorites`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          book_id: bookId,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      console.log("POST RESPONSE:", response.status, data);

      // ---------------------------------------------
      // TOKEN EXPIRED
      // ---------------------------------------------

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        window.location.reload();

        return;
      }

      // ---------------------------------------------
      // ALREADY FAVORITE
      // ---------------------------------------------

      if (response.status === 409) {
        console.log("Book already exists in favorites.");

        // IMPORTANT:
        // Synchronize React with database.
        onFavoriteChange(book, "add");

        return;
      }

      // ---------------------------------------------
      // OTHER ERROR
      // ---------------------------------------------

      if (!response.ok) {
        throw new Error(
          typeof data === "object"
            ? data.error || data.message || "Could not add favorite."
            : data || "Could not add favorite.",
        );
      }

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      onFavoriteChange(book, "add");
    } catch (error) {
      console.error("Favorite error:", error);

      alert(error.message || "Could not update favorite.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="book-card">
      {/* COVER */}

      <div className="cover-container">
        <BookCover book={book} />

        {/* FAVORITE BUTTON */}

        <button
          type="button"
          className={`favorite-button ${isFavorite ? "active" : ""}`}
          onClick={handleFavorite}
          disabled={favoriteLoading}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {favoriteLoading ? "..." : isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* BOOK INFORMATION */}

      <div className="book-info">
        <h3>{book.title}</h3>

        <p className="author">{book.author || "Unknown Author"}</p>

        {book.average_rating !== null &&
          book.average_rating !== undefined &&
          book.average_rating !== "" && (
            <div className="rating">
              ⭐ {Number(book.average_rating).toFixed(1)}
            </div>
          )}

        {book.published_year && <p className="year">{book.published_year}</p>}
      </div>
    </div>
  );
}

// =====================================================
// BOOK ROW
// =====================================================

function BookRow({ title, books, favoriteIds, onFavoriteChange }) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="book-section">
      <div className="section-header">
        <h2>{title}</h2>

        <span>{books.length} books</span>
      </div>

      <div className="book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            isFavorite={favoriteIds.has(Number(book.id))}
            onFavoriteChange={onFavoriteChange}
          />
        ))}
      </div>
    </section>
  );
}

// =====================================================
// MAIN APP
// =====================================================

function App() {
  // ===================================================
  // USER
  // ===================================================

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");

      return null;
    }
  });

  const [authPage, setAuthPage] = useState("login");

  // ===================================================
  // BOOKS
  // ===================================================

  const [books, setBooks] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ===================================================
  // FAVORITES
  // ===================================================

  const [favorites, setFavorites] = useState([]);

  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // ===================================================
  // FETCH BOOKS
  // ===================================================

  useEffect(() => {
    if (!user) return;

    const fetchBooks = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/books`);

        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }

        const data = await response.json();

        const booksData = Array.isArray(data)
          ? data
          : Array.isArray(data.books)
            ? data.books
            : [];

        setBooks(booksData);

        console.log("BOOKS:", booksData);
      } catch (error) {
        console.error(error);

        setError("Could not load books.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  // ===================================================
  // FETCH FAVORITES FROM DATABASE
  // ===================================================

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        console.log("LOADING FAVORITES...");

        const response = await fetch(`${API_URL}/api/favorites`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // -------------------------------------------
        // TOKEN EXPIRED
        // -------------------------------------------

        if (response.status === 401) {
          console.log("Favorite token expired.");

          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load favorites");
        }

        const data = await response.json();

        console.log("FAVORITES FROM DATABASE:", data);

        // -------------------------------------------
        // GET FAVORITE ARRAY
        // -------------------------------------------

        const favoriteData = Array.isArray(data)
          ? data
          : Array.isArray(data.favorites)
            ? data.favorites
            : [];

        // -------------------------------------------
        // STORE COMPLETE FAVORITES
        // -------------------------------------------

        setFavorites(favoriteData);

        // -------------------------------------------
        // CREATE FAVORITE ID SET
        // -------------------------------------------

        const ids = new Set();

        favoriteData.forEach((favorite) => {
          const id = Number(
            favorite.book_id ??
              favorite.bookId ??
              favorite.book?.id ??
              favorite.id,
          );

          if (Number.isFinite(id)) {
            ids.add(id);
          }
        });

        console.log("FAVORITE IDS FROM DATABASE:", [...ids]);

        setFavoriteIds(ids);
      } catch (error) {
        console.error("Favorite loading error:", error);
      }
    };

    fetchFavorites();
  }, [user]);

  // ===================================================
  // FAVORITE CHANGE
  // ===================================================

  const handleFavoriteChange = (book, action) => {
    const bookId = Number(book.id);

    console.log("FAVORITE CHANGE:", bookId, action);

    // =================================================
    // ADD
    // =================================================

    if (action === "add") {
      // -----------------------------------------------
      // ADD ID
      // -----------------------------------------------

      setFavoriteIds((previous) => {
        const next = new Set(previous);

        next.add(bookId);

        console.log("NEW FAVORITE IDS:", [...next]);

        return next;
      });

      // -----------------------------------------------
      // ADD BOOK
      // -----------------------------------------------

      setFavorites((previous) => {
        const exists = previous.some(
          (favorite) =>
            Number(
              favorite.book_id ??
                favorite.bookId ??
                favorite.book?.id ??
                favorite.id,
            ) === bookId,
        );

        if (exists) {
          return previous;
        }

        return [
          ...previous,

          {
            ...book,
            book_id: bookId,
          },
        ];
      });

      return;
    }

    // =================================================
    // REMOVE
    // =================================================

    if (action === "remove") {
      // -----------------------------------------------
      // REMOVE ID
      // -----------------------------------------------

      setFavoriteIds((previous) => {
        const next = new Set(previous);

        next.delete(bookId);

        console.log("AFTER REMOVE:", [...next]);

        return next;
      });

      // -----------------------------------------------
      // REMOVE BOOK
      // -----------------------------------------------

      setFavorites((previous) =>
        previous.filter(
          (favorite) =>
            Number(
              favorite.book_id ??
                favorite.bookId ??
                favorite.book?.id ??
                favorite.id,
            ) !== bookId,
        ),
      );
    }
  };

  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const handleRegister = (registeredUser) => {
    setUser(registeredUser);
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("refreshToken");

    localStorage.removeItem("user");

    setUser(null);

    setBooks([]);

    setFavorites([]);

    setFavoriteIds(new Set());

    setSearch("");
  };

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredBooks = books.filter((book) => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return true;
    }

    const title = book.title?.toLowerCase() || "";

    const author = book.author?.toLowerCase() || "";

    const genre = book.genre?.toLowerCase() || "";

    return (
      title.includes(searchTerm) ||
      author.includes(searchTerm) ||
      genre.includes(searchTerm)
    );
  });

  // ===================================================
  // GENRE FILTER
  // ===================================================

  const getGenreBooks = (genre) => {
    return filteredBooks.filter((book) => {
      const bookGenre = book.genre?.toLowerCase() || "";

      return bookGenre.includes(genre.toLowerCase());
    });
  };

  // ===================================================
  // POPULAR BOOKS
  // ===================================================

  const popularBooks = [...filteredBooks]
    .sort(
      (a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0),
    )
    .slice(0, 10);

  // ===================================================
  // AUTH SCREEN
  // ===================================================

  if (!user) {
    if (authPage === "login") {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthPage("register")}
        />
      );
    }

    return (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthPage("login")}
      />
    );
  }

  // ===================================================
  // MAIN APP
  // ===================================================

  return (
    <div className="app">
      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar
        user={user}
        search={search}
        setSearch={setSearch}
        onLogout={handleLogout}
        favorites={favorites}
      />

      <main>
        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero">
          <div className="hero-content">
            <p className="hero-label">YOUR NEXT GREAT READ</p>

            <h1>
              Discover your
              <br />
              next favorite book.
            </h1>

            <p className="hero-description">
              Explore hundreds of books, discover new authors, and find stories
              you'll love.
            </p>

            <button
              className="explore-button"
              onClick={() =>
                document.getElementById("book-catalog")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Explore Books ↓
            </button>
          </div>

          {/* HERO BOOKS */}

          <div className="hero-books">
            {books
              .filter((book) => book.cover_url)
              .slice(0, 3)
              .map((book, index) => (
                <BookCover
                  key={book.id}
                  book={book}
                  className={`hero-cover hero-cover-${index}`}
                />
              ))}
          </div>
        </section>

        {/* =================================================
            SEARCH RESULTS
        ================================================= */}

        {search && (
          <section className="search-results">
            <div className="section-header">
              <h2>Search results for "{search}"</h2>

              <span>{filteredBooks.length} found</span>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="empty-state">
                <div>📚</div>

                <h3>No books found</h3>

                <p>Try another title, author, or genre.</p>
              </div>
            ) : (
              <div className="book-grid">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFavorite={favoriteIds.has(Number(book.id))}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>

            <p>Loading your books...</p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && <div className="error-message">{error}</div>}

        {/* =================================================
            CATALOG
        ================================================= */}

        {!loading && !error && !search && (
          <div id="book-catalog">
            {/* POPULAR */}

            <BookRow
              title="Popular Books"
              books={popularBooks}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* FICTION */}

            <BookRow
              title="Fiction"
              books={getGenreBooks("Fiction")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* FANTASY */}

            <BookRow
              title="Fantasy"
              books={getGenreBooks("Fantasy")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* SCIENCE FICTION */}

            <BookRow
              title="Science Fiction"
              books={getGenreBooks("Science Fiction")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* MYSTERY */}

            <BookRow
              title="Mystery"
              books={getGenreBooks("Mystery")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* TECHNOLOGY */}

            <BookRow
              title="Technology"
              books={getGenreBooks("Technology")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* SELF HELP */}

            <BookRow
              title="Self-Help"
              books={getGenreBooks("Self-Help")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* ROMANCE */}

            <BookRow
              title="Romance"
              books={getGenreBooks("Romance")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* BIOGRAPHY */}

            <BookRow
              title="Biography"
              books={getGenreBooks("Biography")}
              favoriteIds={favoriteIds}
              onFavoriteChange={handleFavoriteChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
