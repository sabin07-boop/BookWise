import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getToken = () => {
  return localStorage.getItem("token");
};

const formatDate = (date) => {
  if (!date) return "Recently";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getBookIdentifier = (book) => {
  if (!book) return null;

  if (book.id !== null && book.id !== undefined && book.id !== "") {
    return String(book.id);
  }

  if (book.google_book_id) {
    return String(book.google_book_id);
  }

  if (book.google_id) {
    return String(book.google_id);
  }

  return null;
};

/* ======================================================
   BOOK CARD
====================================================== */

function BookCard({ book, isFavorite, onFavorite, onOpen }) {
  const openBook = (event) => {
    event?.stopPropagation();
    onOpen(book);
  };

  return (
    <article
      className="book-card"
      onClick={openBook}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBook(event);
        }
      }}
      tabIndex={0}
    >
      <div className="book-cover-wrapper">
        <img
          src={
            book.cover_url ||
            "https://via.placeholder.com/300x450?text=No+Cover"
          }
          alt={book.title || "Book cover"}
          className="book-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              "https://via.placeholder.com/300x450?text=No+Cover";
          }}
        />

        <div className="book-overlay">
          <span>View Details</span>
        </div>
      </div>

      <div className="book-info">
        <h3 title={book.title}>{book.title}</h3>

        <p className="book-author">{book.author || "Unknown Author"}</p>

        <div className="book-bottom">
          <span className="book-rating">
            ⭐{" "}
            {book.average_rating !== null && book.average_rating !== undefined
              ? Number(book.average_rating).toFixed(1)
              : "0.0"}
          </span>

          <div className="book-actions">
            <button
              type="button"
              className="rate-comment-btn"
              onClick={openBook}
            >
              ⭐ Rate & Comment
            </button>

            <button
              type="button"
              className={`favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                onFavorite(book);
              }}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ======================================================
   BOOK CAROUSEL
====================================================== */

function BookCarousel({
  title,
  subtitle,
  books,
  favorites,
  onFavorite,
  onOpen,
  loading,
}) {
  const scrollRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleBooks = useMemo(() => (books || []).slice(0, 20), [books]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;

    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);

    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();

    const el = scrollRef.current;

    if (!el) return;

    const handleResize = () => {
      updateScrollButtons();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [visibleBooks.length]);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;

    if (!el) return;

    const cardWidth = el.querySelector(".book-card")?.offsetWidth || 220;

    el.scrollBy({
      left: direction * (cardWidth * 2 + 40),
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="book-section">
        <div className="section-header">
          <div>
            <h2>{title}</h2>

            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <p className="loading-text">Loading...</p>
      </section>
    );
  }

  if (!visibleBooks.length) {
    return null;
  }

  return (
    <section className="book-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>

          {subtitle && <p>{subtitle}</p>}
        </div>

        <span className="book-count">{visibleBooks.length} books</span>
      </div>

      <div className="book-carousel-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="scroll-arrow scroll-arrow-left"
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}

        <div
          className="book-carousel"
          ref={scrollRef}
          onScroll={updateScrollButtons}
        >
          {visibleBooks.map((book, index) => {
            const identifier = getBookIdentifier(book);

            const key =
              identifier ||
              book.google_book_id ||
              book.google_id ||
              `${book.title || "book"}-${index}`;

            return (
              <BookCard
                key={key}
                book={book}
                isFavorite={identifier ? favorites.has(identifier) : false}
                onFavorite={onFavorite}
                onOpen={onOpen}
              />
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="scroll-arrow scroll-arrow-right"
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll right"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}

/* ======================================================
   BOOK GRID
====================================================== */

function BookGrid({ title, books, favorites, onFavorite, onOpen }) {
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="book-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>Discover books you may enjoy</p>
        </div>

        <span className="book-count">{books.length} books</span>
      </div>

      <div className="book-grid">
        {books.map((book, index) => {
          const identifier = getBookIdentifier(book);

          const key =
            identifier ||
            book.google_book_id ||
            book.google_id ||
            `${book.title || "book"}-${index}`;

          return (
            <BookCard
              key={key}
              book={book}
              isFavorite={identifier ? favorites.has(identifier) : false}
              onFavorite={onFavorite}
              onOpen={onOpen}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ======================================================
   BOOK DETAIL MODAL / FULL BOOK PAGE

   IMPORTANT:
   The OUTER overlay is the scrolling element.
   Therefore overlayRef is attached to the outer div.
====================================================== */

function BookDetailModal({
  book,
  onClose,
  isFavorite,
  onFavorite,
  token,
  onLoginRequired,
  favorites,
  onOpenBook,
  fullPage = false,
}) {
  const bookIdentifier = getBookIdentifier(book);

  const isDatabaseBook = Boolean(bookIdentifier);

  /*
   * IMPORTANT:
   * This ref is attached to .book-modal-overlay.
   * That is the element with overflowY: auto.
   */
  const overlayRef = useRef(null);

  const [similarBooks, setSimilarBooks] = useState([]);

  const [loadingSimilar, setLoadingSimilar] = useState(false);

  /* ====================================================
     SCROLL TO TOP WHEN BOOK CHANGES
  ==================================================== */

  useEffect(() => {
    /*
     * Wait until React has rendered the new book.
     * This is especially important when clicking
     * "You Might Also Like".
     */
    const scrollToTop = () => {
      const overlay = overlayRef.current;

      if (overlay) {
        overlay.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });
      }

      /*
       * Also reset normal document scrolling.
       */
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      /*
       * Some browsers keep scrollTop on html/body.
       */
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    /*
     * Run immediately.
     */
    scrollToTop();

    /*
     * Run again after the new DOM has painted.
     */
    const frame = requestAnimationFrame(() => {
      scrollToTop();
    });

    /*
     * Extra safety for image/layout rendering.
     */
    const timer = setTimeout(() => {
      scrollToTop();
    }, 50);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [bookIdentifier]);

  /* ====================================================
     LOAD SIMILAR BOOKS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) {
      setSimilarBooks([]);
      return;
    }

    let cancelled = false;

    const loadSimilar = async () => {
      try {
        setLoadingSimilar(true);

        const response = await fetch(
          `${API_URL}/api/books/${bookIdentifier}/similar`,
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setSimilarBooks(
            Array.isArray(data.similar_books) ? data.similar_books : [],
          );
        }
      } catch (error) {
        console.error("Similar books loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingSimilar(false);
        }
      }
    };

    loadSimilar();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier]);

  const [ratings, setRatings] = useState(null);

  const [comments, setComments] = useState([]);

  const [selectedRating, setSelectedRating] = useState(0);

  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);

  const [editingCommentText, setEditingCommentText] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);

  const [loadingRatings, setLoadingRatings] = useState(isDatabaseBook);

  const [loadingComments, setLoadingComments] = useState(isDatabaseBook);

  const [savingRating, setSavingRating] = useState(false);

  const [savingComment, setSavingComment] = useState(false);

  const [message, setMessage] = useState("");

  /* ====================================================
     LOAD RATINGS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) return;

    let cancelled = false;

    const loadRatings = async () => {
      try {
        setLoadingRatings(true);

        const response = await fetch(
          `${API_URL}/api/ratings/${bookIdentifier}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setRatings(data);

          if (data.user_rating !== null && data.user_rating !== undefined) {
            setSelectedRating(Number(data.user_rating));
          } else {
            setSelectedRating(0);
          }
        }
      } catch (error) {
        console.error("Ratings loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingRatings(false);
        }
      }
    };

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier, token]);

  /* ====================================================
     LOAD COMMENTS
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier) return;

    let cancelled = false;

    const loadComments = async () => {
      try {
        setLoadingComments(true);

        const response = await fetch(
          `${API_URL}/api/comments/${bookIdentifier}`,
        );

        const data = await response.json();

        if (!cancelled && response.ok) {
          setComments(Array.isArray(data) ? data : data.comments || []);
        }
      } catch (error) {
        console.error("Comments loading error:", error);
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [bookIdentifier]);

  /* ====================================================
     READING HISTORY
  ==================================================== */

  useEffect(() => {
    if (!bookIdentifier || !token) return;

    fetch(`${API_URL}/api/reading-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        book_id: bookIdentifier,
      }),
    }).catch((error) => {
      console.error("Reading history error:", error);
    });
  }, [bookIdentifier, token]);

  /* ====================================================
     RATING
  ==================================================== */

  const handleRating = async (rating) => {
    if (!token) {
      onLoginRequired();
      return;
    }

    if (!bookIdentifier) {
      setMessage("This book isn't in our library yet, so it can't be rated.");
      return;
    }

    try {
      setSavingRating(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: bookIdentifier,
          rating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save rating");
      }

      setSelectedRating(rating);

      setRatings((previous) => ({
        ...(previous || {}),
        average_rating: data.average_rating ?? previous?.average_rating,
        total_ratings: data.total_ratings ?? previous?.total_ratings,
      }));

      setMessage("Rating saved successfully.");
    } catch (error) {
      console.error("Rating error:", error);
      setMessage(error.message);
    } finally {
      setSavingRating(false);
    }
  };

  /* ====================================================
     ADD COMMENT
  ==================================================== */

  const handleComment = async (event) => {
    event.preventDefault();

    if (!token) {
      onLoginRequired();
      return;
    }

    if (!bookIdentifier) {
      setMessage(
        "This book isn't in our library yet, so it can't be commented on.",
      );
      return;
    }

    const cleanComment = commentText.trim();

    if (!cleanComment) {
      setMessage("Please write a comment.");
      return;
    }

    try {
      setSavingComment(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: bookIdentifier,
          comment: cleanComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      const newComment = data.comment || data;

      setComments((previous) => [newComment, ...previous]);

      setCommentText("");

      setMessage("Comment added successfully.");
    } catch (error) {
      console.error("Comment error:", error);
      setMessage(error.message);
    } finally {
      setSavingComment(false);
    }
  };

  /* ====================================================
     UPDATE COMMENT
  ==================================================== */

  const handleUpdateComment = async (commentId) => {
    if (!token) {
      onLoginRequired();
      return;
    }

    const cleanComment = editingCommentText.trim();

    if (!cleanComment) {
      setMessage("Please write a comment.");
      return;
    }

    try {
      setSavingEdit(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: cleanComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update comment");
      }

      const updatedComment = data.comment || data;

      setComments((previous) =>
        previous.map((comment) =>
          Number(comment.id) === Number(commentId)
            ? {
                ...comment,
                ...updatedComment,
                comment: updatedComment.comment || cleanComment,
              }
            : comment,
        ),
      );

      setEditingCommentId(null);
      setEditingCommentText("");

      setMessage("Comment updated successfully.");
    } catch (error) {
      console.error("Update comment error:", error);

      setMessage(error.message);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ====================================================
     DELETE COMMENT
  ==================================================== */

  const handleDeleteComment = async (commentId) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }

      setComments((previous) =>
        previous.filter((comment) => Number(comment.id) !== Number(commentId)),
      );

      setMessage("Comment deleted.");
    } catch (error) {
      console.error("Delete comment error:", error);

      setMessage(error.message);
    }
  };

  /* ====================================================
     ESCAPE KEY
  ==================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!book) return null;

  const currentUser = getStoredUser();

  return (
    <div
      /*
       * IMPORTANT:
       * This is the actual scrolling element.
       */
      ref={overlayRef}
      className={
        fullPage ? "book-modal-overlay book-page-overlay" : "book-modal-overlay"
      }
      style={
        fullPage
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              padding: 0,
              overflowY: "auto",
              overflowX: "hidden",
              background: `linear-gradient(
                135deg,
                rgba(5,8,18,.97),
                rgba(18,25,45,.94)
              ), url(${book.cover_url || ""}) center/cover fixed`,
            }
          : undefined
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={
          fullPage ? "book-detail-modal book-page-modal" : "book-detail-modal"
        }
        style={
          fullPage
            ? {
                width: "min(1180px, 100%)",
                maxWidth: "1180px",
                minHeight: "100vh",
                margin: "0 auto",
                borderRadius: 0,
                background: "#f8fafc",
                boxShadow: "none",
              }
            : undefined
        }
        role="dialog"
        aria-modal="true"
      >
        {fullPage && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "sticky",
              top: 16,
              left: 20,
              zIndex: 30,
              margin: "16px 0 0 20px",
              padding: "10px 16px",
              border: "1px solid #dbe2ea",
              borderRadius: 999,
              background: "rgba(255,255,255,.94)",
              color: "#111827",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Back to Books
          </button>
        )}

        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* BOOK HEADER */}

        <div className="book-detail-header">
          <div className="book-detail-cover">
            <img
              src={
                book.cover_url ||
                "https://via.placeholder.com/300x450?text=No+Cover"
              }
              alt={book.title}
              onError={(event) => {
                event.currentTarget.src =
                  "https://via.placeholder.com/300x450?text=No+Cover";
              }}
            />
          </div>

          <div className="book-detail-info">
            <span className="detail-badge">BOOK DETAILS</span>

            <h1>{book.title}</h1>

            <p className="detail-author">
              by {book.author || "Unknown Author"}
            </p>

            {book.published_year && (
              <p className="published-text">Published: {book.published_year}</p>
            )}

            <div className="detail-rating">
              ⭐{" "}
              {book.average_rating
                ? Number(book.average_rating).toFixed(1)
                : "0.0"}
              {ratings?.total_ratings !== undefined && (
                <span> ({ratings.total_ratings} ratings)</span>
              )}
            </div>

            <button
              type="button"
              className={`detail-favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={() => onFavorite(book)}
              disabled={!isDatabaseBook}
              title={
                isDatabaseBook
                  ? undefined
                  : "This book isn't in our library yet, so it can't be favorited."
              }
            >
              {!isDatabaseBook
                ? "♡ Not in Library"
                : isFavorite
                  ? "♥ Remove from Favorites"
                  : "♡ Add to Favorites"}
            </button>
          </div>
        </div>

        {/* DESCRIPTION */}

        <section className="book-description">
          <h2>About This Book</h2>

          <p>{book.description || "No description available for this book."}</p>
        </section>

        {/* RATINGS */}

        <section className="ratings-area">
          <div className="section-title-row">
            <div>
              <h2>Rate This Book</h2>

              <p>
                {!isDatabaseBook
                  ? "This book isn't in our library yet, so it can't be rated."
                  : token
                    ? "Choose a rating from 1 to 5 stars."
                    : "Login to rate this book."}
              </p>
            </div>
          </div>

          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={star <= selectedRating ? "selected" : ""}
                onClick={() => handleRating(star)}
                disabled={savingRating || !isDatabaseBook}
                aria-label={`Rate ${star} out of 5`}
              >
                ★
              </button>
            ))}
          </div>

          {savingRating && <p className="saving-text">Saving your rating...</p>}

          {!isDatabaseBook ? null : loadingRatings ? (
            <p className="loading-text">Loading ratings...</p>
          ) : (
            <div className="rating-summary">
              <div>
                <strong>
                  {Number(
                    ratings?.average_rating || book.average_rating || 0,
                  ).toFixed(1)}
                </strong>

                <span>Average Rating</span>
              </div>

              <div>
                <strong>{ratings?.total_ratings || 0}</strong>

                <span>Total Ratings</span>
              </div>
            </div>
          )}
        </section>

        {/* COMMENTS */}

        <section className="comments-area">
          <div className="section-title-row">
            <div>
              <h2>Comments & Reviews</h2>

              <p>
                {isDatabaseBook
                  ? "Share your thoughts about this book."
                  : "This book isn't in our library yet, so it can't be commented on."}
              </p>
            </div>
          </div>

          <form onSubmit={handleComment} className="comment-form">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={
                !isDatabaseBook
                  ? "Comments aren't available for this book yet."
                  : token
                    ? "Write your comment..."
                    : "Login to write a comment..."
              }
              maxLength={1000}
              disabled={savingComment || !isDatabaseBook}
            />

            <div className="comment-form-bottom">
              <span>{commentText.length}/1000</span>

              <button
                type="submit"
                disabled={
                  savingComment || !commentText.trim() || !isDatabaseBook
                }
                className="comment-submit-btn"
              >
                {savingComment
                  ? "Posting..."
                  : token
                    ? "Post Comment"
                    : "Login to Comment"}
              </button>
            </div>
          </form>

          {message && <div className="action-message">{message}</div>}

          {!isDatabaseBook ? null : loadingComments ? (
            <p className="loading-text">Loading comments...</p>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <div className="empty-comment-icon">💬</div>

              <h3>No comments yet</h3>

              <p>Be the first person to share your thoughts.</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => {
                const isOwner =
                  token &&
                  currentUser &&
                  Number(comment.user_id) === Number(currentUser.id);

                return (
                  <div className="comment-item" key={comment.id}>
                    <div className="comment-top">
                      <div className="comment-user">
                        <div className="user-avatar">
                          {(comment.user_name || comment.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {comment.user_name || comment.username || "User"}
                          </strong>

                          <span>
                            {comment.created_at
                              ? new Date(comment.created_at).toLocaleString()
                              : ""}
                          </span>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="comment-owner-actions">
                          <button
                            type="button"
                            className="edit-comment-btn"
                            onClick={() => {
                              setEditingCommentId(comment.id);

                              setEditingCommentText(comment.comment);

                              setMessage("");
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-comment-btn"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="edit-comment-form">
                        <textarea
                          value={editingCommentText}
                          onChange={(event) =>
                            setEditingCommentText(event.target.value)
                          }
                          maxLength={1000}
                          disabled={savingEdit}
                          autoFocus
                        />

                        <div className="edit-comment-actions">
                          <span>
                            {editingCommentText.length}
                            /1000
                          </span>

                          <div>
                            <button
                              type="button"
                              className="cancel-edit-btn"
                              onClick={() => {
                                setEditingCommentId(null);

                                setEditingCommentText("");
                              }}
                              disabled={savingEdit}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="save-edit-btn"
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={
                                savingEdit || !editingCommentText.trim()
                              }
                            >
                              {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p>{comment.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* YOU MIGHT ALSO LIKE */}

        {isDatabaseBook && (
          <section className="recommended-area">
            {loadingSimilar ? (
              <>
                <h2>You Might Also Like</h2>

                <p className="loading-text">Finding similar books...</p>
              </>
            ) : similarBooks.length > 0 ? (
              <BookCarousel
                title="You Might Also Like"
                subtitle="Similar in genre, author, and description"
                books={similarBooks}
                favorites={favorites}
                onFavorite={onFavorite}
                /*
                 * IMPORTANT:
                 * Do NOT manually change hash or scroll here.
                 * navigateToBook handles everything.
                 */
                onOpen={onOpenBook}
              />
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   AUTH MODAL
====================================================== */

function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const body =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              email,
              password,
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Authentication failed");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      onSuccess(data);
    } catch (error) {
      console.error("Authentication error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="auth-modal">
        <button type="button" className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="auth-modal-header">
          <span className="auth-logo">📚</span>

          <h2>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h2>

          <p>
            {mode === "login"
              ? "Login to continue using BookWise."
              : "Join BookWise and build your personal library."}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("register")}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")}>
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ======================================================
// ADMIN DASHBOARD
// ======================================================

function AdminDashboard({ user, token, onLogout, onBackToBookWise }) {
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState({
    users: 0,
    books: 0,
    favorites: 0,
    comments: 0,
  });

  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ------------------------------------------------------
  // ADMIN API HELPER
  // ------------------------------------------------------

  const adminFetch = async (endpoint, options = {}) => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
      throw new Error("Admin session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      throw new Error("Your session has expired. Please login again.");
    }

    if (response.status === 403) {
      throw new Error("Admin access required.");
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  };

  // ------------------------------------------------------
  // LOAD ADMIN DATA
  // ------------------------------------------------------

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       *
       * These endpoints assume your backend exposes admin
       * endpoints.
       *
       * If your backend uses different endpoint names,
       * we will connect those next.
       */

      const results = await Promise.allSettled([
        adminFetch("/api/admin/stats"),
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/books"),
      ]);

      // -----------------------------
      // STATS
      // -----------------------------

      if (results[0].status === "fulfilled") {
        const data = results[0].value;

        setStats({
          users: Number(data.users ?? data.totalUsers ?? data.total_users ?? 0),

          books: Number(data.books ?? data.totalBooks ?? data.total_books ?? 0),

          favorites: Number(
            data.favorites ?? data.totalFavorites ?? data.total_favorites ?? 0,
          ),

          comments: Number(
            data.comments ?? data.totalComments ?? data.total_comments ?? 0,
          ),
        });
      }

      // -----------------------------
      // USERS
      // -----------------------------

      if (results[1].status === "fulfilled") {
        const data = results[1].value;

        setUsers(
          Array.isArray(data)
            ? data
            : Array.isArray(data.users)
              ? data.users
              : [],
        );
      }

      // -----------------------------
      // BOOKS
      // -----------------------------

      if (results[2].status === "fulfilled") {
        const data = results[2].value;

        setBooks(
          Array.isArray(data)
            ? data
            : Array.isArray(data.books)
              ? data.books
              : [],
        );
      }

      // If every request failed, show the error.
      const allFailed = results.every((result) => result.status === "rejected");

      if (allFailed) {
        throw results[0].reason;
      }
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // ------------------------------------------------------
  // ADMIN SECURITY CHECK
  // ------------------------------------------------------

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-denied">
        <div className="admin-denied-card">
          <div className="admin-denied-icon">🔒</div>

          <h1>Access Denied</h1>

          <p>This area is restricted to BookWise administrators.</p>

          <button
            type="button"
            onClick={onBackToBookWise}
            className="admin-primary-btn"
          >
            Back to BookWise
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------

  const formatAdminDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <div className="admin-dashboard">
      {/* ================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">📚</div>

          <div>
            <strong>BookWise</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {(user.name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user.name || "Administrator"}</strong>
            <span>{user.email}</span>

            <small>ADMINISTRATOR</small>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            type="button"
            className={
              activeTab === "overview"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => setActiveTab("overview")}
          >
            <span>📊</span>
            Overview
          </button>

          <button
            type="button"
            className={
              activeTab === "users" ? "admin-nav-item active" : "admin-nav-item"
            }
            onClick={() => setActiveTab("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            type="button"
            className={
              activeTab === "books" ? "admin-nav-item active" : "admin-nav-item"
            }
            onClick={() => setActiveTab("books")}
          >
            <span>📚</span>
            Books
          </button>

          <button
            type="button"
            className={
              activeTab === "activity"
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
            onClick={() => setActiveTab("activity")}
          >
            <span>⚡</span>
            Activity
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-back-btn"
            onClick={onBackToBookWise}
          >
            ← BookWise
          </button>

          <button type="button" className="admin-logout-btn" onClick={onLogout}>
            ⇥ Logout
          </button>
        </div>
      </aside>

      {/* ================================================
          MAIN AREA
      ================================================= */}

      <main className="admin-main">
        {/* HEADER */}

        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">ADMINISTRATION</span>

            <h1>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "users" && "User Management"}
              {activeTab === "books" && "Book Management"}
              {activeTab === "activity" && "Recent Activity"}
            </h1>

            <p>Manage your BookWise platform from one place.</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={loadAdminData}
              disabled={loading}
            >
              ↻ {loading ? "Refreshing..." : "Refresh"}
            </button>

            <div className="admin-status">
              <span className="admin-status-dot"></span>
              System Online
            </div>
          </div>
        </header>

        {error && (
          <div className="admin-error">
            <strong>Unable to load some dashboard data.</strong>
            <span>{error}</span>

            <button type="button" onClick={loadAdminData}>
              Retry
            </button>
          </div>
        )}

        {/* ================================================
            OVERVIEW
        ================================================= */}

        {activeTab === "overview" && (
          <>
            <section className="admin-welcome-card">
              <div>
                <span>WELCOME BACK 👋</span>

                <h2>Hello, {user.name || "Administrator"}</h2>

                <p>
                  Here's what's happening across your BookWise platform today.
                </p>
              </div>

              <div className="admin-welcome-icon">📚</div>
            </section>

            {/* STAT CARDS */}

            <section className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon blue">👥</div>

                <div>
                  <span>Total Users</span>

                  <strong>
                    {loading ? "—" : stats.users.toLocaleString()}
                  </strong>

                  <small>Registered accounts</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon purple">📚</div>

                <div>
                  <span>Total Books</span>

                  <strong>
                    {loading ? "—" : stats.books.toLocaleString()}
                  </strong>

                  <small>Books in library</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon pink">♥</div>

                <div>
                  <span>Favorites</span>

                  <strong>
                    {loading ? "—" : stats.favorites.toLocaleString()}
                  </strong>

                  <small>User saved books</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon orange">💬</div>

                <div>
                  <span>Comments</span>

                  <strong>
                    {loading ? "—" : stats.comments.toLocaleString()}
                  </strong>

                  <small>Reviews & discussions</small>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}

            <section className="admin-section">
              <div className="admin-section-header">
                <div>
                  <span className="admin-eyebrow">MANAGEMENT</span>

                  <h2>Quick Actions</h2>
                </div>
              </div>

              <div className="admin-quick-grid">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="admin-quick-card"
                >
                  <div>👥</div>
                  <strong>Manage Users</strong>
                  <span>View registered users</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("books")}
                  className="admin-quick-card"
                >
                  <div>📚</div>
                  <strong>Manage Books</strong>
                  <span>View your book catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className="admin-quick-card"
                >
                  <div>⚡</div>
                  <strong>Recent Activity</strong>
                  <span>Monitor platform activity</span>
                </button>
              </div>
            </section>

            {/* RECENT USERS */}

            <section className="admin-section">
              <div className="admin-section-header">
                <div>
                  <span className="admin-eyebrow">USERS</span>

                  <h2>Recent Users</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="admin-text-btn"
                >
                  View All →
                </button>
              </div>

              <div className="admin-table-wrapper">
                {users.length === 0 ? (
                  <div className="admin-empty">
                    <div>👥</div>
                    <h3>No users available</h3>
                    <p>User data will appear here.</p>
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.slice(0, 5).map((item, index) => (
                        <tr key={item.id || index}>
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-mini-avatar">
                                {(item.name || "U").charAt(0).toUpperCase()}
                              </div>

                              <strong>{item.name || "Unknown User"}</strong>
                            </div>
                          </td>

                          <td>{item.email || "—"}</td>

                          <td>
                            <span
                              className={
                                item.role === "admin"
                                  ? "admin-role admin-role-admin"
                                  : "admin-role"
                              }
                            >
                              {item.role || "user"}
                            </span>
                          </td>

                          <td>
                            {formatAdminDate(item.created_at || item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {/* ================================================
            USERS
        ================================================= */}

        {activeTab === "users" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">ACCOUNTS</span>

                <h2>All Users</h2>

                <p>{users.length} users loaded</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              {users.length === 0 ? (
                <div className="admin-empty">
                  <div>👥</div>
                  <h3>No users found</h3>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-mini-avatar">
                              {(item.name || "U").charAt(0).toUpperCase()}
                            </div>

                            <strong>{item.name || "Unknown"}</strong>
                          </div>
                        </td>

                        <td>{item.email || "—"}</td>

                        <td>
                          <span
                            className={
                              item.role === "admin"
                                ? "admin-role admin-role-admin"
                                : "admin-role"
                            }
                          >
                            {item.role || "user"}
                          </span>
                        </td>

                        <td>
                          {formatAdminDate(item.created_at || item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* ================================================
            BOOKS
        ================================================= */}

        {activeTab === "books" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">LIBRARY</span>

                <h2>Book Catalog</h2>

                <p>{books.length} books loaded</p>
              </div>
            </div>

            <div className="admin-book-grid">
              {books.length === 0 ? (
                <div className="admin-empty">
                  <div>📚</div>
                  <h3>No books available</h3>
                </div>
              ) : (
                books.map((book, index) => (
                  <article className="admin-book-card" key={book.id || index}>
                    <div className="admin-book-cover">
                      <img
                        src={
                          book.cover_url ||
                          "https://via.placeholder.com/160x230?text=Book"
                        }
                        alt={book.title || "Book"}
                        onError={(event) => {
                          event.currentTarget.src =
                            "https://via.placeholder.com/160x230?text=Book";
                        }}
                      />
                    </div>

                    <div className="admin-book-info">
                      <h3>{book.title || "Untitled Book"}</h3>

                      <p>{book.author || "Unknown Author"}</p>

                      <span>
                        ⭐{" "}
                        {book.average_rating
                          ? Number(book.average_rating).toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* ================================================
            ACTIVITY
        ================================================= */}

        {activeTab === "activity" && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div>
                <span className="admin-eyebrow">MONITORING</span>

                <h2>Recent Activity</h2>

                <p>Platform activity overview</p>
              </div>
            </div>

            <div className="admin-activity-list">
              <div className="admin-activity-item">
                <div className="activity-icon">👥</div>

                <div>
                  <strong>User accounts</strong>
                  <p>{stats.users} registered users</p>
                </div>

                <span>Live</span>
              </div>

              <div className="admin-activity-item">
                <div className="activity-icon">📚</div>

                <div>
                  <strong>Book catalog</strong>
                  <p>{stats.books} books available</p>
                </div>

                <span>Live</span>
              </div>

              <div className="admin-activity-item">
                <div className="activity-icon">♥</div>

                <div>
                  <strong>Favorites</strong>
                  <p>{stats.favorites} saved books</p>
                </div>

                <span>Live</span>
              </div>

              <div className="admin-activity-item">
                <div className="activity-icon">💬</div>

                <div>
                  <strong>Community</strong>
                  <p>{stats.comments} comments</p>
                </div>

                <span>Live</span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ======================================================
   MAIN APP
====================================================== */

function App() {
  const [books, setBooks] = useState([]);

  const [favorites, setFavorites] = useState(new Set());

  const [favoriteBooks, setFavoriteBooks] = useState([]);

  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedBook, setSelectedBook] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("bookwise_selected_book") || "null",
      );
    } catch {
      return null;
    }
  });

  const [bookPage, setBookPage] = useState(() => {
    return (
      window.location.hash.startsWith("#book/") &&
      !!sessionStorage.getItem("bookwise_selected_book")
    );
  });

  /* ====================================================
     NAVIGATE TO BOOK
     
     This is now the SINGLE function used everywhere.
  ==================================================== */

  const navigateToBook = (book) => {
    if (!book) return;

    /*
     * Set selected book first.
     */
    setSelectedBook(book);

    try {
      sessionStorage.setItem("bookwise_selected_book", JSON.stringify(book));
    } catch {}

    const identifier = getBookIdentifier(book) || book.title || "book";

    const encodedIdentifier = encodeURIComponent(identifier);

    /*
     * Remove an old /book/52 pathname if one exists.
     *
     * Your screenshot showed:
     *
     * /book/52#book/53
     *
     * We don't want that.
     *
     * We want:
     *
     * /#book/53
     */
    window.history.replaceState(null, "", "/");

    /*
     * Now create the clean hash.
     */
    window.location.hash = `book/${encodedIdentifier}`;

    setBookPage(true);

    /*
     * Reset normal page scrolling immediately.
     */
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  /* ====================================================
     CLOSE BOOK PAGE
  ==================================================== */

  const closeBookPage = () => {
    try {
      sessionStorage.removeItem("bookwise_selected_book");
    } catch {}

    /*
     * Return to root.
     */
    window.history.replaceState(null, "", "/");

    setSelectedBook(null);
    setBookPage(false);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  /* ====================================================
     HASH CHANGE
  ==================================================== */

  useEffect(() => {
    const onHashChange = () => {
      const isBook = window.location.hash.startsWith("#book/");

      setBookPage(isBook);

      if (!isBook) {
        setSelectedBook(null);
      }
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const [authModal, setAuthModal] = useState(null);

  const [user, setUser] = useState(getStoredUser);

  const [token, setToken] = useState(getToken);

  const [recommendations, setRecommendations] = useState([]);

  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [popularBooks, setPopularBooks] = useState([]);

  const [loadingPopular, setLoadingPopular] = useState(true);

  /* ====================================================
     LOAD BOOKS
  ==================================================== */

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/books`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch books");
      }

      const bookList = Array.isArray(data.books)
        ? data.books
        : Array.isArray(data)
          ? data
          : [];

      setBooks(bookList);
    } catch (error) {
      console.error("Books loading error:", error);

      setError(error.message || "Could not load books.");
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================
     LOAD RECOMMENDATIONS
  ==================================================== */

  const loadRecommendations = async () => {
    const currentToken = getToken();

    if (!currentToken) {
      setRecommendations([]);
      return;
    }

    try {
      setLoadingRecommendations(true);

      const response = await fetch(`${API_URL}/api/recommendations`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setRecommendations([]);
        }

        return;
      }

      setRecommendations(
        Array.isArray(data.recommendations) ? data.recommendations : [],
      );
    } catch (error) {
      console.error("Recommendations loading error:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  /* ====================================================
     LOAD POPULAR BOOKS
  ==================================================== */

  const loadPopularBooks = async () => {
    try {
      setLoadingPopular(true);

      const response = await fetch(`${API_URL}/api/discover/popular`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch popular books");
      }

      setPopularBooks(Array.isArray(data.books) ? data.books : []);
    } catch (error) {
      console.error("Popular books loading error:", error);
    } finally {
      setLoadingPopular(false);
    }
  };

  /* ====================================================
     LOGOUT
  ==================================================== */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    setFavorites(new Set());
    setFavoriteBooks([]);
    setRecommendations([]);
    setFavoritesOpen(false);
    setAuthModal(null);
  };

  /* ====================================================
     LOAD FAVORITES
  ==================================================== */

  const loadFavorites = async () => {
    const currentToken = getToken();

    if (!currentToken) {
      setFavorites(new Set());
      setFavoriteBooks([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
        }

        return;
      }

      const favoriteList = Array.isArray(data) ? data : data.favorites || [];

      const favoriteIds = new Set();

      const formattedFavorites = favoriteList
        .map((favorite) => {
          const book = favorite.book || favorite;

          const bookId = Number(favorite.book_id || book.id);

          if (!bookId) {
            return null;
          }

          favoriteIds.add(String(bookId));

          if (book.google_book_id) {
            favoriteIds.add(String(book.google_book_id));
          }

          const createdDate =
            favorite.created_at || favorite.favorite_date || favorite.createdAt;

          return {
            ...book,
            id: bookId,
            favorite_date: formatDate(createdDate),
          };
        })
        .filter(Boolean);

      setFavorites(favoriteIds);
      setFavoriteBooks(formattedFavorites);
    } catch (error) {
      console.error("Favorites loading error:", error);
    }
  };

  /* ====================================================
     INITIAL LOAD
  ==================================================== */

  useEffect(() => {
    loadBooks();
    loadFavorites();
    loadPopularBooks();
    loadRecommendations();
  }, []);

  /* ====================================================
     FAVORITE
  ==================================================== */

  const handleFavorite = async (book) => {
    const currentToken = getToken();

    if (!currentToken) {
      setAuthModal("login");
      return;
    }

    const identifier = getBookIdentifier(book);

    if (!identifier) {
      alert("This book isn't in our library yet, so it can't be favorited.");

      return;
    }

    const isCurrentlyFavorite = favorites.has(identifier);

    try {
      if (isCurrentlyFavorite) {
        const response = await fetch(`${API_URL}/api/favorites/${identifier}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to remove favorite");
        }

        setFavorites((previous) => {
          const next = new Set(previous);

          next.delete(identifier);

          if (data.favorite?.book_id) {
            next.delete(String(data.favorite.book_id));
          }

          return next;
        });

        setFavoriteBooks((previous) =>
          previous.filter((item) => getBookIdentifier(item) !== identifier),
        );
      } else {
        const response = await fetch(`${API_URL}/api/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            book_id: identifier,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add favorite");
        }

        const resolvedId = data.book?.id || data.favorite?.book_id || null;

        setFavorites((previous) => {
          const next = new Set(previous);

          next.add(identifier);

          if (resolvedId) {
            next.add(String(resolvedId));
          }

          return next;
        });

        const createdDate =
          data.created_at ||
          data.favorite?.created_at ||
          new Date().toISOString();

        const favoriteBook = {
          ...book,
          id: resolvedId || book.id,
          google_book_id: data.book?.google_book_id || book.google_book_id,
          favorite_date: formatDate(createdDate),
        };

        setFavoriteBooks((previous) => {
          const exists = previous.some(
            (item) => getBookIdentifier(item) === identifier,
          );

          if (exists) {
            return previous;
          }

          return [favoriteBook, ...previous];
        });
      }
    } catch (error) {
      console.error("Favorite error:", error);

      alert(error.message);
    }
  };

  /* ====================================================
     AUTH SUCCESS
  ==================================================== */

  const handleAuthSuccess = (data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);

      setToken(data.token);
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
    }

    setAuthModal(null);

    loadFavorites();
    loadRecommendations();
  };

  /* ====================================================
     SEARCH
  ==================================================== */

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      loadBooks();
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/discover/search?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to search books");
        }

        setBooks(
          Array.isArray(data.books)
            ? data.books
            : Array.isArray(data)
              ? data
              : [],
        );
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Search error:", error);

        setError(error.message || "Search failed.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const filteredBooks = useMemo(() => books, [books]);

  /* ====================================================
     SCROLL TO CATALOG
  ==================================================== */

  const scrollToBooks = () => {
    document.getElementById("book-catalog")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  /* ====================================================
     SELECTED BOOK
  ==================================================== */

  const selectedBookIdentifier = getBookIdentifier(selectedBook);

  /* ====================================================
     FULL BOOK PAGE
  ==================================================== */

  if (bookPage && selectedBook) {
    return (
      <BookDetailModal
        book={selectedBook}
        onClose={closeBookPage}
        isFavorite={
          selectedBookIdentifier ? favorites.has(selectedBookIdentifier) : false
        }
        onFavorite={handleFavorite}
        token={token}
        onLoginRequired={() => setAuthModal("login")}
        favorites={favorites}
        onOpenBook={navigateToBook}
        fullPage
      />
    );
  }

  /* ====================================================
     MAIN PAGE
  ==================================================== */

  return (
    <div className="app">
      {/* NAVBAR */}

      <nav className="navbar">
        <div className="nav-container">
          <button
            type="button"
            className="brand"
            onClick={() => {
              setSearch("");

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <span className="brand-icon">📚</span>

            <span>BookWise</span>
          </button>

          {/* SEARCH */}

          <div className="nav-search">
            <span className="search-icon">🔎</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search books, authors..."
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          {/* NAV ACTIONS */}

          <div className="nav-actions">
            {user && (
              <div className="favorites-wrapper">
                <button
                  type="button"
                  className={`favorites-nav-btn ${
                    favoritesOpen ? "active" : ""
                  }`}
                  onClick={() => setFavoritesOpen((previous) => !previous)}
                >
                  <span className="heart-icon">♥</span>

                  <span className="favorites-label">Favorites</span>

                  {favoriteBooks.length > 0 && (
                    <span className="favorites-count">
                      {favoriteBooks.length}
                    </span>
                  )}
                </button>

                {favoritesOpen && (
                  <div className="favorites-dropdown">
                    <div className="favorites-dropdown-header">
                      <div>
                        <h3>My Favorites</h3>

                        <p>
                          {favoriteBooks.length} saved{" "}
                          {favoriteBooks.length === 1 ? "book" : "books"}
                        </p>
                      </div>

                      <span className="favorites-header-icon">♥</span>
                    </div>

                    {favoriteBooks.length === 0 ? (
                      <div className="favorites-empty">
                        <div>♡</div>

                        <h4>No favorite books yet</h4>

                        <p>Click the heart on a book to save it here.</p>
                      </div>
                    ) : (
                      <div className="favorites-list">
                        {favoriteBooks.map((favorite) => (
                          <div
                            className="favorite-dropdown-item"
                            key={getBookIdentifier(favorite) || favorite.title}
                            onClick={() => {
                              setFavoritesOpen(false);

                              /*
                               * IMPORTANT:
                               * Use the same navigation
                               * function here.
                               */
                              navigateToBook(favorite);
                            }}
                          >
                            <img
                              src={
                                favorite.cover_url ||
                                "https://via.placeholder.com/70x100?text=Book"
                              }
                              alt={favorite.title}
                              onError={(event) => {
                                event.currentTarget.src =
                                  "https://via.placeholder.com/70x100?text=Book";
                              }}
                            />

                            <div className="favorite-dropdown-info">
                              <h4>{favorite.title}</h4>

                              <p>{favorite.author || "Unknown Author"}</p>

                              <span>♥ Added {favorite.favorite_date}</span>
                            </div>

                            <button
                              type="button"
                              className="favorite-remove-small"
                              onClick={(event) => {
                                event.stopPropagation();

                                handleFavorite(favorite);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user ? (
              <>
                <span className="welcome-user">
                  Hi, {user.name || "Reader"}
                </span>

                <button
                  type="button"
                  className="nav-btn logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setAuthModal("login")}
                >
                  Login
                </button>

                <button
                  type="button"
                  className="nav-btn nav-register"
                  onClick={() => setAuthModal("register")}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}

      {!search && (
        <header className="hero">
          <div className="hero-content">
            <span className="hero-label">YOUR PERSONAL BOOK DISCOVERY</span>

            <h1>
              Find your next
              <span>favorite book.</span>
            </h1>

            <p>
              Explore books, rate your favorites, share your thoughts, and
              discover something new.
            </p>

            <button type="button" className="hero-btn" onClick={scrollToBooks}>
              Explore Books →
            </button>
          </div>
        </header>
      )}

      {/* MAIN */}

      <main className="main-content" id="book-catalog">
        {search && (
          <div className="search-heading">
            <span>SEARCH RESULTS</span>

            <h1>Results for "{search}"</h1>

            <p>{filteredBooks.length} books found</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Something went wrong</strong>

            <span>{error}</span>

            <button type="button" onClick={loadBooks}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>

            <h2>Loading books...</h2>

            <p>Finding great books for you.</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>

            <h2>No books found</h2>

            <p>Try another title, author, or search term.</p>

            <button type="button" onClick={() => setSearch("")}>
              Show All Books
            </button>
          </div>
        ) : (
          <>
            {/* PERSONALIZED RECOMMENDATIONS */}

            {!search && user && (
              <BookCarousel
                title="Suggested For You"
                subtitle="Picked based on your favorites, ratings, and reading history"
                books={recommendations}
                favorites={favorites}
                onFavorite={handleFavorite}
                /*
                 * IMPORTANT:
                 * Every recommended book uses
                 * navigateToBook().
                 */
                onOpen={navigateToBook}
                loading={loadingRecommendations}
              />
            )}

            {/* POPULAR BOOKS */}

            {!search && (
              <BookCarousel
                title="Popular Books"
                subtitle="Highest rated books in our library"
                books={popularBooks}
                favorites={favorites}
                onFavorite={handleFavorite}
                onOpen={navigateToBook}
                loading={loadingPopular}
              />
            )}

            {/* ALL BOOKS */}

            <BookGrid
              title={search ? "Search Results" : "All Books"}
              books={filteredBooks}
              favorites={favorites}
              onFavorite={handleFavorite}
              onOpen={navigateToBook}
            />
          </>
        )}
      </main>

      {/* FOOTER */}

      <footer className="footer">
        <div>
          <strong>📚 BookWise</strong>

          <p>Discover. Read. Review.</p>
        </div>

        <span>© 2026 BookWise. All rights reserved.</span>
      </footer>

      {/* AUTH MODAL */}

      {authModal && (
        <AuthModal
          mode={authModal}
          setMode={setAuthModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
