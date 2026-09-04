import { DEFAULT_SETTINGS, ScraperSettings } from '../types/settings';

const STORAGE_KEY = 'gmaps_lead_scraper_settings';

/**
 * Loads persisted scraper settings from chrome.storage.local.
 * Falls back to DEFAULT_SETTINGS if not found or if running outside extension context.
 */
export async function loadSettings(): Promise<ScraperSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      if (data && data[STORAGE_KEY]) {
        return {
          ...DEFAULT_SETTINGS,
          ...data[STORAGE_KEY],
        };
      }
    } else if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        return {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(local),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load settings from storage, using defaults:', err);
  }

  return { ...DEFAULT_SETTINGS };
}

/**
 * Saves scraper settings to chrome.storage.local.
 */
export async function saveSettings(settings: ScraperSettings): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.warn('Failed to save settings to storage:', err);
  }
}
