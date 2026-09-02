import { useState } from "react";

function Navbar({
  user,
  search,
  setSearch,
  onLogout,
  favorites = [],
  onLogin,
  onRegister,
}) {
  const [showFavorites, setShowFavorites] = useState(false);

  const getBookId = (favorite) => {
    return (
      favorite.book_id ?? favorite.bookId ?? favorite.book?.id ?? favorite.id
    );
  };

  const getTitle = (favorite) => {
    return favorite.title ?? favorite.book?.title ?? "Unknown Book";
  };

  const getAuthor = (favorite) => {
    return favorite.author ?? favorite.book?.author ?? "Unknown Author";
  };

  const getCover = (favorite) => {
    return favorite.cover_url ?? favorite.book?.cover_url ?? "";
  };

  return (
    <>
      <nav className="navbar">
        {/* LOGO */}
        <div className="navbar-logo">
          <span className="logo-icon">📚</span>
          <span>BookWise</span>
        </div>

        {/* SEARCH */}
        <div className="search-container">
          <span className="search-icon">🔍</span>

          <input
            type="text"
            placeholder="Search books, authors, genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="navbar-right">
          {/* ===============================
              LOGGED-IN USER
          =============================== */}

          {user ? (
            <>
              {/* FAVORITES */}

              <button
                type="button"
                className={`navbar-favorite-button ${
                  showFavorites ? "active" : ""
                }`}
                onClick={() => setShowFavorites((previous) => !previous)}
                title="My Favorites"
              >
                {favorites.length > 0 ? "♥" : "♡"}

                {favorites.length > 0 && (
                  <span className="favorite-count">{favorites.length}</span>
                )}
              </button>

              {/* USER */}

              <div className="user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <span className="user-name">{user?.name || "User"}</span>

              {/* LOGOUT */}

              <button
                type="button"
                className="logout-button"
                onClick={onLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* ===============================
                  PUBLIC USER
              =============================== */}

              <button
                type="button"
                className="nav-login-button"
                onClick={() => {
                  console.log("LOGIN BUTTON CLICKED");
                  onLogin?.();
                }}
              >
                Login
              </button>

              <button
                type="button"
                className="nav-register-button"
                onClick={() => {
                  console.log("REGISTER BUTTON CLICKED");
                  onRegister?.();
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* =====================================================
          FAVORITES PANEL
      ===================================================== */}

      {showFavorites && user && (
        <div className="favorites-panel">
          <div className="favorites-header">
            <div>
              <h2>My Favorites</h2>

              <span>
                {favorites.length} {favorites.length === 1 ? "book" : "books"}
              </span>
            </div>

            <button type="button" onClick={() => setShowFavorites(false)}>
              ✕
            </button>
          </div>

          {/* EMPTY */}

          {favorites.length === 0 ? (
            <div className="favorites-empty">
              <div className="favorites-empty-icon">♡</div>

              <h3>No favorite books</h3>

              <p>Click ♡ on a book to add it to your favorites.</p>
            </div>
          ) : (
            <div className="favorites-list">
              {favorites.map((favorite, index) => {
                const bookId = getBookId(favorite);
                const title = getTitle(favorite);
                const author = getAuthor(favorite);
                const cover = getCover(favorite);

                return (
                  <div
                    className="favorite-item"
                    key={bookId ?? `favorite-${index}`}
                  >
                    {/* COVER */}

                    {cover ? (
                      <img
                        src={cover}
                        alt={title}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="favorite-no-cover">📖</div>
                    )}

                    {/* INFO */}

                    <div className="favorite-item-info">
                      <h4>{title}</h4>
                      <p>{author}</p>
                    </div>

                    <span className="favorite-heart">♥</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Navbar;
