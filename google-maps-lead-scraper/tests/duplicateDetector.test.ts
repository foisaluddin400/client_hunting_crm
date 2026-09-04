import { describe, it, expect } from 'vitest';
import { DuplicateDetector } from '../src/scraper/duplicateDetector';
import { normalizeBusinessKey, cleanUrl } from '../src/utils/normalize';

describe('Duplicate Detector & Normalization', () => {
  it('identifies duplicate leads with identical Maps URLs', () => {
    const detector = new DuplicateDetector();
    const url1 = 'https://www.google.com/maps/place/Acme+Electric/@53.5461,-113.4938,17z';
    const url2 = 'https://www.google.com/maps/place/Acme+Electric/@53.5461,-113.4938,17z';

    expect(detector.hasLead(url1, 'Acme Electric', '101 St')).toBe(false);
    detector.addLead(url1, 'Acme Electric', '101 St');
    expect(detector.hasLead(url2, 'Acme Electric', '101 St')).toBe(true);
  });

  it('normalizes Google Maps URLs with tracking query parameters', () => {
    const url1 = 'https://www.google.com/maps/place/Acme+Electric/?entry=ttu&g_ep=abc';
    const url2 = 'https://www.google.com/maps/place/Acme+Electric/?authuser=0&hl=en';

    const key1 = normalizeBusinessKey(url1, 'Acme Electric', 'Edmonton');
    const key2 = normalizeBusinessKey(url2, 'Acme Electric', 'Edmonton');

    expect(key1).toBe(key2);
  });

  it('falls back to Name + Address deduplication if URLs are missing', () => {
    const detector = new DuplicateDetector();

    expect(detector.hasLead(null, 'Sparky Pro', '123 Main St, Edmonton')).toBe(false);
    detector.addLead(null, 'Sparky Pro', '123 Main St, Edmonton');

    // Case-insensitive & whitespace trimmed match
    expect(
      detector.hasLead(null, '  sparky pro  ', '123 Main St, EDMONTON  ')
    ).toBe(true);
  });

  it('cleans Google redirect URLs', () => {
    const redirectUrl = 'https://www.google.com/url?q=https://acmeelectric.ca&sa=D';
    expect(cleanUrl(redirectUrl)).toBe('https://acmeelectric.ca');
  });
});
