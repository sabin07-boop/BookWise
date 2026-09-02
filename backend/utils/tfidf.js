// =====================================================
// TF-IDF + COSINE SIMILARITY UTILITIES
// =====================================================

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "as",
  "from",
  "into",
  "about",
  "than",
  "then",
  "so",
  "such",
  "not",
  "no",
  "can",
  "will",
  "just",
  "also",
  "has",
  "have",
  "had",
  "he",
  "she",
  "they",
  "we",
  "you",
  "i",
  "his",
  "her",
  "their",
  "our",
  "your",
  "my",
  "all",
  "one",
]);

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function buildTfIdf(documents) {
  const documentFrequency = new Map();
  const totalDocs = documents.length;

  for (const doc of documents) {
    const uniqueTokens = new Set(doc.tokens);

    for (const token of uniqueTokens) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const idf = new Map();

  for (const [token, count] of documentFrequency.entries()) {
    idf.set(token, Math.log((totalDocs + 1) / (count + 1)) + 1);
  }

  const vectors = new Map();

  for (const doc of documents) {
    if (doc.tokens.length === 0) {
      vectors.set(doc.id, new Map());
      continue;
    }

    const termFrequency = new Map();

    for (const token of doc.tokens) {
      termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
    }

    const vector = new Map();
    let sumOfSquares = 0;

    for (const [token, count] of termFrequency.entries()) {
      const weight = (count / doc.tokens.length) * (idf.get(token) || 0);
      vector.set(token, weight);
      sumOfSquares += weight * weight;
    }

    const magnitude = Math.sqrt(sumOfSquares) || 1;

    for (const [token, weight] of vector.entries()) {
      vector.set(token, weight / magnitude);
    }

    vectors.set(doc.id, vector);
  }

  return { vectors, idf };
}

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.size === 0 || vectorB.size === 0) {
    return 0;
  }

  const [smaller, larger] =
    vectorA.size <= vectorB.size ? [vectorA, vectorB] : [vectorB, vectorA];

  let dotProduct = 0;

  for (const [token, weight] of smaller.entries()) {
    const otherWeight = larger.get(token);
    if (otherWeight) dotProduct += weight * otherWeight;
  }

  return dotProduct;
}

export { tokenize, buildTfIdf, cosineSimilarity };
