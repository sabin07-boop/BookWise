// =====================================================
// BOOKWISE BACKEND
// =====================================================

import express from "express";
import cors from "cors";
import "dotenv/config";

import pool from "./db.js";

import authRoutes from "./routes/auth.js";

import {
  authenticateToken,
  verifyToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";

import {
  invalidateCache,
  getRecommendationsForUser,
  getSimilarBooks,
} from "./services/recommendationService.js";

// =====================================================
// APP CONFIG
// =====================================================

const app = express();

const PORT = Number(process.env.PORT || 5000);

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// =====================================================
// ENVIRONMENT CHECK
// =====================================================

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not set in .env");
}

if (!GOOGLE_BOOKS_API_KEY) {
  console.warn("⚠️ GOOGLE_BOOKS_API_KEY is not set in .env");
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);

  next();
});

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BookWise backend is running!",
    version: "1.0.0",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "BookWise API is healthy",
      database: "connected",
      google_books_api: GOOGLE_BOOKS_API_KEY ? "configured" : "not configured",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(500).json({
      success: false,
      message: "BookWise API is running but database is unavailable",
      database: "disconnected",
    });
  }
});

// =====================================================
// AUTH
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// GOOGLE BOOK NORMALIZER
// =====================================================

function normalizeGoogleBook(item) {
  const info = item?.volumeInfo || {};

  let publishedYear = null;

  if (info.publishedDate) {
    const year = Number(String(info.publishedDate).slice(0, 4));

    if (Number.isInteger(year)) {
      publishedYear = year;
    }
  }

  return {
    google_id: item?.id || null,

    title: info.title || "Unknown title",

    author: Array.isArray(info.authors)
      ? info.authors.join(", ")
      : "Unknown author",

    description: info.description || "",

    cover_url:
      info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null,

    published_year: publishedYear,

    publisher: info.publisher || null,

    categories: Array.isArray(info.categories) ? info.categories : [],

    page_count: info.pageCount || null,

    language: info.language || null,

    average_rating: Number(info.averageRating || 0),

    ratings_count: Number(info.ratingsCount || 0),

    preview_link: info.previewLink || null,

    info_link: info.infoLink || null,
  };
}

// =====================================================
// GOOGLE BOOKS API HELPER
// =====================================================

