/**
 * Fuzzy search implementation similar to Jumia
 * Provides typo tolerance and intelligent matching
 */

export interface FuzzyMatch {
  score: number
  matched: boolean
  highlights: number[]
}

/**
 * Calculate Levenshtein distance for typo tolerance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[len2][len1]
}

/**
 * Normalize string for comparison
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
}

/**
 * Fuzzy match a query against a text
 * Returns score (0-100) where 100 is exact match
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch {
  const normalizedQuery = normalizeString(query)
  const normalizedText = normalizeString(text)

  if (!normalizedQuery) {
    return { score: 0, matched: false, highlights: [] }
  }

  // Exact match
  if (normalizedText === normalizedQuery) {
    return { score: 100, matched: true, highlights: Array.from({ length: normalizedQuery.length }, (_, i) => i) }
  }

  // Substring match
  const substringIndex = normalizedText.indexOf(normalizedQuery)
  if (substringIndex !== -1) {
    return {
      score: 90,
      matched: true,
      highlights: Array.from({ length: normalizedQuery.length }, (_, i) => substringIndex + i),
    }
  }

  // Check if query terms appear in text (word-level matching)
  const queryTerms = normalizedQuery.split(" ")
  const textTerms = normalizedText.split(" ")
  let matchedTerms = 0
  const highlights: number[] = []

  for (const queryTerm of queryTerms) {
    for (let i = 0; i < textTerms.length; i++) {
      const textTerm = textTerms[i]
      const distance = levenshteinDistance(queryTerm, textTerm)
      const maxLen = Math.max(queryTerm.length, textTerm.length)
      const similarity = 1 - distance / maxLen

      // Allow up to 30% difference for typo tolerance
      if (similarity > 0.7) {
        matchedTerms++
        const pos = normalizedText.indexOf(textTerm)
        if (pos !== -1) {
          highlights.push(...Array.from({ length: textTerm.length }, (_, i) => pos + i))
        }
        break
      }
    }
  }

  const score = (matchedTerms / queryTerms.length) * 80

  return {
    score: Math.round(score),
    matched: score > 0,
    highlights: [...new Set(highlights)].sort((a, b) => a - b),
  }
}

/**
 * Rank search results by relevance
 */
export function rankResults<T extends { name: string; description?: string }>(
  query: string,
  results: T[]
): { item: T; score: number }[] {
  return results
    .map((item) => {
      // Weight: name match is worth more than description
      const nameMatch = fuzzyMatch(query, item.name)
      const descMatch = fuzzyMatch(query, item.description || "")

      // Name matches are worth 70%, description 30%
      const score = nameMatch.score * 0.7 + descMatch.score * 0.3

      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Filter results using fuzzy matching
 */
export function filterByFuzzyMatch<T extends { name: string; description?: string }>(
  query: string,
  results: T[],
  threshold: number = 30
): T[] {
  return results
    .map((item) => {
      const nameMatch = fuzzyMatch(query, item.name)
      const descMatch = fuzzyMatch(query, item.description || "")
      const score = Math.max(nameMatch.score, descMatch.score)
      return { item, score }
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

/**
 * Generate search suggestions based on fuzzy matching
 */
export function generateSuggestions(query: string, items: string[], limit: number = 10): string[] {
  if (!query.trim()) return []

  return items
    .map((item) => ({
      text: item,
      score: fuzzyMatch(query, item).score,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ text }) => text)
}
