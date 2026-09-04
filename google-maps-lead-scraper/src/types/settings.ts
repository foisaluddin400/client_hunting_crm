import { ScrapableFieldKey, SCRAPABLE_FIELDS } from './business';

export type ScrapeCountMode = 'custom' | 'all';

export type WebsiteFilterOption = 'all' | 'has_website' | 'no_website';

export interface ScraperSettings {
  countMode: ScrapeCountMode;
  customCount: number;
  minReviews: number | null;
  maxReviews: number | null;
  websiteFilter: WebsiteFilterOption;
  selectedFields: ScrapableFieldKey[];
}

export const DEFAULT_SETTINGS: ScraperSettings = {
  countMode: 'custom',
  customCount: 50,
  minReviews: null,
  maxReviews: null,
  websiteFilter: 'all',
  selectedFields: SCRAPABLE_FIELDS.filter((f) => f.defaultSelected).map((f) => f.key),
};