async function fetchGoogleBooks({
  q,
  startIndex = 0,
  maxResults = 20,
  orderBy = "relevance",
}) {
  if (!GOOGLE_BOOKS_API_KEY) {
    throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
  }

  const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes");

  googleUrl.searchParams.set("q", q);

  googleUrl.searchParams.set("startIndex", String(startIndex));

  googleUrl.searchParams.set("maxResults", String(maxResults));

  googleUrl.searchParams.set("orderBy", orderBy);

  googleUrl.searchParams.set("printType", "books");

  googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

  const response = await fetch(googleUrl.toString());

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Books API error:", data);

    const error = new Error(
      data?.error?.message || "Google Books API request failed",
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

// =====================================================
// ENSURE BOOK EXISTS IN DATABASE
// =====================================================

async function ensureBookInDatabase(identifier) {
  if (
    identifier === undefined ||
    identifier === null ||
    String(identifier).trim() === ""
  ) {
    throw new Error("Book identifier is required");
  }

  const value = String(identifier).trim();

  // ---------------------------------------------------
  // 1. LOCAL POSTGRESQL BOOK ID
  // ---------------------------------------------------

  if (/^\d+$/.test(value)) {
    const localResult = await pool.query(
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
      [Number(value)],
    );

    if (localResult.rows.length > 0) {
      return localResult.rows[0];
    }
  }

  // ---------------------------------------------------
  // 2. GOOGLE BOOK ID ALREADY EXISTS
  // ---------------------------------------------------

  const googleResult = await pool.query(
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
        WHERE google_book_id = $1
        LIMIT 1;
      `,
    [value],
  );

  if (googleResult.rows.length > 0) {
    return googleResult.rows[0];
  }

  // ---------------------------------------------------
  // 3. CHECK GOOGLE API KEY
  // ---------------------------------------------------

  if (!GOOGLE_BOOKS_API_KEY) {
    throw new Error("Google Books API key is not configured");
  }

  // ---------------------------------------------------
  // 4. FETCH GOOGLE BOOK
  // ---------------------------------------------------

  const googleUrl = new URL(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(value)}`,
  );

  googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

  const response = await fetch(googleUrl.toString());

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Books import error:", data);

    const error = new Error(
      data?.error?.message || "Failed to fetch Google Book",
    );

    error.status = response.status;

    throw error;
  }

  const book = normalizeGoogleBook(data);

  const title = book.title;
  const author = book.author;
  const description = book.description;
  const coverUrl = book.cover_url;
  const publishedYear = book.published_year;
  const averageRating = book.average_rating;

  // ---------------------------------------------------
  // 5. CHECK TITLE + AUTHOR
  // ---------------------------------------------------

  const existingTitleAuthor = await pool.query(
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
        WHERE title = $1
          AND author = $2
        LIMIT 1;
      `,
    [title, author],
  );

  if (existingTitleAuthor.rows.length > 0) {
    const existing = existingTitleAuthor.rows[0];

    if (!existing.google_book_id) {
      const updateResult = await pool.query(
        `
            UPDATE books
            SET
              google_book_id = $1,

              description = COALESCE(
                NULLIF(description, ''),
                $2
              ),

              cover_url = COALESCE(
                cover_url,
                $3
              ),

              published_year = COALESCE(
                published_year,
                $4
              ),

              average_rating = CASE
                WHEN average_rating IS NULL
                  OR average_rating = 0
                THEN $5
                ELSE average_rating
              END

            WHERE id = $6

            RETURNING
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              created_at;
          `,
        [
          value,
          description,
          coverUrl,
          publishedYear,
          averageRating,
          existing.id,
        ],
      );

      invalidateCache();

      return updateResult.rows[0];
    }

    return existing;
  }

  // ---------------------------------------------------
  // 6. INSERT GOOGLE BOOK
  // ---------------------------------------------------

  const insertResult = await pool.query(
    `
        INSERT INTO books
        (
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          created_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT (google_book_id)
        WHERE google_book_id IS NOT NULL

        DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          description = EXCLUDED.description,
          cover_url = EXCLUDED.cover_url,
          published_year = EXCLUDED.published_year

        RETURNING
          id,
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          created_at;
      `,
    [value, title, author, description, coverUrl, publishedYear, averageRating],
  );

  invalidateCache();

  return insertResult.rows[0];
}

// =====================================================
// GET ALL LOCAL BOOKS
// =====================================================

app.get("/api/books", async (req, res) => {
  try {
    const hasLimit = req.query.limit !== undefined;

    const hasOffset = req.query.offset !== undefined;

    let limit = null;
    let offset = 0;

    if (hasLimit) {
      limit = Number(req.query.limit);

      if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
        return res.status(400).json({
          success: false,
          error: "limit must be an integer between 1 and 500",
        });
      }
    }

    if (hasOffset) {
      offset = Number(req.query.offset);

      if (!Number.isInteger(offset) || offset < 0) {
        return res.status(400).json({
          success: false,
          error: "offset must be a non-negative integer",
        });
      }
    }

    const countResult = await pool.query(`
          SELECT COUNT(*)::integer AS total
          FROM books;
        `);

    const totalBooks = countResult.rows[0].total;

    let result;

    if (hasLimit) {
      result = await pool.query(
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
              ORDER BY id ASC
              LIMIT $1
              OFFSET $2;
            `,
        [limit, offset],
      );
    } else {
      result = await pool.query(`
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
    }

    res.json({
      success: true,
      count: result.rows.length,
      total: totalBooks,
      books: result.rows,

      pagination: {
        limit: hasLimit ? limit : totalBooks,

        offset,

        hasMore: hasLimit ? offset + result.rows.length < totalBooks : false,
      },
    });
  } catch (error) {
    console.error("Get all books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch books",
    });
  }
});

// =====================================================
// GET SINGLE LOCAL BOOK
// =====================================================

app.get("/api/books/:id", async (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
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

    res.json({
      success: true,
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Get single book error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch book",
    });
  }
});

// =====================================================
// SIMILAR BOOKS
// =====================================================

app.get("/api/books/:id/similar", async (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
    });
  }

  try {
    const similar = await getSimilarBooks(bookId, {
      limit: 10,
    });

    if (similar === null) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      book_id: bookId,
      count: similar.length,
      similar_books: similar,
    });
  } catch (error) {
    console.error("Similar books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch similar books",
    });
  }
});

// =====================================================
// GOOGLE BOOKS BROWSE
// =====================================================

app.get("/api/google-books/browse", async (req, res) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Google Books API key is not configured",
    });
  }

  try {
    const q = String(req.query.q || "books").trim();

    const startIndex = Number(req.query.startIndex ?? 0);

    const maxResults = Number(req.query.maxResults ?? 20);

    const orderBy = String(req.query.orderBy || "relevance");

    if (!Number.isInteger(startIndex) || startIndex < 0) {
      return res.status(400).json({
        success: false,
        error: "startIndex must be a non-negative integer",
      });
    }

    if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 40) {
      return res.status(400).json({
        success: false,
        error: "maxResults must be between 1 and 40",
      });
    }

    const safeOrderBy = ["relevance", "newest"].includes(orderBy)
      ? orderBy
      : "relevance";

    const data = await fetchGoogleBooks({
      q,
      startIndex,
      maxResults,
      orderBy: safeOrderBy,
    });

    const books = (data.items || []).map(normalizeGoogleBook);

    const total = Number(data.totalItems || 0);

    res.json({
      success: true,
      source: "google_books",
      query: q,
      total,
      count: books.length,
      startIndex,
      maxResults,
      orderBy: safeOrderBy,

      hasMore: startIndex + books.length < total,

      books,
    });
  } catch (error) {
    console.error("Google Books browse error:", error);

    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to fetch books from Google Books",
    });
  }
});

// =====================================================
// GOOGLE BOOK DETAILS
// =====================================================

app.get("/api/google-books/:googleBookId", async (req, res) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Google Books API key is not configured",
    });
  }

  const googleBookId = String(req.params.googleBookId || "").trim();

  if (!googleBookId) {
    return res.status(400).json({
      success: false,
      error: "Google book ID is required",
    });
  }

  try {
    const googleUrl = new URL(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(
        googleBookId,
      )}`,
    );

    googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

    const response = await fetch(googleUrl.toString());

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "Google Books request failed",
      });
    }

    res.json({
      success: true,
      source: "google_books",
      book: normalizeGoogleBook(data),
      raw: data,
    });
  } catch (error) {
    console.error("Google Books details error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch Google Books details",
    });
  }
});

