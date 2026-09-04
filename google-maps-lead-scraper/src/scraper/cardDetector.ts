/**
 * Detects all currently rendered business card elements within the results container or document.
 */
export function detectBusinessCards(container?: HTMLElement | null): HTMLElement[] {
  const root = container || (typeof document !== 'undefined' ? document : null);
  if (!root) return [];

  const cards: HTMLElement[] = [];
  const seenElements = new Set<HTMLElement>();

  // Primary card selectors used by Google Maps
  const cardSelectors = [
    'div.Nv2PK', // Main result card wrapper
    'div[role="article"]', // Accessible role for place results
    'div.THOPZb', // Common wrapper inside feeds
  ];

  for (const selector of cardSelectors) {
    const elements = root.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!seenElements.has(el)) {
        // Ensure this card element contains a place link or heading
        if (isLikelyBusinessCard(el)) {
          seenElements.add(el);
          cards.push(el);
        }
      }
    }
  }

  // Fallback: If no cards matched above, find all place links (a.hfpxzc or a[href*="/maps/place/"])
  // and resolve their closest meaningful card container
  if (cards.length === 0) {
    const linkSelectors = ['a.hfpxzc', 'a[href*="/maps/place/"]'];
    for (const selector of linkSelectors) {
      const links = root.querySelectorAll<HTMLAnchorElement>(selector);
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        // The card is usually parent or grandparent
        const cardParent =
          link.closest<HTMLElement>('div.Nv2PK') ||
          link.closest<HTMLElement>('div[role="article"]') ||
          (link.parentElement as HTMLElement | null);

        if (cardParent && !seenElements.has(cardParent)) {
          seenElements.add(cardParent);
          cards.push(cardParent);
        }
      }
    }
  }

  return cards;
}

/**
 * Validates if an element has typical business card features:
 * contains a place link, heading, or rating indicator.
 */
function isLikelyBusinessCard(el: HTMLElement): boolean {
  if (!el) return false;

  // Does it contain a place link?
  if (el.querySelector('a.hfpxzc, a[href*="/maps/place/"]')) {
    return true;
  }

  // Does it contain a business title class?
  if (el.querySelector('.qBF1Pd, [role="heading"], .fontHeadlineSmall')) {
    return true;
  }

  return false;
}
