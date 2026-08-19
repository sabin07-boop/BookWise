import pool from "./db.js";

const OPEN_LIBRARY_API = "https://openlibrary.org/search.json";

// =====================================================
// Create a guaranteed fallback SVG image
// =====================================================

function createFallbackCover(title, author) {
  const safeTitle = title.replace(/[<>&"']/g, "").substring(0, 30);

  const safeAuthor = author.replace(/[<>&"']/g, "").substring(0, 25);

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="400"
      height="600"
      viewBox="0 0 400 600"
    >
      <rect
        width="400"
        height="600"
        fill="#eee7dc"
      />

      <rect
        x="25"
        y="25"
        width="350"
        height="550"
        rx="20"
        fill="#f8f5ef"
        stroke="#d8c9b8"
        stroke-width="3"
      />

      <text
        x="200"
        y="245"
        text-anchor="middle"
        font-size="70"
      >
        📖
      </text>

      <text
        x="200"
        y="335"
        text-anchor="middle"
        font-family="Arial"
        font-size="25"
        font-weight="bold"
        fill="#2d211b"
      >
        BookWise
      </text>

      <text
        x="200"
        y="385"
        text-anchor="middle"
        font-family="Arial"
        font-size="18"
        fill="#6d6259"
      >
        ${safeTitle}
      </text>

      <text
        x="200"
        y="420"
        text-anchor="middle"
        font-family="Arial"
        font-size="15"
        fill="#8b8178"
      >
        ${safeAuthor}
      </text>

      <text
        x="200"
        y="530"
        text-anchor="middle"
        font-family="Arial"
        font-size="14"
        fill="#a58b70"
      >
        NO COVER AVAILABLE
      </text>
    </svg>
  `;

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// =====================================================
// Check whether image actually exists
// =====================================================

async function imageExists(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
    });

    if (
      response.ok &&
      response.headers.get("content-type")?.startsWith("image/")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// =====================================================
// Search Open Library
// =====================================================

async function findRealCover(title, author) {
  try {
    const query = `${title} ${author}`;

    const url = `${OPEN_LIBRARY_API}?q=${encodeURIComponent(
      query,
    )}&limit=10&fields=title,author_name,cover_i`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.docs || data.docs.length === 0) {
      return null;
    }

    // Try several results instead of only the first
    for (const book of data.docs) {
      if (!book.cover_i) {
        continue;
      }

      const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;

      console.log(`Checking cover: ${coverUrl}`);

      const valid = await imageExists(coverUrl);

      if (valid) {
        return coverUrl;
      }
    }

    return null;
  } catch (error) {
    console.log(`Search failed for ${title}:`, error.message);

    return null;
  }
}

// =====================================================
// Update all books
// =====================================================

async function updateCovers() {
  try {
    console.log("");
    console.log("========================================");
    console.log(" BOOKWISE COVER REPAIR");
    console.log("========================================");
    console.log("");

    const result = await pool.query(`
      SELECT
        id,
        title,
        author
      FROM books
      ORDER BY id;
    `);

    const books = result.rows;

    console.log(`Found ${books.length} books.`);

    console.log("");

    let realCovers = 0;
    let fallbackCovers = 0;

    for (const book of books) {
      console.log(`Processing: ${book.title}`);

      // ---------------------------------------------
      // Search for working real cover
      // ---------------------------------------------

      const realCover = await findRealCover(book.title, book.author);

      // ---------------------------------------------
      // Real cover found
      // ---------------------------------------------

      if (realCover) {
        await pool.query(
          `
          UPDATE books
          SET cover_url = $1
          WHERE id = $2;
          `,
          [realCover, book.id],
        );

        realCovers++;

        console.log("  ✓ Working cover found");
      }

      // ---------------------------------------------
      // No real cover
      // ---------------------------------------------
      else {
        const fallback = createFallbackCover(book.title, book.author);

        await pool.query(
          `
          UPDATE books
          SET cover_url = $1
          WHERE id = $2;
          `,
          [fallback, book.id],
        );

        fallbackCovers++;

        console.log("  ✓ BookWise fallback created");
      }

      console.log("");

      // Avoid sending requests too quickly
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    console.log("========================================");

    console.log(" COVER REPAIR COMPLETE");

    console.log("========================================");

    console.log(`Total books: ${books.length}`);

    console.log(`Real covers: ${realCovers}`);

    console.log(`Fallback covers: ${fallbackCovers}`);

    console.log("========================================");
  } catch (error) {
    console.error("Cover repair failed:", error);
  } finally {
    await pool.end();
  }
}

updateCovers();