// =====================================================
// IMPORT GOOGLE BOOK
// =====================================================

app.post(
  ["/api/google-books/import", "/api/books/import-google"],
  async (req, res) => {
    if (!GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Google Books API key is not configured",
      });
    }

    const googleBookId = String(
      req.body?.google_book_id || req.body?.googleBookId || "",
    ).trim();

    if (!googleBookId) {
      return res.status(400).json({
        success: false,
        error: "google_book_id is required",
      });
    }

    try {
      const existingResult = await pool.query(
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
            WHERE google_book_id = $1
            LIMIT 1;
          `,
        [googleBookId],
      );

      if (existingResult.rows.length > 0) {
        return res.json({
          success: true,
          imported: false,
          already_exists: true,
          source: "database",
          book: existingResult.rows[0],
        });
      }

      const book = await ensureBookInDatabase(googleBookId);

      res.status(201).json({
        success: true,
        imported: true,
        already_exists: false,
        source: "google_books",
        message: "Google book imported into database",
        book,
      });
    } catch (error) {
      console.error("Google book import error:", error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to import Google book",
      });
    }
  },
);

// =====================================================
// SEARCH DATABASE + GOOGLE BOOKS
// =====================================================

app.get("/api/discover/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Search query is required",
    });
  }

  try {
    const databaseResult = await pool.query(
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
            WHERE
              title ILIKE $1
              OR author ILIKE $1
              OR description ILIKE $1
            ORDER BY
              average_rating DESC NULLS LAST,
              title ASC
            LIMIT 50;
          `,
      [`%${query}%`],
    );

    const databaseBooks = databaseResult.rows.map((book) => ({
      ...book,
      source: "database",
      google_id: book.google_book_id || null,
      imported: true,
    }));

    let googleBooks = [];

    if (GOOGLE_BOOKS_API_KEY) {
      try {
        const googleData = await fetchGoogleBooks({
          q: query,
          startIndex: 0,
          maxResults: 20,
          orderBy: "relevance",
        });

        googleBooks = (googleData.items || []).map(normalizeGoogleBook);
      } catch (googleError) {
        console.error("Google search error:", googleError);

        googleBooks = [];
      }
    }

    const googleIds = googleBooks.map((book) => book.google_id).filter(Boolean);

    let importedMap = new Map();

    if (googleIds.length > 0) {
      const importedResult = await pool.query(
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
              WHERE google_book_id =
                ANY($1::text[]);
            `,
        [googleIds],
      );

      importedMap = new Map(
        importedResult.rows.map((book) => [book.google_book_id, book]),
      );
    }

    const formattedGoogleBooks = googleBooks.map((book) => {
      const imported = importedMap.get(book.google_id);

      if (imported) {
        return {
          ...book,
          source: "database",
          imported: true,
          id: imported.id,
          google_book_id: imported.google_book_id,
          database_book: imported,
        };
      }

      return {
        ...book,
        source: "google_books",
        imported: false,
        id: null,
        google_book_id: book.google_id,
      };
    });

    const databaseGoogleIds = new Set(
      databaseBooks.map((book) => book.google_book_id).filter(Boolean),
    );

    const externalGoogleBooks = formattedGoogleBooks.filter(
      (book) => !databaseGoogleIds.has(book.google_id),
    );

    const books = [...databaseBooks, ...externalGoogleBooks];

    res.json({
      success: true,
      query,
      count: books.length,
      database_count: databaseBooks.length,
      google_count: externalGoogleBooks.length,
      google_books_api: GOOGLE_BOOKS_API_KEY ? "available" : "not_configured",
      books,
    });
  } catch (error) {
    console.error("Search books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to search books",
    });
  }
});

// =====================================================
// GENRES
// =====================================================

app.get("/api/genres", async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            id,
            name
          FROM genres
          ORDER BY id ASC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      genres: result.rows,
    });
  } catch (error) {
    console.error("Genres error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch genres",
    });
  }
});

// =====================================================
// FAVORITES
// =====================================================

// GET FAVORITES

app.get("/api/favorites", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
            SELECT
              favorites.id AS favorite_id,
              favorites.user_id,
              favorites.book_id,
              favorites.created_at,

              books.google_book_id,
              books.title,
              books.author,
              books.description,
              books.cover_url,
              books.published_year,
              books.average_rating

            FROM favorites

            INNER JOIN books
              ON books.id =
                 favorites.book_id

            WHERE favorites.user_id = $1

            ORDER BY
              favorites.created_at DESC;
          `,
      [userId],
    );

    res.json({
      success: true,
      count: result.rows.length,
      favorites: result.rows,
    });
  } catch (error) {
    console.error("Favorites error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch favorites",
    });
  }
});

