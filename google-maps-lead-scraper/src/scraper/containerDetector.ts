import { ContainerDetectionResult } from './types';

/**
 * Robustly detects the scrollable Google Maps business-results container.
 * Never returns document.body or window.
 */
export function detectResultsContainer(): ContainerDetectionResult {
  if (typeof document === 'undefined') {
    return { container: null, error: 'Document not available.' };
  }

  // Strategy 1: Known Google Maps feed roles and semantic attributes
  const candidateSelectors = [
    'div[role="feed"]',
    'div[aria-label*="Results for" i]',
    'div[aria-label*="results" i][role="region"]',
    'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd',
    'div.m6QErb[aria-label]',
  ];

  for (const selector of candidateSelectors) {
    try {
      const el = document.querySelector<HTMLElement>(selector);
      if (el && isValidScrollContainer(el)) {
        return { container: el };
      }
    } catch {
      // Continue to next selector
    }
  }

  // Strategy 2: Locate cards and find their scrollable ancestor
  const cardSampleSelectors = [
    'div.Nv2PK',
    'div[role="article"]',
    'a.hfpxzc',
    'a[href*="/maps/place/"]',
  ];

  for (const cardSelector of cardSampleSelectors) {
    const cards = document.querySelectorAll<HTMLElement>(cardSelector);
    if (cards.length > 0) {
      const sampleCard = cards[0];
      let current: HTMLElement | null = sampleCard.parentElement;

      while (current && current !== document.body && current !== document.documentElement) {
        if (isValidScrollContainer(current)) {
          return { container: current };
        }
        current = current.parentElement;
      }
    }
  }

  // Strategy 3: Search all elements with role="feed" or high scrollHeight inside the main panel
  const allFeeds = document.querySelectorAll<HTMLElement>('*[role="feed"]');
  for (const feed of allFeeds) {
    if (isValidScrollContainer(feed)) {
      return { container: feed };
    }
  }

  return {
    container: null,
    error:
      'Results container could not be detected. Please make sure a Google Maps search results page is open.',
  };
}

/**
 * Validates that an element is indeed a scrollable element and not body/html.
 */
export function isValidScrollContainer(el: HTMLElement): boolean {
  if (!el || el === document.body || el === document.documentElement) {
    return false;
  }

  // Must have layout dimensions
  if (el.clientHeight === 0 && el.offsetHeight === 0) {
    return false;
  }

  // Check computed styles for overflow scroll/auto
  try {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const isScrollableStyle =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';

    // Must be vertically scrollable or at least have children and scrollable style
    if (isScrollableStyle) {
      return true;
    }

    // If scrollHeight > clientHeight by a noticeable margin
    if (el.scrollHeight > el.clientHeight + 40) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
