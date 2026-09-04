import { describe, it, expect } from 'vitest';
import { validateReviewRange, validateSettings } from '../src/utils/validation';
import { DEFAULT_SETTINGS } from '../src/types/settings';

describe('Settings & Range Validation', () => {
  // Test 6: Minimum 100, Maximum 50
  it('prevents scraping when minimum reviews is greater than maximum reviews (Test 6)', () => {
    const res = validateReviewRange(100, 50);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Minimum reviews cannot be greater than maximum reviews.');

    const fullSettingsRes = validateSettings({
      ...DEFAULT_SETTINGS,
      minReviews: 100,
      maxReviews: 50,
    });
    expect(fullSettingsRes.isValid).toBe(false);
    expect(fullSettingsRes.error).toBe(
      'Minimum reviews cannot be greater than maximum reviews.'
    );
  });

  it('allows equal minimum and maximum reviews (e.g. 50 to 50)', () => {
    const res = validateReviewRange(50, 50);
    expect(res.isValid).toBe(true);
    expect(res.error).toBeNull();
  });

  it('validates customCount must be greater than 0', () => {
    const res = validateSettings({
      ...DEFAULT_SETTINGS,
      countMode: 'custom',
      customCount: 0,
    });
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Please enter a valid number of businesses.');
  });

  it('validates at least one field is selected', () => {
    const res = validateSettings({
      ...DEFAULT_SETTINGS,
      selectedFields: [],
    });
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Please select at least one field to scrape.');
  });

  it('accepts valid settings', () => {
    const res = validateSettings({
      ...DEFAULT_SETTINGS,
      countMode: 'custom',
      customCount: 50,
      minReviews: 0,
      maxReviews: 60,
      websiteFilter: 'no_website',
    });
    expect(res.isValid).toBe(true);
    expect(res.error).toBeNull();
  });
});