// ADD FAVORITE

app.post("/api/favorites", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const identifier = String(
    req.body?.book_id ||
      req.body?.google_book_id ||
      req.body?.googleBookId ||
      "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

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

// REMOVE FAVORITE

app.delete("/api/favorites/:bookId", authenticateToken, async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  const userId = req.user.userId;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
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
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to remove favorite",
    });
  }
});

// =====================================================
// RATINGS
// =====================================================

// GET RATINGS

app.get("/api/ratings/:bookId", async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Book ID is required",
    });
  }

  let userId = null;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const jwt = await import("jsonwebtoken");

      const token = authHeader.split(" ")[1];

      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

      userId = decoded.userId || decoded.id || null;
    } catch {
      userId = null;
    }
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    const result = await pool.query(
      `
            SELECT

              COUNT(*)::integer
                AS total_ratings,

              COALESCE(
                ROUND(
                  AVG(rating)::numeric,
                  1
                ),
                0
              ) AS average_rating,

              COUNT(*) FILTER (
                WHERE rating = 1
              )::integer AS rating_1,

              COUNT(*) FILTER (
                WHERE rating = 2
              )::integer AS rating_2,

              COUNT(*) FILTER (
                WHERE rating = 3
              )::integer AS rating_3,

              COUNT(*) FILTER (
                WHERE rating = 4
              )::integer AS rating_4,

              COUNT(*) FILTER (
                WHERE rating = 5
              )::integer AS rating_5

            FROM ratings

            WHERE book_id = $1;
          `,
      [bookId],
    );

    let userRating = null;

    if (userId) {
      const userRatingResult = await pool.query(
        `
              SELECT
                id,
                rating,
                created_at
              FROM ratings
              WHERE user_id = $1
                AND book_id = $2
              LIMIT 1;
            `,
        [userId, bookId],
      );

      if (userRatingResult.rows.length > 0) {
        userRating = Number(userRatingResult.rows[0].rating);
      }
    }

    const row = result.rows[0] || {};

    res.json({
      success: true,

      book_id: bookId,

      google_book_id: book.google_book_id || null,

      total_ratings: Number(row.total_ratings || 0),

      average_rating: Number(row.average_rating || 0),

      rating_1: Number(row.rating_1 || 0),

      rating_2: Number(row.rating_2 || 0),

      rating_3: Number(row.rating_3 || 0),

      rating_4: Number(row.rating_4 || 0),

      rating_5: Number(row.rating_5 || 0),

      user_rating: userRating,
    });
  } catch (error) {
    console.error("Get ratings error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch ratings",
    });
  }
});

