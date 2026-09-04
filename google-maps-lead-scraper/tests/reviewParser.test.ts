import { describe, it, expect } from 'vitest';
import {
  parseReviewCount,
  parseRating,
  matchesReviewFilter,
  matchesWebsiteFilter,
} from '../src/scraper/reviewParser';

describe('Review Count Parsing', () => {
  it('parses standard integer counts', () => {
    expect(parseReviewCount('125')).toBe(125);
    expect(parseReviewCount('(125)')).toBe(125);
    expect(parseReviewCount('45')).toBe(45);
  });

  it('parses comma-separated numbers', () => {
    expect(parseReviewCount('1,250')).toBe(1250);
    expect(parseReviewCount('(1,250)')).toBe(1250);
    expect(parseReviewCount('10,500')).toBe(10500);
  });

  it('parses K and M suffix notation', () => {
    expect(parseReviewCount('1.2K')).toBe(1200);
    expect(parseReviewCount('12K')).toBe(12000);
    expect(parseReviewCount('(1.2k)')).toBe(1200);
    expect(parseReviewCount('0.5K')).toBe(500);
    expect(parseReviewCount('1.5M')).toBe(1500000);
  });

  it('parses phrases like "No reviews" or "125 reviews"', () => {
    expect(parseReviewCount('No reviews')).toBe(0);
    expect(parseReviewCount('125 reviews')).toBe(125);
    expect(parseReviewCount('1.2K reviews')).toBe(1200);
  });

  it('returns null for missing, empty, or unparseable text', () => {
    expect(parseReviewCount(null)).toBeNull();
    expect(parseReviewCount('')).toBeNull();
    expect(parseReviewCount('   ')).toBeNull();
    expect(parseReviewCount('unknown text')).toBeNull();
  });
});

describe('Rating Parsing', () => {
  it('parses decimal ratings with dot or comma', () => {
    expect(parseRating('4.8')).toBe(4.8);
    expect(parseRating('4,8')).toBe(4.8);
    expect(parseRating('5.0')).toBe(5.0);
    expect(parseRating('3.5 stars')).toBe(3.5);
  });

  it('returns null for invalid ratings', () => {
    expect(parseRating(null)).toBeNull();
    expect(parseRating('not a rating')).toBeNull();
    expect(parseRating('6.5')).toBeNull(); // Out of 0-5 range
  });
});

describe('Review Filter Matching', () => {
  // Test 1: 0 - 60 inclusive
  it('correctly matches inclusive range 0-60 (Test 1)', () => {
    expect(matchesReviewFilter(0, 0, 60)).toBe(true);
    expect(matchesReviewFilter(10, 0, 60)).toBe(true);
    expect(matchesReviewFilter(35, 0, 60)).toBe(true);
    expect(matchesReviewFilter(60, 0, 60)).toBe(true);
    expect(matchesReviewFilter(61, 0, 60)).toBe(false);
    expect(matchesReviewFilter(100, 0, 60)).toBe(false);
  });

  // Test 2: 50 - 200 inclusive
  it('correctly matches inclusive range 50-200 (Test 2)', () => {
    expect(matchesReviewFilter(49, 50, 200)).toBe(false);
    expect(matchesReviewFilter(50, 50, 200)).toBe(true);
    expect(matchesReviewFilter(100, 50, 200)).toBe(true);
    expect(matchesReviewFilter(200, 50, 200)).toBe(true);
    expect(matchesReviewFilter(201, 50, 200)).toBe(false);
  });

  // Test 3: Minimum empty, Maximum 60 (treated as 0-60)
  it('treats empty minimum as 0 (Test 3)', () => {
    expect(matchesReviewFilter(0, null, 60)).toBe(true);
    expect(matchesReviewFilter(30, null, 60)).toBe(true);
    expect(matchesReviewFilter(60, null, 60)).toBe(true);
    expect(matchesReviewFilter(61, null, 60)).toBe(false);
  });

  // Test 4: Minimum 50, Maximum empty (treated as 50+)
  it('treats empty maximum as unlimited (Test 4)', () => {
    expect(matchesReviewFilter(49, 50, null)).toBe(false);
    expect(matchesReviewFilter(50, 50, null)).toBe(true);
    expect(matchesReviewFilter(500, 50, null)).toBe(true);
  });

  // Test 5: Both empty -> no filter
  it('does not filter if both min and max are empty (Test 5)', () => {
    expect(matchesReviewFilter(0, null, null)).toBe(true);
    expect(matchesReviewFilter(5000, null, null)).toBe(true);
    expect(matchesReviewFilter(null, null, null)).toBe(true);
  });

  // Unknown review count protection
  it('does not match null review count when a filter is active', () => {
    expect(matchesReviewFilter(null, 0, 60)).toBe(false);
    expect(matchesReviewFilter(null, 50, null)).toBe(false);
  });
});

describe('Website Filter Matching', () => {
  // Test 7: Website Available
  it('matches only businesses with a website when "has_website" is selected (Test 7)', () => {
    expect(matchesWebsiteFilter('https://example.com', 'has_website')).toBe(true);
    expect(matchesWebsiteFilter('http://mybiz.ca', 'has_website')).toBe(true);
    expect(matchesWebsiteFilter(null, 'has_website')).toBe(false);
    expect(matchesWebsiteFilter('', 'has_website')).toBe(false);
  });

  // Test 8: No Website
  it('matches only businesses without a website when "no_website" is selected (Test 8)', () => {
    expect(matchesWebsiteFilter(null, 'no_website')).toBe(true);
    expect(matchesWebsiteFilter('', 'no_website')).toBe(true);
    expect(matchesWebsiteFilter('https://example.com', 'no_website')).toBe(false);
  });

  // All
  it('matches all businesses when "all" is selected', () => {
    expect(matchesWebsiteFilter('https://example.com', 'all')).toBe(true);
    expect(matchesWebsiteFilter(null, 'all')).toBe(true);
    expect(matchesWebsiteFilter('', 'all')).toBe(true);
  });
});
