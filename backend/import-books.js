import pool from "./db.js";

const categories = [
  "Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Technology",
  "Self-Help",
  "Romance",
  "Thriller",
  "Horror",
  "Biography",
  "History",
  "Adventure",
  "Philosophy",
  "Psychology",
];

const queries = {
  Fiction: "fiction",
  "Science Fiction": "science fiction",
  Fantasy: "fantasy",
  Mystery: "mystery",
  Technology: "technology",
  "Self-Help": "self help",
  Romance: "romance",
  Thriller: "thriller",
  Horror: "horror",
  Biography: "biography",
  History: "history",
  Adventure: "adventure",
  Philosophy: "philosophy",
  Psychology: "psychology",
};

async function fetchBooks(query) {
  const url =
    `https://openlibrary.org/search.json` +
    `?q=${encodeURIComponent(query)}` +
    `&limit=25` +
    `&fields=title,author_name,first_publish_year,cover_i,ratings_average`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  return data.docs;
}

async function importBooks() {
  try {
    console.log("📚 Starting BookWise book import...");

    let imported = 0;

    for (const category of categories) {
      console.log(`\n🔎 Fetching ${category}...`);

      const books = await fetchBooks(queries[category]);

      for (const book of books) {
        if (!book.title || !book.author_name?.length) {
          continue;
        }

        const title = book.title;
        const author = book.author_name[0];

        const year = book.first_publish_year || null;

        const rating = book.ratings_average || null;

        const coverUrl = book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null;

        const result = await pool.query(
          `
          INSERT INTO books
          (
            title,
            author,
            description,
            cover_url,
            published_year,
            average_rating,
            genre
          )
          VALUES
          ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (title, author)
          DO NOTHING
          RETURNING id;
          `,
          [
            title,
            author,
            `${title} is a ${category.toLowerCase()} book by ${author}.`,
            coverUrl,
            year,
            rating,
            category,
          ],
        );

        if (result.rows.length === 0) {
          continue;
        }

        const bookId = result.rows[0].id;

        const genreResult = await pool.query(
          `
          SELECT id
          FROM genres
          WHERE name = $1;
          `,
          [category],
        );

        if (genreResult.rows.length > 0) {
          const genreId = genreResult.rows[0].id;

          await pool.query(
            `
            INSERT INTO book_genres
            (book_id, genre_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
            `,
            [bookId, genreId],
          );
        }

        imported++;

        console.log(`✅ ${imported}. ${title} — ${author}`);
      }
    }

    console.log("\n==============================");
    console.log("🎉 IMPORT COMPLETE");
    console.log(`📚 New books imported: ${imported}`);
    console.log("==============================");
  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await pool.end();
  }
}

importBooks();
