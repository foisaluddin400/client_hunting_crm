import { BusinessLead } from '../types/business';
import { cleanUrl, cleanWhitespace, normalizeBusinessKey } from '../utils/normalize';
import { parseRating, parseReviewCount } from './reviewParser';

/**
 * Safely extracts business name from the card element.
 */
export function extractBusinessName(card: HTMLElement): string | null {
  // Try known title class
  const titleEl = card.querySelector('.qBF1Pd, [role="heading"], .fontHeadlineSmall');
  if (titleEl && titleEl.textContent) {
    const text = cleanWhitespace(titleEl.textContent);
    if (text) return text;
  }

  // Try anchor aria-label
  const anchor = card.querySelector<HTMLAnchorElement>('a.hfpxzc, a[href*="/maps/place/"]');
  if (anchor) {
    const label = anchor.getAttribute('aria-label');
    if (label) {
      const text = cleanWhitespace(label);
      if (text) return text;
    }
  }

  return null;
}

/**
 * Safely extracts individual Google Maps Business URL.
 */
export function extractGoogleMapsUrl(card: HTMLElement): string | null {
  const anchor = card.querySelector<HTMLAnchorElement>('a.hfpxzc, a[href*="/maps/place/"]');
  if (anchor && anchor.href) {
    return cleanUrl(anchor.href);
  }

  // Check any anchor with href containing /maps/place/
  const anyPlaceLink = card.querySelector<HTMLAnchorElement>('a[href*="/place/"]');
  if (anyPlaceLink && anyPlaceLink.href) {
    return cleanUrl(anyPlaceLink.href);
  }

  return null;
}

/**
 * Safely extracts rating (e.g. 4.8).
 */
