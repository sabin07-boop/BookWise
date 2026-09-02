import express from "express";
import pool from "../db.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

router.use(authenticateToken);
router.use(requireAdmin);

// ======================================================
// ADMIN STATS
// GET /api/admin/stats
// ======================================================

router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)::integer AS total_users,
        (SELECT COUNT(*) FROM books)::integer AS total_books,
        (SELECT COUNT(*) FROM favorites)::integer AS total_favorites,
        (SELECT COUNT(*) FROM comments)::integer AS total_comments,
        (SELECT COUNT(*) FROM ratings)::integer AS total_ratings,
        (SELECT COUNT(*) FROM genres)::integer AS total_genres
    `);

    const stats = result.rows[0];

    return res.json({
      success: true,
      stats: {
        totalUsers: Number(stats.total_users),
        totalBooks: Number(stats.total_books),
        totalFavorites: Number(stats.total_favorites),
        totalComments: Number(stats.total_comments),
        totalRatings: Number(stats.total_ratings),
        totalGenres: Number(stats.total_genres),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load admin statistics.",
    });
  }
});

// ======================================================
// USERS
// GET /api/admin/users
// ======================================================

router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load users.",
    });
  }
});

// ======================================================
// BOOKS
// GET /api/admin/books
// ======================================================

router.get("/books", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        books.id,
        books.google_book_id,
        books.title,
        books.author,
        books.description,
        books.cover_url,
        books.published_year,
        books.average_rating,
        books.created_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', genres.id,
                'name', genres.name
              )
              ORDER BY genres.name
            )
            FROM book_genres
            INNER JOIN genres
              ON genres.id = book_genres.genre_id
            WHERE book_genres.book_id = books.id
          ),
          '[]'
        ) AS genres,

        (
          SELECT COUNT(*)
          FROM favorites
          WHERE favorites.book_id = books.id
        )::integer AS favorite_count,

        (
          SELECT COUNT(*)
          FROM comments
          WHERE comments.book_id = books.id
        )::integer AS comment_count,

        (
          SELECT COUNT(*)
          FROM ratings
          WHERE ratings.book_id = books.id
        )::integer AS rating_count

      FROM books

      ORDER BY books.created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("Admin books error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load books.",
    });
  }
});

// ======================================================
// GENRES
// GET /api/admin/genres
// ======================================================

router.get("/genres", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        created_at
      FROM genres
      ORDER BY name ASC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      genres: result.rows,
    });
  } catch (error) {
    console.error("Admin genres error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load genres.",
    });
  }
});

// ======================================================
// FAVORITES
// GET /api/admin/favorites
// ======================================================

router.get("/favorites", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        favorites.id,
        favorites.created_at,

        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,

        books.id AS book_id,
        books.google_book_id,
        books.title,
        books.author,
        books.cover_url

      FROM favorites

      INNER JOIN users
        ON users.id = favorites.user_id

      INNER JOIN books
        ON books.id = favorites.book_id

      ORDER BY favorites.created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      favorites: result.rows,
    });
  } catch (error) {
    console.error("Admin favorites error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load favorites.",
    });
  }
});

// ======================================================
// COMMENTS
// GET /api/admin/comments
// ======================================================

router.get("/comments", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        comments.id,
        comments.comment,
        comments.created_at,

        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,

        books.id AS book_id,
        books.google_book_id,
        books.title,
        books.author,
        books.cover_url

      FROM comments

      INNER JOIN users
        ON users.id = comments.user_id

      INNER JOIN books
        ON books.id = comments.book_id

      ORDER BY comments.created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      comments: result.rows,
    });
  } catch (error) {
    console.error("Admin comments error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load comments.",
    });
  }
});

// ======================================================
// RATINGS
// GET /api/admin/ratings
// ======================================================

router.get("/ratings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ratings.id,
        ratings.rating,
        ratings.created_at,

        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,

        books.id AS book_id,
        books.google_book_id,
        books.title,
        books.author

      FROM ratings

      INNER JOIN users
        ON users.id = ratings.user_id

      INNER JOIN books
        ON books.id = ratings.book_id

      ORDER BY ratings.created_at DESC
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      ratings: result.rows,
    });
  } catch (error) {
    console.error("Admin ratings error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load ratings.",
    });
  }
});

// ======================================================
// RECENT ACTIVITY
// GET /api/admin/activity
// ======================================================

router.get("/activity", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM (

        SELECT
          'favorite' AS type,
          favorites.id,
          favorites.created_at,
          users.name AS user_name,
          books.title AS book_title,
          NULL::text AS content

        FROM favorites

        INNER JOIN users
          ON users.id = favorites.user_id

        INNER JOIN books
          ON books.id = favorites.book_id


        UNION ALL


        SELECT
          'comment' AS type,
          comments.id,
          comments.created_at,
          users.name AS user_name,
          books.title AS book_title,
          comments.comment AS content

        FROM comments

        INNER JOIN users
          ON users.id = comments.user_id

        INNER JOIN books
          ON books.id = comments.book_id


        UNION ALL


        SELECT
          'rating' AS type,
          ratings.id,
          ratings.created_at,
          users.name AS user_name,
          books.title AS book_title,
          ratings.rating::text AS content

        FROM ratings

        INNER JOIN users
          ON users.id = ratings.user_id

        INNER JOIN books
          ON books.id = ratings.book_id

      ) activity

      ORDER BY created_at DESC
      LIMIT 50
    `);

    return res.json({
      success: true,
      count: result.rows.length,
      activity: result.rows,
    });
  } catch (error) {
    console.error("Admin activity error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load activity.",
    });
  }
});

export default router;
