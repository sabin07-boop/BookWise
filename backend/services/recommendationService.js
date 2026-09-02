import pool from "../db.js";
import { tokenize, buildTfIdf, cosineSimilarity } from "../utils/tfidf.js";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache = {
  builtAt: 0,
  vectors: null,
  books: null,
};

function invalidateCache() {
  cache.builtAt = 0;
}

async function loadBooksWithGenres() {
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
      COALESCE(STRING_AGG(DISTINCT genres.name, ' '), '') AS genre_text
    FROM books
    LEFT JOIN book_genres ON book_genres.book_id = books.id
    LEFT JOIN genres ON genres.id = book_genres.genre_id
    GROUP BY books.id
    ORDER BY books.id ASC;
  `);

  return result.rows;
}

async function buildBookVectors({ force = false } = {}) {
  const isStale = Date.now() - cache.builtAt > CACHE_TTL_MS;

  if (!force && !isStale && cache.vectors) {
    return cache;
  }

  const books = await loadBooksWithGenres();

  const documents = books.map((book) => {
    const text = [
      book.title,
      book.author,
      book.description,
      book.genre_text,
      book.genre_text,
    ].join(" ");

    return { id: book.id, tokens: tokenize(text) };
  });

  const { vectors } = buildTfIdf(documents);
  const booksById = new Map(books.map((book) => [book.id, book]));

  cache = { builtAt: Date.now(), vectors, books: booksById };

  return cache;
}

async function getUserInteractions(userId) {
  const [favorites, ratings, history] = await Promise.all([
    pool.query(`SELECT book_id FROM favorites WHERE user_id = $1;`, [userId]),
    pool.query(`SELECT book_id, rating FROM ratings WHERE user_id = $1;`, [
      userId,
    ]),
    pool.query(`SELECT book_id FROM reading_history WHERE user_id = $1;`, [
      userId,
    ]),
  ]);

  return {
    favorites: favorites.rows.map((row) => row.book_id),
    ratings: ratings.rows,
    history: history.rows.map((row) => row.book_id),
  };
}

function buildUserProfileVector(vectors, interactions) {
  const weightedBooks = [];

  for (const bookId of interactions.favorites) {
    weightedBooks.push({ bookId, weight: 3 });
  }

  for (const { book_id, rating } of interactions.ratings) {
    const numericRating = Number(rating);

    if (numericRating >= 4) {
      weightedBooks.push({ bookId: book_id, weight: 5 });
    } else if (numericRating === 3) {
      weightedBooks.push({ bookId: book_id, weight: 1 });
    }
  }

  for (const bookId of interactions.history) {
    weightedBooks.push({ bookId, weight: 2 });
  }

  const profile = new Map();
  let totalWeight = 0;

  for (const { bookId, weight } of weightedBooks) {
    const vector = vectors.get(bookId);
    if (!vector) continue;

    totalWeight += weight;

    for (const [token, value] of vector.entries()) {
      profile.set(token, (profile.get(token) || 0) + value * weight);
    }
  }

  if (totalWeight === 0) return null;

  let sumOfSquares = 0;
  for (const value of profile.values()) sumOfSquares += value * value;
  const magnitude = Math.sqrt(sumOfSquares) || 1;

  for (const [token, value] of profile.entries()) {
    profile.set(token, value / magnitude);
  }

  return profile;
}

function formatBook(book, score) {
  return {
    id: book.id,
    google_book_id: book.google_book_id,
    title: book.title,
    author: book.author,
    description: book.description,
    cover_url: book.cover_url,
    published_year: book.published_year,
    average_rating: book.average_rating,
    similarity_score: Number(score.toFixed(4)),
  };
}

async function getRecommendationsForUser(userId, { limit = 20 } = {}) {
  const { vectors, books } = await buildBookVectors();
  const interactions = await getUserInteractions(userId);

  const interactedIds = new Set([
    ...interactions.favorites,
    ...interactions.ratings.map((row) => row.book_id),
    ...interactions.history,
  ]);

  const profileVector = buildUserProfileVector(vectors, interactions);

  if (!profileVector) {
    return { type: "popular", recommendations: null };
  }

  const scored = [];

  for (const [bookId, vector] of vectors.entries()) {
    if (interactedIds.has(bookId)) continue;

    const score = cosineSimilarity(profileVector, vector);
    if (score <= 0) continue;

    scored.push({ book: books.get(bookId), score });
  }

  scored.sort((a, b) => b.score - a.score);

  const recommendations = scored
    .slice(0, limit)
    .map(({ book, score }) => formatBook(book, score));

  if (recommendations.length === 0) {
    return { type: "popular", recommendations: null };
  }

  return { type: "personalized", recommendations };
}

async function getSimilarBooks(bookId, { limit = 10 } = {}) {
  const { vectors, books } = await buildBookVectors();

  const targetVector = vectors.get(bookId);
  if (!targetVector) return null;

  const scored = [];

  for (const [id, vector] of vectors.entries()) {
    if (id === bookId) continue;

    const score = cosineSimilarity(targetVector, vector);
    if (score <= 0) continue;

    scored.push({ book: books.get(id), score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, limit)
    .map(({ book, score }) => formatBook(book, score));
}

export {
  buildBookVectors,
  invalidateCache,
  getRecommendationsForUser,
  getSimilarBooks,
};
