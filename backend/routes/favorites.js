import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ======================================================
// GET USER FAVORITES
// GET /api/favorites
// ======================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        f.id AS favorite_id,
        f.book_id,
        f.created_at AS favorited_at,

        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_url,
        b.published_year,
        b.average_rating,
        b.created_at,
        b.genre

      FROM favorites f

      INNER JOIN books b
        ON b.id = f.book_id

      WHERE f.user_id = $1

      ORDER BY f.created_at DESC
      `,
      [req.user.id],
    );

    console.log(`Favorites for user ${req.user.id}:`, result.rows);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get favorites error:", error);

    res.status(500).json({
      error: "Failed to get favorites",
    });
  }
});

// ======================================================
// ADD FAVORITE
// POST /api/favorites
// ======================================================

router.post("/api/favorites", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const { book_id, google_book_id, googleBookId } = req.body;

  const identifier = String(
    book_id || google_book_id || googleBookId || "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    // Automatically resolve/import Google book
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    // Check existing favorite
    const existingFavorite = await pool.query(
      `
      SELECT id
      FROM favorites
      WHERE user_id = $1
        AND book_id = $2
      LIMIT 1;
      `,
      [userId, bookId],
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Book is already in favorites",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO favorites
      (
        user_id,
        book_id,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        CURRENT_TIMESTAMP
      )
      RETURNING
        id,
        user_id,
        book_id,
        created_at;
      `,
      [userId, bookId],
    );

    res.status(201).json({
      success: true,

      message: "Book added to favorites",

      favorite: result.rows[0],

      book: {
        id: book.id,
        google_book_id: book.google_book_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      },
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add favorite",
    });
  }
});

// ======================================================
// REMOVE FAVORITE
// DELETE /api/favorites/:bookId
// ======================================================
app.delete("/api/favorites/:bookId", authenticateToken, async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  const userId = req.user.userId;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Book ID is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
        DELETE FROM favorites

        WHERE user_id = $1
          AND book_id = $2

        RETURNING
          id,
          user_id,
          book_id,
          created_at;
        `,
      [userId, book.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Favorite not found",
      });
    }

    res.json({
      success: true,

      message: "Book removed from favorites",

      favorite: result.rows[0],

      book_id: book.id,

      google_book_id: book.google_book_id || null,
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to remove favorite",
    });
  }
});

// ======================================================
// CHECK IF ONE BOOK IS FAVORITE
// GET /api/favorites/check/:bookId
// ======================================================

router.get("/check/:bookId", authMiddleware, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({
        error: "Invalid book ID",
      });
    }

    const result = await pool.query(
      `
          SELECT
            id,
            user_id,
            book_id,
            created_at

          FROM favorites

          WHERE user_id = $1
          AND book_id = $2
          `,
      [req.user.id, bookId],
    );

    res.status(200).json({
      isFavorite: result.rows.length > 0,

      favorite: result.rows[0] || null,
    });
  } catch (error) {
    console.error("Check favorite error:", error);

    res.status(500).json({
      error: "Failed to check favorite",
    });
  }
});

export default router;
