import Fuse from 'fuse.js';
import { helpIndex, keywordAliases } from '../data/helpIndex';

/**
 * Search help topics using fuzzy matching
 * @param {string} query - User search query
 * @returns {Array} - Matched help topics with scores
 */
export function searchHelp(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Normalize query and check aliases
  const normalizedQuery = normalizeQuery(query);

  // Fuzzy search configuration
  const fuse = new Fuse(helpIndex, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'description', weight: 1.5 },
      { name: 'category', weight: 1 },
      { name: 'subcategory', weight: 1 },
      { name: 'steps', weight: 0.5 }
    ],
    threshold: 0.4, // Lower = stricter match (0-1 range)
    includeScore: true,
    minMatchCharLength: 2
  });

  const results = fuse.search(normalizedQuery);

  // Return top 10 results with matched keywords
  return results.slice(0, 10).map(r => ({
    ...r.item,
    score: r.score,
    matchedKeywords: getMatchedKeywords(r.item, normalizedQuery)
  }));
}

/**
 * Normalize query and expand using aliases
 * @param {string} query
 * @returns {string} - Normalized query
 */
function normalizeQuery(query) {
  const lower = query.toLowerCase().trim();

  // Check if query matches any keyword aliases
  for (const [key, aliases] of Object.entries(keywordAliases)) {
    if (lower.includes(key)) {
      // Return the canonical keyword
      return key;
    }
    // Check if query matches any alias
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        return key;
      }
    }
  }

  return lower;
}

/**
 * Get keywords that matched the search query
 * @param {Object} item - Help topic
 * @param {string} query - Search query
 * @returns {Array} - Matched keywords
 */
function getMatchedKeywords(item, query) {
  const queryLower = query.toLowerCase();
  return item.keywords.filter(k =>
    queryLower.includes(k.toLowerCase()) ||
    k.toLowerCase().includes(queryLower)
  );
}

/**
 * Get popular/beginner-friendly topics
 * @returns {Array} - Help topics suitable for beginners
 */
export function getPopularTopics() {
  return helpIndex
    .filter(h => h.difficulty === 'beginner')
    .slice(0, 6);
}

/**
 * Filter topics by category
 * @param {string} category - Category name
 * @returns {Array} - Help topics in that category
 */
export function getTopicsByCategory(category) {
  return helpIndex.filter(h =>
    h.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get a specific topic by ID
 * @param {string} id - Topic ID
 * @returns {Object|null} - Help topic or null
 */
export function getTopicById(id) {
  return helpIndex.find(h => h.id === id) || null;
}

/**
 * Get all unique categories
 * @returns {Array} - List of category names
 */
export function getAllCategories() {
  const categories = new Set(helpIndex.map(h => h.category));
  return Array.from(categories).sort();
}
