import pool from "./db.js";

const books = [
  // =====================================================
  // FICTION
  // =====================================================

  {
    title: "The Kite Runner",
    author: "Khaled Hosseini",
    year: 2003,
    rating: 4.4,
    isbn: "9781594631931",
  },
  {
    title: "A Thousand Splendid Suns",
    author: "Khaled Hosseini",
    year: 2007,
    rating: 4.4,
    isbn: "9781594489501",
  },
  {
    title: "Life of Pi",
    author: "Yann Martel",
    year: 2001,
    rating: 4.3,
    isbn: "9780156027328",
  },
  {
    title: "The Book Thief",
    author: "Markus Zusak",
    year: 2005,
    rating: 4.4,
    isbn: "9780375842207",
  },
  {
    title: "The Road",
    author: "Cormac McCarthy",
    year: 2006,
    rating: 4.2,
    isbn: "9780307387899",
  },
  {
    title: "The Help",
    author: "Kathryn Stockett",
    year: 2009,
    rating: 4.3,
    isbn: "9780425232200",
  },
  {
    title: "The Fault in Our Stars",
    author: "John Green",
    year: 2012,
    rating: 4.2,
    isbn: "9780525478812",
  },
  {
    title: "Looking for Alaska",
    author: "John Green",
    year: 2005,
    rating: 4.0,
    isbn: "9780062208112",
  },
  {
    title: "The Perks of Being a Wallflower",
    author: "Stephen Chbosky",
    year: 1999,
    rating: 4.2,
    isbn: "9781451696196",
  },
  {
    title: "Normal People",
    author: "Sally Rooney",
    year: 2018,
    rating: 4.0,
    isbn: "9781984822178",
  },

  // =====================================================
  // FANTASY
  // =====================================================

  {
    title: "A Game of Thrones",
    author: "George R.R. Martin",
    year: 1996,
    rating: 4.5,
    isbn: "9780553593716",
  },
  {
    title: "A Clash of Kings",
    author: "George R.R. Martin",
    year: 1998,
    rating: 4.5,
    isbn: "9780553579901",
  },
  {
    title: "A Storm of Swords",
    author: "George R.R. Martin",
    year: 2000,
    rating: 4.6,
    isbn: "9780553573428",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    rating: 4.7,
    isbn: "9780547928227",
  },
  {
    title: "The Silmarillion",
    author: "J.R.R. Tolkien",
    year: 1977,
    rating: 4.2,
    isbn: "9780618126989",
  },
  {
    title: "The Golden Compass",
    author: "Philip Pullman",
    year: 1995,
    rating: 4.2,
    isbn: "9780440418320",
  },
  {
    title: "The Subtle Knife",
    author: "Philip Pullman",
    year: 1997,
    rating: 4.1,
    isbn: "9780439954624",
  },
  {
    title: "The Amber Spyglass",
    author: "Philip Pullman",
    year: 2000,
    rating: 4.2,
    isbn: "9780439951793",
  },
  {
    title: "Mistborn",
    author: "Brandon Sanderson",
    year: 2006,
    rating: 4.5,
    isbn: "9780765311788",
  },
  {
    title: "The Final Empire",
    author: "Brandon Sanderson",
    year: 2006,
    rating: 4.5,
    isbn: "9780765350381",
  },

  // =====================================================
  // SCIENCE FICTION
  // =====================================================

  {
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    rating: 4.0,
    isbn: "9780441569595",
  },
  {
    title: "Snow Crash",
    author: "Neal Stephenson",
    year: 1992,
    rating: 4.1,
    isbn: "9780553380958",
  },
  {
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    year: 1979,
    rating: 4.4,
    isbn: "9780345391803",
  },
  {
    title: "The Time Machine",
    author: "H.G. Wells",
    year: 1895,
    rating: 4.0,
    isbn: "9780553213515",
  },
  {
    title: "The War of the Worlds",
    author: "H.G. Wells",
    year: 1898,
    rating: 4.0,
    isbn: "9780451528551",
  },
  {
    title: "Do Androids Dream of Electric Sheep?",
    author: "Philip K. Dick",
    year: 1968,
    rating: 4.2,
    isbn: "9780345404473",
  },
  {
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    year: 1969,
    rating: 4.3,
    isbn: "9780441478125",
  },
  {
    title: "2001: A Space Odyssey",
    author: "Arthur C. Clarke",
    year: 1968,
    rating: 4.2,
    isbn: "9780451450525",
  },
  {
    title: "The Three-Body Problem",
    author: "Cixin Liu",
    year: 2008,
    rating: 4.3,
    isbn: "9780765382030",
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    year: 2021,
    rating: 4.6,
    isbn: "9780593135204",
  },

  // =====================================================
  // MYSTERY / THRILLER
  // =====================================================

  {
    title: "The Hound of the Baskervilles",
    author: "Arthur Conan Doyle",
    year: 1902,
    rating: 4.3,
    isbn: "9780140437869",
  },
  {
    title: "Murder on the Orient Express",
    author: "Agatha Christie",
    year: 1934,
    rating: 4.3,
    isbn: "9780062693662",
  },
  {
    title: "And Then There Were None",
    author: "Agatha Christie",
    year: 1939,
    rating: 4.4,
    isbn: "9780062073488",
  },
  {
    title: "The Murder of Roger Ackroyd",
    author: "Agatha Christie",
    year: 1926,
    rating: 4.3,
    isbn: "9780062074001",
  },
  {
    title: "Big Little Lies",
    author: "Liane Moriarty",
    year: 2014,
    rating: 4.2,
    isbn: "9780425274866",
  },
  {
    title: "Sharp Objects",
    author: "Gillian Flynn",
    year: 2006,
    rating: 4.0,
    isbn: "9780307341556",
  },
  {
    title: "The Woman in the Window",
    author: "A.J. Finn",
    year: 2018,
    rating: 4.0,
    isbn: "9780062678416",
  },
  {
    title: "The Woman in Cabin 10",
    author: "Ruth Ware",
    year: 2016,
    rating: 4.0,
    isbn: "9781501128035",
  },
  {
    title: "The Couple Next Door",
    author: "Shari Lapena",
    year: 2016,
    rating: 4.0,
    isbn: "9780735221086",
  },
  {
    title: "Before I Go to Sleep",
    author: "S.J. Watson",
    year: 2011,
    rating: 4.0,
    isbn: "9780062060568",
  },

  // =====================================================
  // ROMANCE
  // =====================================================

  {
    title: "The Notebook",
    author: "Nicholas Sparks",
    year: 1996,
    rating: 4.1,
    isbn: "9780446605236",
  },
  {
    title: "Me Before You",
    author: "Jojo Moyes",
    year: 2012,
    rating: 4.4,
    isbn: "9780143124542",
  },
  {
    title: "The Rosie Project",
    author: "Graeme Simsion",
    year: 2013,
    rating: 4.1,
    isbn: "9781476729091",
  },
  {
    title: "The Time Traveler's Wife",
    author: "Audrey Niffenegger",
    year: 2003,
    rating: 4.1,
    isbn: "9780156029438",
  },
  {
    title: "One Day",
    author: "David Nicholls",
    year: 2009,
    rating: 4.0,
    isbn: "9780307474711",
  },
  {
    title: "It Ends with Us",
    author: "Colleen Hoover",
    year: 2016,
    rating: 4.2,
    isbn: "9781501110368",
  },
  {
    title: "It Starts with Us",
    author: "Colleen Hoover",
    year: 2022,
    rating: 4.1,
    isbn: "9781668001226",
  },
  {
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    year: 2021,
    rating: 4.3,
    isbn: "9780593336823",
  },
  {
    title: "Beach Read",
    author: "Emily Henry",
    year: 2020,
    rating: 4.1,
    isbn: "9781984806734",
  },
  {
    title: "People We Meet on Vacation",
    author: "Emily Henry",
    year: 2021,
    rating: 4.2,
    isbn: "9781984806758",
  },

  // =====================================================
  // SELF HELP / PRODUCTIVITY
  // =====================================================

  {
    title: "The 5 AM Club",
    author: "Robin Sharma",
    year: 2018,
    rating: 4.0,
    isbn: "9781443456624",
  },
  {
    title: "The Mountain Is You",
    author: "Brianna Wiest",
    year: 2020,
    rating: 4.3,
    isbn: "9781945796067",
  },
  {
    title: "Can't Hurt Me",
    author: "David Goggins",
    year: 2018,
    rating: 4.6,
    isbn: "9781544512280",
  },
  {
    title: "Never Finished",
    author: "David Goggins",
    year: 2022,
    rating: 4.5,
    isbn: "9781544534062",
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    year: 2016,
    rating: 4.1,
    isbn: "9780062457714",
  },
  {
    title: "Everything Is Figureoutable",
    author: "Marie Forleo",
    year: 2019,
    rating: 4.1,
    isbn: "9780525535012",
  },
  {
    title: "Essentialism",
    author: "Greg McKeown",
    year: 2014,
    rating: 4.4,
    isbn: "9780804137386",
  },
  {
    title: "The One Thing",
    author: "Gary Keller",
    year: 2012,
    rating: 4.3,
    isbn: "9781885167774",
  },
  {
    title: "Getting Things Done",
    author: "David Allen",
    year: 2001,
    rating: 4.2,
    isbn: "9780142000281",
  },
  {
    title: "Mindset",
    author: "Carol S. Dweck",
    year: 2006,
    rating: 4.3,
    isbn: "9780345472328",
  },

  // =====================================================
  // BUSINESS / FINANCE
  // =====================================================

  {
    title: "The Millionaire Fastlane",
    author: "M.J. DeMarco",
    year: 2011,
    rating: 4.2,
    isbn: "9780984358101",
  },
  {
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    year: 1926,
    rating: 4.3,
    isbn: "9780451205360",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    year: 2014,
    rating: 4.2,
    isbn: "9780804139298",
  },
  {
    title: "Good to Great",
    author: "Jim Collins",
    year: 2001,
    rating: 4.2,
    isbn: "9780066620992",
  },
  {
    title: "Start with Why",
    author: "Simon Sinek",
    year: 2009,
    rating: 4.2,
    isbn: "9781591846444",
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    year: 2011,
    rating: 4.2,
    isbn: "9780307887894",
  },
  {
    title: "Think Again",
    author: "Adam Grant",
    year: 2021,
    rating: 4.3,
    isbn: "9781984878106",
  },
  {
    title: "Outliers",
    author: "Malcolm Gladwell",
    year: 2008,
    rating: 4.3,
    isbn: "9780316017930",
  },
  {
    title: "Blink",
    author: "Malcolm Gladwell",
    year: 2005,
    rating: 4.0,
    isbn: "9780316010665",
  },
  {
    title: "The Tipping Point",
    author: "Malcolm Gladwell",
    year: 2000,
    rating: 4.0,
    isbn: "9780316346627",
  },

  // =====================================================
  // BIOGRAPHY
  // =====================================================

  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    year: 1947,
    rating: 4.6,
    isbn: "9780553296983",
  },
  {
    title: "Educated",
    author: "Tara Westover",
    year: 2018,
    rating: 4.6,
    isbn: "9780399590504",
  },
  {
    title: "Shoe Dog",
    author: "Phil Knight",
    year: 2016,
    rating: 4.4,
    isbn: "9781501135910",
  },
  {
    title: "Born a Crime",
    author: "Trevor Noah",
    year: 2016,
    rating: 4.6,
    isbn: "9780399588174",
  },
  {
    title: "Open",
    author: "Andre Agassi",
    year: 2009,
    rating: 4.4,
    isbn: "9780307388407",
  },
  {
    title: "The Story of My Experiments with Truth",
    author: "Mahatma Gandhi",
    year: 1927,
    rating: 4.2,
    isbn: "9780486476810",
  },
  {
    title: "I Know Why the Caged Bird Sings",
    author: "Maya Angelou",
    year: 1969,
    rating: 4.5,
    isbn: "9780812980028",
  },
  {
    title: "Alexander Hamilton",
    author: "Ron Chernow",
    year: 2004,
    rating: 4.5,
    isbn: "9780143034759",
  },
  {
    title: "Churchill: Walking with Destiny",
    author: "Andrew Roberts",
    year: 2018,
    rating: 4.5,
    isbn: "9781101981009",
  },
  {
    title: "Leonardo da Vinci",
    author: "Walter Isaacson",
    year: 2017,
    rating: 4.4,
    isbn: "9781501139154",
  },

  // =====================================================
  // HISTORY
  // =====================================================

  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    year: 2011,
    rating: 4.5,
    isbn: "9780062316097",
  },
  {
    title: "Homo Deus",
    author: "Yuval Noah Harari",
    year: 2015,
    rating: 4.3,
    isbn: "9780062464316",
  },
  {
    title: "21 Lessons for the 21st Century",
    author: "Yuval Noah Harari",
    year: 2018,
    rating: 4.2,
    isbn: "9780525512172",
  },
  {
    title: "Guns, Germs, and Steel",
    author: "Jared Diamond",
    year: 1997,
    rating: 4.3,
    isbn: "9780393317558",
  },
  {
    title: "The Silk Roads",
    author: "Peter Frankopan",
    year: 2015,
    rating: 4.2,
    isbn: "9781101912379",
  },
  {
    title: "A People's History of the United States",
    author: "Howard Zinn",
    year: 1980,
    rating: 4.3,
    isbn: "9780060838652",
  },
  {
    title: "1776",
    author: "David McCullough",
    year: 2005,
    rating: 4.3,
    isbn: "9780743226721",
  },
  {
    title: "Team of Rivals",
    author: "Doris Kearns Goodwin",
    year: 2005,
    rating: 4.5,
    isbn: "9780743270755",
  },
  {
    title: "The Wright Brothers",
    author: "David McCullough",
    year: 2015,
    rating: 4.4,
    isbn: "9781476728759",
  },
  {
    title: "The Guns of August",
    author: "Barbara W. Tuchman",
    year: 1962,
    rating: 4.4,
    isbn: "9780345476098",
  },

  // =====================================================
  // SCIENCE
  // =====================================================

  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    year: 1988,
    rating: 4.3,
    isbn: "9780553380163",
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    year: 1976,
    rating: 4.3,
    isbn: "9780198788607",
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    year: 1980,
    rating: 4.6,
    isbn: "9780345539434",
  },
  {
    title: "Astrophysics for People in a Hurry",
    author: "Neil deGrasse Tyson",
    year: 2017,
    rating: 4.3,
    isbn: "9780393609394",
  },
  {
    title: "The Gene",
    author: "Siddhartha Mukherjee",
    year: 2016,
    rating: 4.4,
    isbn: "9781476733500",
  },
  {
    title: "The Immortal Life of Henrietta Lacks",
    author: "Rebecca Skloot",
    year: 2010,
    rating: 4.4,
    isbn: "9781400052189",
  },
  {
    title: "Silent Spring",
    author: "Rachel Carson",
    year: 1962,
    rating: 4.4,
    isbn: "9780618249060",
  },
  {
    title: "The Elegant Universe",
    author: "Brian Greene",
    year: 1999,
    rating: 4.2,
    isbn: "9780393338102",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    year: 2011,
    rating: 4.3,
    isbn: "9780374533557",
  },
  {
    title: "Why We Sleep",
    author: "Matthew Walker",
    year: 2017,
    rating: 4.2,
    isbn: "9781501144318",
  },

  // =====================================================
  // TECHNOLOGY / PROGRAMMING
  // =====================================================

  {
    title: "The Clean Coder",
    author: "Robert C. Martin",
    year: 2011,
    rating: 4.2,
    isbn: "9780137081073",
  },
  {
    title: "Refactoring",
    author: "Martin Fowler",
    year: 1999,
    rating: 4.4,
    isbn: "9780134757599",
  },
  {
    title: "Code Complete",
    author: "Steve McConnell",
    year: 1993,
    rating: 4.5,
    isbn: "9780735619678",
  },
  {
    title: "The Mythical Man-Month",
    author: "Frederick P. Brooks Jr.",
    year: 1975,
    rating: 4.2,
    isbn: "9780201835953",
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    year: 1990,
    rating: 4.5,
    isbn: "9780262033848",
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    year: 2008,
    rating: 4.1,
    isbn: "9780596517748",
  },
  {
    title: "Learning React",
    author: "Alex Banks",
    year: 2020,
    rating: 4.1,
    isbn: "9781492051725",
  },
  {
    title: "Node.js Design Patterns",
    author: "Mario Casciaro",
    year: 2020,
    rating: 4.4,
    isbn: "9781839214110",
  },
  {
    title: "Python Crash Course",
    author: "Eric Matthes",
    year: 2019,
    rating: 4.6,
    isbn: "9781593279288",
  },
  {
    title: "Automate the Boring Stuff with Python",
    author: "Al Sweigart",
    year: 2019,
    rating: 4.5,
    isbn: "9781593279929",
  },

  // =====================================================
  // CLASSICS
  // =====================================================

  {
    title: "Great Expectations",
    author: "Charles Dickens",
    year: 1861,
    rating: 4.1,
    isbn: "9780141439563",
  },
  {
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    year: 1859,
    rating: 4.2,
    isbn: "9780141439600",
  },
  {
    title: "Oliver Twist",
    author: "Charles Dickens",
    year: 1838,
    rating: 4.1,
    isbn: "9780141439747",
  },
  {
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    year: 1844,
    rating: 4.6,
    isbn: "9780140449266",
  },
  {
    title: "Les Misérables",
    author: "Victor Hugo",
    year: 1862,
    rating: 4.4,
    isbn: "9780451419439",
  },
  {
    title: "War and Peace",
    author: "Leo Tolstoy",
    year: 1869,
    rating: 4.4,
    isbn: "9781400079988",
  },
  {
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    year: 1878,
    rating: 4.4,
    isbn: "9780143035008",
  },
  {
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    year: 1880,
    rating: 4.5,
    isbn: "9780374528379",
  },
  {
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    year: 1866,
    rating: 4.5,
    isbn: "9780486415871",
  },
  {
    title: "The Old Man and the Sea",
    author: "Ernest Hemingway",
    year: 1952,
    rating: 4.1,
    isbn: "9780684830490",
  },
];

// =====================================================
// INSERT BOOKS
// =====================================================

async function seedBooks() {
  try {
    console.log("Starting second book import...");

    let inserted = 0;
    let skipped = 0;

    for (const book of books) {
      try {
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;

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
            `${book.title} by ${book.author}. Discover this book on BookWise.`,
            coverUrl,
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
    console.log("SECOND BOOK IMPORT COMPLETE");
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
