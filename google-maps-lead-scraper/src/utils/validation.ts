import { ScraperSettings } from '../types/settings';

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates review range inputs.
 * Rule: Minimum Reviews must not be greater than Maximum Reviews.
 */
export function validateReviewRange(
  min: number | null | undefined,
  max: number | null | undefined
): ValidationResult {
  if (min != null && max != null) {
    if (min > max) {
      return {
        isValid: false,
        error: 'Minimum reviews cannot be greater than maximum reviews.',
      };
    }
  }

  if (min != null && min < 0) {
    return {
      isValid: false,
      error: 'Minimum reviews cannot be negative.',
    };
  }

  if (max != null && max < 0) {
    return {
      isValid: false,
      error: 'Maximum reviews cannot be negative.',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validates the full scraper configuration settings.
 */
export function validateSettings(settings: ScraperSettings): ValidationResult {
  if (settings.countMode === 'custom') {
    if (
      !settings.customCount ||
      isNaN(settings.customCount) ||
      settings.customCount <= 0 ||
      !Number.isInteger(settings.customCount)
    ) {
      return {
        isValid: false,
        error: 'Please enter a valid number of businesses.',
      };
    }
  }

  const reviewValidation = validateReviewRange(settings.minReviews, settings.maxReviews);
  if (!reviewValidation.isValid) {
    return reviewValidation;
  }

  if (!settings.selectedFields || settings.selectedFields.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one field to scrape.',
    };
  }

  return { isValid: true, error: null };
}