// ADD OR UPDATE RATING

app.post("/api/ratings", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const { book_id, google_book_id, googleBookId, rating } = req.body;

  const newRating = Number(rating);

  if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) {
    return res.status(400).json({
      success: false,
      error: "Rating must be between 1 and 5",
    });
  }

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
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    const googleId = book.google_book_id || null;

    const existingResult = await pool.query(
      `
            SELECT id
            FROM ratings
            WHERE user_id = $1
              AND book_id = $2
            LIMIT 1;
          `,
      [userId, bookId],
    );

    let result;
    let wasUpdated = false;

    if (existingResult.rows.length > 0) {
      result = await pool.query(
        `
              UPDATE ratings

              SET
                rating = $1,
                google_book_id = $2,
                created_at =
                  CURRENT_TIMESTAMP

              WHERE id = $3
                AND user_id = $4

              RETURNING
                id,
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at;
            `,
        [newRating, googleId, existingResult.rows[0].id, userId],
      );

      wasUpdated = true;
    } else {
      result = await pool.query(
        `
              INSERT INTO ratings
              (
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at
              )
              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP
              )

              RETURNING
                id,
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at;
            `,
        [userId, bookId, googleId, newRating],
      );
    }

    const averageResult = await pool.query(
      `
            SELECT
              COALESCE(
                ROUND(
                  AVG(rating)::numeric,
                  1
                ),
                0
              ) AS average_rating
            FROM ratings
            WHERE book_id = $1;
          `,
      [bookId],
    );

    const averageRating = Number(averageResult.rows[0]?.average_rating || 0);

    await pool.query(
      `
          UPDATE books

          SET average_rating = $1

          WHERE id = $2;
        `,
      [averageRating, bookId],
    );

    invalidateCache();

    res.json({
      success: true,

      message: wasUpdated
        ? "Rating updated successfully"
        : "Rating submitted successfully",

      rating: result.rows[0],

      user_rating: newRating,

      book_id: bookId,

      google_book_id: googleId,

      average_rating: averageRating,
    });
  } catch (error) {
    console.error("Save rating error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to save rating",
    });
  }
});

// =====================================================
// COMMENTS
// =====================================================

// GET COMMENTS

