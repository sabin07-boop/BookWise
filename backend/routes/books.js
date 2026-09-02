import express from "express";
import pool from "../db.js";

const router = express.Router();

// =====================================================
// GET ALL LOCAL DATABASE BOOKS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        google_book_id,
        title,
        author,
        description,
        cover_url,
        published_year,
        average_rating,
        created_at
      FROM books
      ORDER BY id ASC;
    `);

    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("GET BOOKS ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch books",
    });
  }
});

// =====================================================
// GET SINGLE LOCAL DATABASE BOOK
//
// IMPORTANT:
// This route is ONLY for PostgreSQL numeric IDs.
//
// Example:
// /api/books/15
//
// Google IDs such as:
// /api/books/zXMOzgEACAAJ
//
// are handled by:
// /api/google-books/:googleBookId
// =====================================================

router.get("/:id", async (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid local book ID",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        google_book_id,
        title,
        author,
        description,
        cover_url,
        published_year,
        average_rating,
        created_at
      FROM books
      WHERE id = $1
      LIMIT 1;
      `,
      [bookId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    return res.json({
      success: true,
      book: result.rows[0],
    });
  } catch (error) {
    console.error("GET SINGLE BOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch book",
    });
  }
});

export default router;
