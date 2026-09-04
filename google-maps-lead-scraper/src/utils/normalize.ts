/**
 * Normalizes text by trimming and collapsing multiple whitespace/newline characters into single spaces.
 */
export function cleanWhitespace(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Normalizes and cleans URLs, removing Google tracking query params while preserving the place identifier.
 */
export function cleanUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, 'https://www.google.com');
    // If it's a Google redirect URL (e.g. google.com/url?q=...), extract destination
    if (parsed.pathname === '/url' && parsed.searchParams.has('q')) {
      return parsed.searchParams.get('q') || trimmed;
    }

    // If it's a Google Maps place URL, strip tracking params
    if (parsed.hostname.includes('google.') && parsed.pathname.includes('/maps/')) {
      const trackingParams = ['ved', 'usg', 'source', 'entry', 'g_ep', 'authuser', 'hl'];
      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }
      return parsed.toString();
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Creates a normalized unique identifier for a business lead.
 * Primary key: Canonical Google Maps place URL (or place path).
 * Fallback key: Lowercased normalized business name + address.
 */
export function normalizeBusinessKey(
  url: string | null | undefined,
  name: string | null | undefined,
  address: string | null | undefined
): string {
  const cleanedUrl = cleanUrl(url);

  // If a valid Google Maps Place URL is found, extract the place path or full URL
  if (cleanedUrl && cleanedUrl.includes('/maps/place/')) {
    try {
      const parsed = new URL(cleanedUrl);
      // E.g. /maps/place/Some+Business/
      const match = parsed.pathname.match(/\/maps\/place\/([^/@]+)/i);
      if (match && match[1]) {
        return `place:${decodeURIComponent(match[1]).toLowerCase().trim()}`;
      }
      return `url:${parsed.origin}${parsed.pathname}`;
    } catch {
      return `url:${cleanedUrl}`;
    }
  }

  const cleanName = cleanWhitespace(name).toLowerCase();
  const cleanAddr = cleanWhitespace(address).toLowerCase();

  if (cleanName && cleanAddr) {
    return `name_addr:${cleanName}__${cleanAddr}`;
  }

  if (cleanName) {
    return `name:${cleanName}`;
  }

  if (cleanedUrl) {
    return `url:${cleanedUrl}`;
  }

  return `id:${Math.random().toString(36).substring(2, 9)}`;
}