export function extractRating(card: HTMLElement): number | null {
  // Check known rating class
  const ratingEl = card.querySelector('.MW4etd, [aria-label*="stars" i], [aria-label*="stelle" i]');
  if (ratingEl) {
    const text = ratingEl.textContent || ratingEl.getAttribute('aria-label');
    const parsed = parseRating(text);
    if (parsed !== null) return parsed;
  }

  // Fallback: Check all aria-labels on card for rating
  const ariaLabels = card.querySelectorAll('[aria-label]');
  for (let i = 0; i < ariaLabels.length; i++) {
    const label = ariaLabels[i].getAttribute('aria-label');
    if (label && /stars?|stelle|étoiles|estrellas/i.test(label)) {
      const parsed = parseRating(label);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

/**
 * Safely extracts total review count.
 */
export function extractReviewCount(card: HTMLElement): number | null {
  // Known review count class in Google Maps
  const reviewCountEl = card.querySelector('.UY7F9');
  if (reviewCountEl && reviewCountEl.textContent) {
    const parsed = parseReviewCount(reviewCountEl.textContent);
    if (parsed !== null) return parsed;
  }

  // Search inside aria-labels for review counts
  const ariaLabels = card.querySelectorAll('[aria-label]');
  for (let i = 0; i < ariaLabels.length; i++) {
    const label = ariaLabels[i].getAttribute('aria-label');
    if (label && /reviews?|recensioni|avis|bewertungen|reseñas/i.test(label)) {
      const parsed = parseReviewCount(label);
      if (parsed !== null) return parsed;
    }
  }

  // Search text nodes that match (number)
  const allSpans = card.querySelectorAll('span');
  for (let i = 0; i < allSpans.length; i++) {
    const text = allSpans[i].textContent;
    if (text && /\([\d,.]+[kKmM]?\)/.test(text)) {
      const parsed = parseReviewCount(text);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

/**
 * Safely extracts open / closed status (e.g. "Open", "Closed", "Open 24 hours").
 */
export function extractOpenStatus(card: HTMLElement): string | null {
  // Look for status container or text
  const statusContainer = card.querySelector('.ZDu9vd, span[style*="color: rgb(25]"]');
  if (statusContainer && statusContainer.textContent) {
    const text = cleanWhitespace(statusContainer.textContent);
    if (/open/i.test(text)) {
      return /24\s*hours/i.test(text) ? 'Open 24 hours' : 'Open';
    }
    if (/closed/i.test(text)) {
      return 'Closed';
    }
    return text;
  }

  // Search text rows
  const textContent = card.innerText || card.textContent || '';
  if (/Open 24 hours/i.test(textContent)) return 'Open 24 hours';
  if (/Closed ⋅ Opens/i.test(textContent) || /Temporarily closed/i.test(textContent)) return 'Closed';
  if (/Open ⋅ Closes/i.test(textContent)) return 'Open';

  return null;
}

/**
 * Safely extracts opening hours info snippet (e.g. "Closes 5 PM", "Opens 8 AM Mon").
 */
export function extractOpeningHours(card: HTMLElement): string | null {
  const statusContainer = card.querySelector('.ZDu9vd');
  if (statusContainer && statusContainer.textContent) {
    const text = cleanWhitespace(statusContainer.textContent);
    const match = text.match(/(?:Closes|Opens|Closed|Open)\s+[⋅·]?\s*(.+)/i);
    if (match && match[1]) {
      return cleanWhitespace(match[1]);
    }
  }

  const textContent = card.innerText || card.textContent || '';
  const match = textContent.match(/(?:Closes|Opens)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?[^·\n]*)/i);
  if (match && match[1]) {
    return cleanWhitespace(match[1]);
  }

  return null;
}

/**
 * Safely extracts category, address, and phone by analyzing info rows (.W4Efsd).
 */
function extractInfoRows(card: HTMLElement): {
  category: string | null;
  address: string | null;
  phone: string | null;
} {
  let category: string | null = null;
  let address: string | null = null;
  let phone: string | null = null;

  // Phone regex pattern: international and domestic formats
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;

  // Check tel: links first
  const telLink = card.querySelector<HTMLAnchorElement>('a[href^="tel:"]');
  if (telLink) {
    phone = cleanWhitespace(telLink.getAttribute('href')?.replace('tel:', '') || telLink.textContent);
  }

  // Google Maps puts secondary details inside .W4Efsd elements
  const infoRows = card.querySelectorAll('.W4Efsd');
  const textSegments: string[] = [];

  infoRows.forEach((row) => {
    const raw = row.textContent || '';
    // Split by middle dot, bullet, or comma
    const parts = raw.split(/[·•]/).map((p) => cleanWhitespace(p)).filter(Boolean);
    textSegments.push(...parts);
  });

  for (const segment of textSegments) {
    // Skip ratings and reviews
    if (/^\d\.\d/i.test(segment) || /^\(\d+/i.test(segment) || /reviews?/i.test(segment)) {
      continue;
    }

    // Skip open/closed indicators
    if (/open/i.test(segment) || /closed/i.test(segment) || /closes/i.test(segment)) {
      continue;
    }

    // Check if phone number
    if (!phone && phonePattern.test(segment) && segment.replace(/\D/g, '').length >= 7) {
      phone = segment;
      continue;
    }

    // First meaningful text is usually the category
    if (!category && segment.length > 2 && segment.length < 40 && !/\d{2,}/.test(segment)) {
      category = segment;
      continue;
    }

    // Address often has numbers, commas, or street indicators (St, Ave, Rd, Dr, Way, Blvd, etc.)
    if (!address && (/\d+/.test(segment) || /street|st|avenue|ave|road|rd|drive|dr|blvd|suite|ste/i.test(segment))) {
      address = segment;
      continue;
    }
  }

  // If address still not found, check remaining segments that are not category/phone
  if (!address) {
    for (const segment of textSegments) {
      if (segment !== category && segment !== phone && segment.length > 5) {
        address = segment;
        break;
      }
    }
  }

  return { category, address, phone };
}

export function extractCategory(card: HTMLElement): string | null {
  return extractInfoRows(card).category;
}

export function extractAddress(card: HTMLElement): string | null {
  return extractInfoRows(card).address;
}

export function extractPhone(card: HTMLElement): string | null {
  return extractInfoRows(card).phone;
}

/**
 * Safely extracts email if publicly visible in the card.
 */
export function extractEmail(card: HTMLElement): string | null {
  const mailLink = card.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
  if (mailLink) {
    const raw = mailLink.getAttribute('href')?.replace('mailto:', '') || mailLink.textContent;
    return cleanWhitespace(raw);
  }

  const text = card.innerText || card.textContent || '';
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && emailMatch[0]) {
    return cleanWhitespace(emailMatch[0]);
  }

  return null;
}

/**
 * Safely extracts website URL.
 */
export function extractWebsite(card: HTMLElement): string | null {
  // Look for dedicated website action button
  const webLink = card.querySelector<HTMLAnchorElement>(
    'a[data-value="Website"], a[aria-label*="website" i], a[data-tooltip*="website" i]'
  );

  if (webLink && webLink.href) {
    return cleanUrl(webLink.href);
  }

  // Look for external link in card action bar
  const actionLinks = card.querySelectorAll<HTMLAnchorElement>('a[href^="http"]');
  for (let i = 0; i < actionLinks.length; i++) {
    const href = actionLinks[i].href;
    if (
      href &&
      !href.includes('google.') &&
      !href.includes('gstatic.') &&
      !href.includes('schema.org')
    ) {
      return cleanUrl(href);
    }
  }

  return null;
}

/**
 * Extracts complete business lead data from a business card element.
 * Never throws an error if fields are missing.
 */
export function extractBusinessData(card: HTMLElement): BusinessLead | null {
  try {
    const name = extractBusinessName(card);
    const mapsUrl = extractGoogleMapsUrl(card);

    // If both name and mapsUrl are missing, this is not a valid business card
    if (!name && !mapsUrl) {
      return null;
    }

    const info = extractInfoRows(card);
    const rating = extractRating(card);
    const reviewCount = extractReviewCount(card);
    const openStatus = extractOpenStatus(card);
    const openingHours = extractOpeningHours(card);
    const website = extractWebsite(card);
    const email = extractEmail(card);

    const id = normalizeBusinessKey(mapsUrl, name, info.address);

    return {
      id,
      name,
      rating,
      reviewCount,
      openStatus,
      openingHours,
      category: info.category,
      phone: info.phone,
      email,
      website,
      address: info.address,
      mapsUrl,
      scrapedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
