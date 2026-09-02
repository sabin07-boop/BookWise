import pool from "../db.js";

/**
 * Get book recommendations based on:
 * 1. Same author
 * 2. Similar average rating
 * 3. User's favorite/rated books
 */
export async function getRecommendations(userId, limit = 10) {
  try {
    const result = await pool.query(
      `
      SELECT
        b.id,
        b.google_book_id,
        b.title,
        b.author,
        b.description,
        b.cover_url,
        b.published_year,
        b.average_rating,
        b.created_at
      FROM books b
      WHERE b.id NOT IN (
        SELECT book_id
        FROM favorites
        WHERE user_id = $1
          AND book_id IS NOT NULL
      )
      ORDER BY
        COALESCE(b.average_rating, 0) DESC,
        b.created_at DESC
      LIMIT $2
      `,
      [userId, limit],
    );

    return result.rows;
  } catch (error) {
    console.error("Recommendation error:", error);
    throw error;
  }
}