app.get("/api/comments/:bookId", async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

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
            SELECT
              comments.id,
              comments.user_id,
              comments.book_id,
              comments.comment,
              comments.created_at,
              users.name AS user_name

            FROM comments

            INNER JOIN users
              ON users.id =
                 comments.user_id

            WHERE comments.book_id = $1

            ORDER BY
              comments.created_at DESC;
          `,
      [book.id],
    );

    res.json({
      success: true,

      book_id: book.id,

      google_book_id: book.google_book_id || null,

      count: result.rows.length,

      comments: result.rows,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch comments",
    });
  }
});

// ADD COMMENT

app.post("/api/comments", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const { book_id, google_book_id, googleBookId, comment } = req.body;

  const identifier = String(
    book_id || google_book_id || googleBookId || "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  if (!comment || !String(comment).trim()) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot be empty",
    });
  }

  const cleanComment = String(comment).trim();

  if (cleanComment.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot exceed 1000 characters",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            INSERT INTO comments
            (
              user_id,
              book_id,
              comment,
              created_at
            )

            VALUES
            (
              $1,
              $2,
              $3,
              CURRENT_TIMESTAMP
            )

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [userId, book.id, cleanComment],
    );

    const userResult = await pool.query(
      `
            SELECT
              id,
              name
            FROM users
            WHERE id = $1;
          `,
      [userId],
    );

    res.status(201).json({
      success: true,

      message: "Comment added successfully",

      comment: {
        ...result.rows[0],

        user_name: userResult.rows[0]?.name || "User",
      },

      book_id: book.id,

      google_book_id: book.google_book_id || null,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add comment",
    });
  }
});

// UPDATE COMMENT

app.put("/api/comments/:commentId", authenticateToken, async (req, res) => {
  const commentId = Number(req.params.commentId);

  const userId = req.user.userId;

  const { comment } = req.body;

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid comment ID",
    });
  }

  if (!comment || !String(comment).trim()) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot be empty",
    });
  }

  const cleanComment = String(comment).trim();

  if (cleanComment.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot exceed 1000 characters",
    });
  }

  try {
    const result = await pool.query(
      `
            UPDATE comments

            SET
              comment = $1,
              created_at =
                CURRENT_TIMESTAMP

            WHERE id = $2
              AND user_id = $3

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [cleanComment, commentId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Comment not found or you are not allowed to update it",
      });
    }

    const userResult = await pool.query(
      `
            SELECT
              id,
              name
            FROM users
            WHERE id = $1;
          `,
      [userId],
    );

    res.json({
      success: true,

      message: "Comment updated successfully",

      comment: {
        ...result.rows[0],

        user_name: userResult.rows[0]?.name || "User",
      },
    });
  } catch (error) {
    console.error("Update comment error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update comment",
    });
  }
});

// DELETE COMMENT

