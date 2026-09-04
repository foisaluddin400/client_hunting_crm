/**
 * Parses a raw review string into a numeric review count.
 * Handles formats like:
 * - "125" -> 125
 * - "(125)" -> 125
 * - "1,250" -> 1250
 * - "(1,250)" -> 1250
 * - "1.2K" -> 1200
 * - "12K" -> 12000
 * - "1.5M" -> 1500000
 * - "No reviews" -> 0
 * Returns null if the review count cannot be determined.
 */
export function parseReviewCount(rawText: string | null | undefined): number | null {
  if (!rawText) return null;
  const text = rawText.trim();
  if (!text) return null;

  // Handle explicit 0 or "no reviews"
  if (/no\s+reviews?/i.test(text)) {
    return 0;
  }

  // Look for parenthesized numbers: e.g. (125) or (1,250) or (1.2K)
  const parenMatch = text.match(/\(([\d,.]+[kKmM]?)\)/);
  if (parenMatch && parenMatch[1]) {
    return parseNumericWithSuffix(parenMatch[1]);
  }

  // Look for patterns like "125 reviews" or "1.2K reviews"
  const reviewsWordMatch = text.match(/([\d,.]+[kKmM]?)\s*(?:reviews?|recensioni|avis|bewertungen|reseñas)/i);
  if (reviewsWordMatch && reviewsWordMatch[1]) {
    return parseNumericWithSuffix(reviewsWordMatch[1]);
  }

  // Look for any isolated number with possible K/M suffix and commas
  const genericMatch = text.match(/\b([\d]+(?:,[\d]{3})*(?:\.[\d]+)?|\d+(?:\.[\d]+)?)\s*([kKmM])?\b/);
  if (genericMatch) {
    const numPart = genericMatch[1];
    const suffix = genericMatch[2];
    return parseNumericWithSuffix(suffix ? `${numPart}${suffix}` : numPart);
  }

  return null;
}

/**
 * Parses numeric strings that may include commas, decimals, and K/M suffixes.
 */
function parseNumericWithSuffix(str: string): number | null {
  const cleaned = str.trim().replace(/,/g, '');
  const lastChar = cleaned.slice(-1).toUpperCase();

  if (lastChar === 'K') {
    const val = parseFloat(cleaned.slice(0, -1));
    return isNaN(val) ? null : Math.round(val * 1000);
  }

  if (lastChar === 'M') {
    const val = parseFloat(cleaned.slice(0, -1));
    return isNaN(val) ? null : Math.round(val * 1000000);
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val);
}

/**
 * Parses rating string (e.g. "4.8", "4,8", "4.8 stars") into a float.
 */
export function parseRating(rawText: string | null | undefined): number | null {
  if (!rawText) return null;
  const match = rawText.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const val = parseFloat(match[1].replace(',', '.'));
  if (isNaN(val) || val < 0 || val > 5) return null;
  return Math.round(val * 10) / 10;
}

/**
 * Checks whether a business's review count matches the configured review filter.
 *
 * Rules:
 * - If both minReviews and maxReviews are null/empty: No filter, returns true.
 * - If reviewCount is null (unknown): Returns false when a filter is applied,
 *   because unknown review counts must not automatically match numeric ranges.
 * - minReviews empty is treated as 0.
 * - maxReviews empty is treated as unlimited.
 * - Range is inclusive (e.g., min: 0, max: 60 matches 0, 10, 35, 60, excludes 61).
 */
export function matchesReviewFilter(
  reviewCount: number | null,
  minReviews: number | null | undefined,
  maxReviews: number | null | undefined
): boolean {
  const hasMin = minReviews != null && !isNaN(minReviews);
  const hasMax = maxReviews != null && !isNaN(maxReviews);

  // If both are empty, no filter is applied
  if (!hasMin && !hasMax) {
    return true;
  }

  // When a filter is configured, unknown review counts do not match
  if (reviewCount === null) {
    return false;
  }

  const effectiveMin = hasMin ? Number(minReviews) : 0;

  if (hasMax) {
    const effectiveMax = Number(maxReviews);
    return reviewCount >= effectiveMin && reviewCount <= effectiveMax;
  }

  return reviewCount >= effectiveMin;
}

/**
 * Checks whether a business matches the website filter.
 * Options:
 * - 'all': match any
 * - 'has_website': must have a non-empty website
 * - 'no_website': must not have a website
 */
export function matchesWebsiteFilter(
  website: string | null | undefined,
  filter: 'all' | 'has_website' | 'no_website'
): boolean {
  if (filter === 'all') return true;

  const hasWebsite = Boolean(website && website.trim().length > 0);
  if (filter === 'has_website') {
    return hasWebsite;
  }
  if (filter === 'no_website') {
    return !hasWebsite;
  }

  return true;
}
