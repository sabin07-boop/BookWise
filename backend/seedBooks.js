import pool from "./db.js";

const books = [
  // =========================
  // FICTION
  // =========================

  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg",
  },

  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg",
  },

  {
    title: "1984",
    author: "George Orwell",
    year: 1949,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg",
  },

  {
    title: "Animal Farm",
    author: "George Orwell",
    year: 1945,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780451526342-M.jpg",
  },

  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: 1813,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg",
  },

  {
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    year: 1847,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780141441146-M.jpg",
  },

  {
    title: "Wuthering Heights",
    author: "Emily Brontë",
    year: 1847,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439556-M.jpg",
  },

  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    year: 1951,
    rating: 4.0,
    cover: "https://covers.openlibrary.org/b/isbn/9780316769488-M.jpg",
  },

  {
    title: "The Grapes of Wrath",
    author: "John Steinbeck",
    year: 1939,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9780143039433-M.jpg",
  },

  {
    title: "Of Mice and Men",
    author: "John Steinbeck",
    year: 1937,
    rating: 4.0,
    cover: "https://covers.openlibrary.org/b/isbn/9780142000670-M.jpg",
  },

  // =========================
  // FANTASY
  // =========================

  {
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    year: 1954,
    rating: 4.8,
    cover: "https://covers.openlibrary.org/b/isbn/9780544003415-M.jpg",
  },

  {
    title: "The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    year: 1954,
    rating: 4.7,
    cover: "https://covers.openlibrary.org/b/isbn/9780547928210-M.jpg",
  },

  {
    title: "The Two Towers",
    author: "J.R.R. Tolkien",
    year: 1954,
    rating: 4.7,
    cover: "https://covers.openlibrary.org/b/isbn/9780547928203-M.jpg",
  },

  {
    title: "The Return of the King",
    author: "J.R.R. Tolkien",
    year: 1955,
    rating: 4.8,
    cover: "https://covers.openlibrary.org/b/isbn/9780547928197-M.jpg",
  },

  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    year: 1997,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg",
  },

  {
    title: "Harry Potter and the Chamber of Secrets",
    author: "J.K. Rowling",
    year: 1998,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780439064866-M.jpg",
  },

  {
    title: "Harry Potter and the Prisoner of Azkaban",
    author: "J.K. Rowling",
    year: 1999,
    rating: 4.7,
    cover: "https://covers.openlibrary.org/b/isbn/9780439136365-M.jpg",
  },

  {
    title: "The Chronicles of Narnia",
    author: "C.S. Lewis",
    year: 1956,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9780064471190-M.jpg",
  },

  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    year: 2007,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780756404741-M.jpg",
  },

  {
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    year: 2010,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9780765326355-M.jpg",
  },

  // =========================
  // SCIENCE FICTION
  // =========================

  {
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg",
  },

  {
    title: "Foundation",
    author: "Isaac Asimov",
    year: 1951,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9780553293357-M.jpg",
  },

  {
    title: "I, Robot",
    author: "Isaac Asimov",
    year: 1950,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780553382563-M.jpg",
  },

  {
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    year: 1953,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9781451678189-M.jpg",
  },

  {
    title: "Brave New World",
    author: "Aldous Huxley",
    year: 1932,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780060850524-M.jpg",
  },

  {
    title: "The Martian",
    author: "Andy Weir",
    year: 2011,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780804139021-M.jpg",
  },

  {
    title: "Ready Player One",
    author: "Ernest Cline",
    year: 2011,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780307887443-M.jpg",
  },

  {
    title: "Ender's Game",
    author: "Orson Scott Card",
    year: 1985,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9780812550702-M.jpg",
  },

  // =========================
  // MYSTERY / THRILLER
  // =========================

  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    year: 2019,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9781250301697-M.jpg",
  },

  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    year: 2012,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9780553418361-M.jpg",
  },

  {
    title: "The Girl on the Train",
    author: "Paula Hawkins",
    year: 2015,
    rating: 4.0,
    cover: "https://covers.openlibrary.org/b/isbn/9781594634024-M.jpg",
  },

  {
    title: "The Da Vinci Code",
    author: "Dan Brown",
    year: 2003,
    rating: 4.0,
    cover: "https://covers.openlibrary.org/b/isbn/9780307474278-M.jpg",
  },

  {
    title: "Angels & Demons",
    author: "Dan Brown",
    year: 2000,
    rating: 4.0,
    cover: "https://covers.openlibrary.org/b/isbn/9780743493468-M.jpg",
  },

  // =========================
  // SELF HELP
  // =========================

  {
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg",
  },

  {
    title: "Deep Work",
    author: "Cal Newport",
    year: 2016,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9781455586691-M.jpg",
  },

  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    year: 1989,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9781982137274-M.jpg",
  },

  {
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    year: 1936,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9780671027032-M.jpg",
  },

  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    year: 1937,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9781585424337-M.jpg",
  },

  {
    title: "The Power of Now",
    author: "Eckhart Tolle",
    year: 1997,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9781577314806-M.jpg",
  },

  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    year: 1946,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780807014295-M.jpg",
  },

  // =========================
  // FINANCE
  // =========================

  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: 2020,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780857197689-M.jpg",
  },

  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    year: 1997,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9781612681139-M.jpg",
  },

  {
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    year: 1949,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780060555665-M.jpg",
  },

  {
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    year: 1973,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780393330335-M.jpg",
  },

  // =========================
  // CLASSICS
  // =========================

  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    year: 1988,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg",
  },

  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    year: 1943,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780156012195-M.jpg",
  },

  {
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    year: 1605,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780060934347-M.jpg",
  },

  {
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    year: 1890,
    rating: 4.2,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439570-M.jpg",
  },

  {
    title: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439846-M.jpg",
  },

  {
    title: "Frankenstein",
    author: "Mary Shelley",
    year: 1818,
    rating: 4.1,
    cover: "https://covers.openlibrary.org/b/isbn/9780141439471-M.jpg",
  },

  // =========================
  // BIOGRAPHY
  // =========================

  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    year: 2011,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9781451648539-M.jpg",
  },

  {
    title: "Einstein",
    author: "Walter Isaacson",
    year: 2007,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780743264747-M.jpg",
  },

  {
    title: "Long Walk to Freedom",
    author: "Nelson Mandela",
    year: 1994,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780316548182-M.jpg",
  },

  {
    title: "Becoming",
    author: "Michelle Obama",
    year: 2018,
    rating: 4.6,
    cover: "https://covers.openlibrary.org/b/isbn/9781524763138-M.jpg",
  },

  // =========================
  // TECHNOLOGY
  // =========================

  {
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg",
  },

  {
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    year: 1999,
    rating: 4.5,
    cover: "https://covers.openlibrary.org/b/isbn/9780135957059-M.jpg",
  },

  {
    title: "Design Patterns",
    author: "Erich Gamma",
    year: 1994,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9780201633610-M.jpg",
  },

  {
    title: "You Don't Know JS",
    author: "Kyle Simpson",
    year: 2014,
    rating: 4.4,
    cover: "https://covers.openlibrary.org/b/isbn/9781491904244-M.jpg",
  },

  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    year: 2018,
    rating: 4.3,
    cover: "https://covers.openlibrary.org/b/isbn/9781593279509-M.jpg",
  },
];

// =====================================================
// INSERT BOOKS
// =====================================================

async function seedBooks() {
  try {
    console.log("Starting book import...");

    let inserted = 0;
    let skipped = 0;

    for (const book of books) {
      try {
        const result = await pool.query(
          `
          INSERT INTO books
            (
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating
            )
          VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
          ON CONFLICT DO NOTHING
          RETURNING id;
          `,
          [
            book.title,
            book.author,
            `${book.title} by ${book.author}. A book available in the BookWise library.`,
            book.cover,
            book.year,
            book.rating,
          ],
        );

        if (result.rows.length > 0) {
          inserted++;

          console.log(`Added: ${book.title}`);
        } else {
          skipped++;

          console.log(`Skipped: ${book.title}`);
        }
      } catch (error) {
        console.error(`Error adding ${book.title}:`, error.message);
      }
    }

    console.log("");
    console.log("==============================");
    console.log("BOOK IMPORT COMPLETE");
    console.log("==============================");
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total supplied: ${books.length}`);
    console.log("==============================");
  } catch (error) {
    console.error("Book import failed:", error);
  } finally {
    await pool.end();
  }
}

seedBooks();
