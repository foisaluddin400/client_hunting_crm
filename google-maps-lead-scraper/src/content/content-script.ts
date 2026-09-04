import { GoogleMapsScraper } from '../scraper/googleMapsScraper';
import { detectResultsContainer } from '../scraper/containerDetector';
import { ExtensionMessage } from '../types/messages';

let currentScraper: GoogleMapsScraper | null = null;

// Content script initialization
console.log('[Google Maps Lead Scraper] Content script loaded.');

// Listen for messages from Side Panel or Background Service Worker
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'CHECK_MAPS_STATUS') {
    const isMaps = window.location.hostname.includes('google.') && window.location.pathname.includes('/maps');
    const { container } = detectResultsContainer();
    sendResponse({
      type: 'MAPS_STATUS_RESPONSE',
      isGoogleMaps: isMaps,
      hasSearchResults: Boolean(container),
    });
    return true;
  }

  if (message.type === 'START_SCRAPING') {
    if (currentScraper && currentScraper.isActive()) {
      sendResponse({ status: 'already_running' });
      return true;
    }

    currentScraper = new GoogleMapsScraper();
    sendResponse({ status: 'started' });

    // Run scraper in background of content script
    currentScraper
      .start(message.settings, {
        onProgress: (progress) => {
          chrome.runtime.sendMessage({
            type: 'SCRAPING_PROGRESS',
            ...progress,
          }).catch(() => {
            // Extension side panel might be temporarily closed or not listening
          });
        },
        onLog: (msg) => {
          console.log(`[Google Maps Lead Scraper] ${msg}`);
        },
      })
      .then((result) => {
        if (result.error) {
          chrome.runtime.sendMessage({
            type: 'SCRAPING_ERROR',
            error: result.error,
          }).catch(() => {});
        } else if (result.stopped) {
          chrome.runtime.sendMessage({
            type: 'SCRAPING_STOPPED',
            totalScanned: result.totalScanned,
            totalMatching: result.totalMatching,
          }).catch(() => {});
        } else {
          chrome.runtime.sendMessage({
            type: 'SCRAPING_COMPLETED',
            totalScanned: result.totalScanned,
            totalMatching: result.totalMatching,
          }).catch(() => {});
        }
      })
      .catch((err) => {
        chrome.runtime.sendMessage({
          type: 'SCRAPING_ERROR',
          error: err instanceof Error ? err.message : 'Unknown scraper error.',
        }).catch(() => {});
      });

    return true;
  }

  if (message.type === 'STOP_SCRAPING') {
    if (currentScraper) {
      currentScraper.stop();
      sendResponse({ status: 'stopping' });
    } else {
      sendResponse({ status: 'not_running' });
    }
    return true;
  }

  if (message.type === 'GET_SCRAPING_STATE') {
    const isActive = currentScraper ? currentScraper.isActive() : false;
    const businesses = currentScraper ? currentScraper.getCollectedBusinesses() : [];
    sendResponse({
      type: 'SCRAPING_STATE_RESPONSE',
      status: isActive ? 'SCRAPING' : 'IDLE',
      scannedCount: businesses.length,
      matchingCount: businesses.length,
      targetCount: 'all',
      statusText: isActive ? 'Scraping in progress' : 'Idle',
      businesses,
    });
    return true;
  }

  return false;
});
