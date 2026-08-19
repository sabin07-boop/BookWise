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

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { book_id } = req.body;

    // --------------------------------------------------
    // Validate book_id
    // --------------------------------------------------

    if (book_id === undefined || book_id === null || book_id === "") {
      return res.status(400).json({
        error: "book_id is required",
      });
    }

    const bookId = Number(book_id);

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({
        error: "book_id must be a valid integer",
      });
    }

    // --------------------------------------------------
    // Check whether book exists
    // --------------------------------------------------

    const bookResult = await pool.query(
      `
      SELECT id
      FROM books
      WHERE id = $1
      `,
      [bookId],
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    // --------------------------------------------------
    // Check duplicate favorite
    // --------------------------------------------------

    const existingFavorite = await pool.query(
      `
        SELECT id
        FROM favorites
        WHERE user_id = $1
        AND book_id = $2
        `,
      [req.user.id, bookId],
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({
        error: "Book is already in favorites",
        favorite: existingFavorite.rows[0],
      });
    }

    // --------------------------------------------------
    // Insert favorite
    // --------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO favorites
        (
          user_id,
          book_id
        )
      VALUES
        (
          $1,
          $2
        )
      RETURNING
        id,
        user_id,
        book_id,
        created_at
      `,
      [req.user.id, bookId],
    );

    console.log(`Book ${bookId} added to favorites for user ${req.user.id}`);

    res.status(201).json({
      message: "Book added to favorites",

      favorite: result.rows[0],
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    // PostgreSQL duplicate key
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Book is already in favorites",
      });
    }

    res.status(500).json({
      error: "Failed to add favorite",
    });
  }
});

// ======================================================
// REMOVE FAVORITE
// DELETE /api/favorites/:bookId
// ======================================================

router.delete("/:bookId", authMiddleware, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    // ------------------------------------------------
    // Validate book ID
    // ------------------------------------------------

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({
        error: "Invalid book ID",
      });
    }

    console.log(
      `Removing book ${bookId} from favorites for user ${req.user.id}`,
    );

    // ------------------------------------------------
    // Delete favorite
    // ------------------------------------------------

    const result = await pool.query(
      `
          DELETE FROM favorites

          WHERE user_id = $1
          AND book_id = $2

          RETURNING
            id,
            user_id,
            book_id,
            created_at
          `,
      [req.user.id, bookId],
    );

    // ------------------------------------------------
    // Favorite doesn't exist
    // ------------------------------------------------

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Favorite not found",
      });
    }

    console.log(`Book ${bookId} removed from favorites`);

    // ------------------------------------------------
    // Success
    // ------------------------------------------------

    res.status(200).json({
      message: "Book removed from favorites",

      favorite: result.rows[0],
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      error: "Failed to remove favorite",
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