app.delete("/api/comments/:commentId", authenticateToken, async (req, res) => {
  const commentId = Number(req.params.commentId);

  const userId = req.user.userId;

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid comment ID",
    });
  }

  try {
    const result = await pool.query(
      `
            DELETE FROM comments

            WHERE id = $1
              AND user_id = $2

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [commentId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Comment not found or you are not allowed to delete it",
      });
    }

    res.json({
      success: true,

      message: "Comment deleted successfully",

      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to delete comment",
    });
  }
});

// =====================================================
// READING HISTORY
// =====================================================

app.post("/api/reading-history", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const identifier = String(
    req.body?.book_id ||
      req.body?.google_book_id ||
      req.body?.googleBookId ||
      "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

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
      [userId, book.id],
    );

    res.status(201).json({
      success: true,

      message: "Reading history saved",

      history: result.rows[0],

      book: {
        id: book.id,
        google_book_id: book.google_book_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      },
    });
  } catch (error) {
    console.error("Reading history error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add reading history",
    });
  }
});

// =====================================================
// RECOMMENDATIONS
// =====================================================

app.get("/api/recommendations", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const { type, recommendations } = await getRecommendationsForUser(userId, {
      limit: 20,
    });

    if (type === "popular") {
      const popularResult = await pool.query(`
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating
            FROM books

            ORDER BY
              average_rating DESC NULLS LAST,
              id ASC

            LIMIT 20;
          `);

      return res.json({
        success: true,
        type: "popular",

        message: "Popular books recommended for you",

        count: popularResult.rows.length,

        recommendations: popularResult.rows,
      });
    }

    res.json({
      success: true,
      type: "personalized",

      message: "Recommendations based on your activity (cosine similarity)",

      count: recommendations.length,

      recommendations,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
    });
  }
});

// =====================================================
// POPULAR BOOKS
// =====================================================

app.get("/api/discover/popular", async (req, res) => {
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
            average_rating

          FROM books

          ORDER BY
            average_rating DESC NULLS LAST,
            id ASC

          LIMIT 20;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("Popular books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch popular books",
    });
  }
});

// =====================================================
// ADMIN DASHBOARD
// IMPORTANT: THESE MUST BE BEFORE THE 404 HANDLER
// =====================================================

app.get("/api/admin/dashboard", verifyToken, requireAdmin, async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");

    const users = await pool.query("SELECT COUNT(*) FROM users");

    const comments = await pool.query("SELECT COUNT(*) FROM comments");

    const ratings = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      success: true,

      stats: {
        books: Number(books.rows[0].count),

        users: Number(users.rows[0].count),

        comments: Number(comments.rows[0].count),

        ratings: Number(ratings.rows[0].count),
      },

      admin: req.user?.email || req.user?.name || "Admin",
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      error: "Dashboard loading failed.",
    });
  }
});

// =====================================================
// ADMIN GET BOOKS
// =====================================================

app.get("/api/admin/books", verifyToken, requireAdmin, async (req, res) => {
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
          ORDER BY id DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("Admin get books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin books.",
    });
  }
});

// =====================================================
// ADMIN ADD BOOK
// =====================================================

app.post("/api/admin/books", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, description, cover_url, published_year } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book title is required.",
      });
    }

    if (!author || !String(author).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book author is required.",
      });
    }

    const result = await pool.query(
      `
            INSERT INTO books
            (
              title,
              author,
              description,
              cover_url,
              published_year,
              created_at
            )

            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              CURRENT_TIMESTAMP
            )

            RETURNING *;
          `,
      [
        String(title).trim(),
        String(author).trim(),
        description ? String(description).trim() : "",
        cover_url ? String(cover_url).trim() : null,
        published_year ? Number(published_year) : null,
      ],
    );

    invalidateCache();

    res.status(201).json({
      success: true,
      message: "Book created successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Admin add book error:", error);

    res.status(500).json({
      success: false,
      error: "Book creation failed.",
    });
  }
});

// =====================================================
// ADMIN UPDATE BOOK
// =====================================================

app.put("/api/admin/books/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid book ID.",
      });
    }

    const { title, author, description, cover_url, published_year } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book title is required.",
      });
    }

    if (!author || !String(author).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book author is required.",
      });
    }

    const result = await pool.query(
      `
            UPDATE books

            SET
              title = $1,
              author = $2,
              description = $3,
              cover_url = $4,
              published_year = $5

            WHERE id = $6

            RETURNING *;
          `,
      [
        String(title).trim(),
        String(author).trim(),
        description ? String(description).trim() : "",
        cover_url ? String(cover_url).trim() : null,
        published_year ? Number(published_year) : null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Book not found.",
      });
    }

    invalidateCache();

    res.json({
      success: true,
      message: "Book updated successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Admin update book error:", error);

    res.status(500).json({
      success: false,
      error: "Book update failed.",
    });
  }
});

// =====================================================
// ADMIN DELETE BOOK
// =====================================================

app.delete(
  "/api/admin/books/:id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid book ID.",
        });
      }

      const result = await pool.query(
        `
            DELETE FROM books
            WHERE id = $1
            RETURNING id;
          `,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Book not found.",
        });
      }

      invalidateCache();

      res.json({
        success: true,
        message: "Book deleted successfully.",
        book_id: id,
      });
    } catch (error) {
      console.error("Admin delete book error:", error);

      res.status(500).json({
        success: false,
        error: "Book deletion failed.",
      });
    }
  },
);

// =====================================================
// 404 HANDLER
// THIS MUST COME AFTER ALL ROUTES
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log("========================================");

  console.log("📚 BookWise API");

  console.log("========================================");

  console.log(`🚀 Server: http://localhost:${PORT}`);

  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);

  console.log(`📚 Books: http://localhost:${PORT}/api/books`);

  console.log(
    `🔎 Search: http://localhost:${PORT}/api/discover/search?q=harry+potter`,
  );

  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);

  console.log(`🛡️ Admin: http://localhost:${PORT}/api/admin/dashboard`);

  console.log(
    `🌐 Google Books: ${
      GOOGLE_BOOKS_API_KEY ? "configured" : "NOT CONFIGURED"
    }`,
  );

  console.log("========================================");
});
