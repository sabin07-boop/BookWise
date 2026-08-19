import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();
const PORT = 3000;

// =====================================================
// Middleware
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// Authentication Routes
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// Home
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "BookWise backend is running!",
  });
});

// =====================================================
// BOOKS
// =====================================================

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM books
      ORDER BY id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Books error:", error);

    res.status(500).json({
      error: "Failed to fetch books",
    });
  }
});

// =====================================================
// GENRES
// =====================================================

// Get all genres
app.get("/api/genres", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM genres
      ORDER BY id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Genres error:", error);

    res.status(500).json({
      error: "Failed to fetch genres",
    });
  }
});

// =====================================================
// FAVORITES
// =====================================================

// =====================================================
// Get logged-in user's favorites
// =====================================================

app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    // Get logged-in user's ID from JWT
    const userId = req.user.userId;

    const result = await pool.query(
      `
        SELECT
          favorites.id AS favorite_id,
          favorites.user_id,
          favorites.book_id,
          favorites.created_at,

          books.title,
          books.author,
          books.description,
          books.cover_url,
          books.published_year,
          books.average_rating

        FROM favorites

        JOIN books
          ON books.id = favorites.book_id

        WHERE favorites.user_id = $1

        ORDER BY favorites.created_at DESC;
        `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Favorites error:", error);

    res.status(500).json({
      error: "Failed to fetch favorites",
    });
  }
});

// =====================================================
// Add favorite
// =====================================================

app.post("/api/favorites", authenticateToken, async (req, res) => {
  const { book_id } = req.body;

  // Get logged-in user ID
  const user_id = req.user.userId;

  // Validate book ID
  if (!book_id) {
    return res.status(400).json({
      error: "book_id is required",
    });
  }

  try {
    // =================================================
    // Check whether book exists
    // =================================================

    const bookResult = await pool.query(
      `
        SELECT
          id,
          title
        FROM books
        WHERE id = $1;
        `,
      [book_id],
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    // =================================================
    // Check whether already favorited
    // =================================================

    const existingFavorite = await pool.query(
      `
        SELECT id
        FROM favorites
        WHERE user_id = $1
          AND book_id = $2;
        `,
      [user_id, book_id],
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({
        error: "Book is already in favorites",
      });
    }

    // =================================================
    // Insert favorite
    // =================================================

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
      [user_id, book_id],
    );

    res.status(201).json({
      message: "Book added to favorites",

      favorite: result.rows[0],
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    res.status(500).json({
      error: "Failed to add favorite",
    });
  }
});

// =====================================================
// Remove favorite
// =====================================================

app.delete("/api/favorites/:bookId", authenticateToken, async (req, res) => {
  const { bookId } = req.params;

  // Get logged-in user ID
  const user_id = req.user.userId;

  try {
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
      [user_id, bookId],
    );

    // =================================================
    // Favorite not found
    // =================================================

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Favorite not found",
      });
    }

    res.json({
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

// =====================================================
// RATINGS
// =====================================================

// Add rating
app.post("/api/ratings", authenticateToken, async (req, res) => {
  const { book_id, rating } = req.body;

  // Get logged-in user ID
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      `
        INSERT INTO ratings
          (
            user_id,
            book_id,
            rating
          )
        VALUES
          (
            $1,
            $2,
            $3
          )
        RETURNING *;
        `,
      [user_id, book_id, rating],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Rating error:", error);

    res.status(500).json({
      error: "Failed to add rating",
    });
  }
});

// =====================================================
// READING HISTORY
// =====================================================

// Add reading history
app.post("/api/reading-history", authenticateToken, async (req, res) => {
  const { book_id } = req.body;

  // Get logged-in user ID
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      `
        INSERT INTO reading_history
          (
            user_id,
            book_id,
            viewed_at
          )
        VALUES
          (
            $1,
            $2,
            CURRENT_TIMESTAMP
          )
        RETURNING *;
        `,
      [user_id, book_id],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Reading history error:", error);

    res.status(500).json({
      error: "Failed to add reading history",
    });
  }
});

// =====================================================
// RECOMMENDATIONS
// =====================================================

app.get("/api/recommendations/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
        SELECT
          books.id,
          books.title,
          books.author,
          books.description,
          books.cover_url,
          books.average_rating,

          SUM(

            CASE
              WHEN genres.id IN (
                SELECT bg.genre_id
                FROM favorites f

                JOIN book_genres bg
                  ON f.book_id = bg.book_id

                WHERE f.user_id = $1
              )
              THEN 3
              ELSE 0
            END

            +

            CASE
              WHEN genres.id IN (
                SELECT bg.genre_id
                FROM ratings r

                JOIN book_genres bg
                  ON r.book_id = bg.book_id

                WHERE r.user_id = $1
                  AND r.rating >= 4
              )
              THEN 5
              ELSE 0
            END

            +

            CASE
              WHEN genres.id IN (
                SELECT bg.genre_id
                FROM reading_history rh

                JOIN book_genres bg
                  ON rh.book_id = bg.book_id

                WHERE rh.user_id = $1
              )
              THEN 2
              ELSE 0
            END

          ) AS recommendation_score

        FROM books

        JOIN book_genres
          ON books.id = book_genres.book_id

        JOIN genres
          ON book_genres.genre_id = genres.id

        WHERE books.id NOT IN (
          SELECT book_id
          FROM favorites
          WHERE user_id = $1
        )

        AND books.id NOT IN (
          SELECT book_id
          FROM ratings
          WHERE user_id = $1
        )

        GROUP BY
          books.id,
          books.title,
          books.author,
          books.description,
          books.cover_url,
          books.average_rating

        ORDER BY
          recommendation_score DESC,
          books.average_rating DESC;
        `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      error: "Failed to generate recommendations",
    });
  }
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    error: "Internal server error",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`BookWise server running on port ${PORT}`);
});
