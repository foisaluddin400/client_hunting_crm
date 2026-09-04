import { BusinessLead } from '../types/business';
import { ScraperSettings } from '../types/settings';
import { randomDelay, sleep } from '../utils/delays';
import { detectBusinessCards } from './cardDetector';
import { detectResultsContainer } from './containerDetector';
import { extractBusinessData } from './dataExtractor';
import { DuplicateDetector } from './duplicateDetector';
import { matchesReviewFilter, matchesWebsiteFilter } from './reviewParser';
import { ScraperCallbacks, ScrapingRunResult } from './types';

export class GoogleMapsScraper {
  private isCancelled = false;
  private isRunning = false;
  private duplicateDetector = new DuplicateDetector();
  private collectedBusinesses: BusinessLead[] = [];
  private scannedCount = 0;

  public isActive(): boolean {
    return this.isRunning;
  }

  public getCollectedBusinesses(): BusinessLead[] {
    return [...this.collectedBusinesses];
  }

  /**
   * Immediately stops scraping cleanly without clearing collected data.
   */
  public stop(): void {
    this.isCancelled = true;
  }

  /**
   * Main scraping loop.
   */
  public async start(
    settings: ScraperSettings,
    callbacks: ScraperCallbacks = {}
  ): Promise<ScrapingRunResult> {
    if (this.isRunning) {
      throw new Error('Scraper is already running.');
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.scannedCount = 0;
    this.collectedBusinesses = [];
    this.duplicateDetector.clear();

    const isCustom = settings.countMode === 'custom';
    const targetCount = isCustom ? settings.customCount : 'all';

    // 1. Detect scrollable results container
    const { container, error: containerError } = detectResultsContainer();
    if (!container) {
      this.isRunning = false;
      return {
        completed: false,
        stopped: false,
        totalScanned: 0,
        totalMatching: 0,
        businesses: [],
        error:
          containerError ||
          'Google Maps results container could not be detected. Please make sure a Google Maps search results page is open.',
      };
    }

    let consecutiveNoNewCards = 0;
    const MAX_CONSECUTIVE_NO_NEW = 6;
    let lastScrollHeight = 0;

    callbacks.onLog?.('Google Maps Lead Scraper started.');

    try {
      while (!this.isCancelled) {
        // Check if requested matching count is already reached
        if (isCustom && this.collectedBusinesses.length >= (targetCount as number)) {
          break;
        }

        // Detect all currently rendered business cards
        const cards = detectBusinessCards(container);
        let newlyDiscoveredCount = 0;
        const newBatch: BusinessLead[] = [];

        for (const card of cards) {
          if (this.isCancelled) break;
          if (isCustom && this.collectedBusinesses.length >= (targetCount as number)) break;

          // Extract business data safely
          const lead = extractBusinessData(card);
          if (!lead) continue;

          // Check for duplicates
          if (this.duplicateDetector.has(lead.id)) {
            continue;
          }

          // Mark as scanned
          this.duplicateDetector.add(lead.id);
          this.scannedCount++;
          newlyDiscoveredCount++;

          // Apply Review Filter
          const passesReview = matchesReviewFilter(
            lead.reviewCount,
            settings.minReviews,
            settings.maxReviews
          );

          // Apply Website Filter
          const passesWebsite = matchesWebsiteFilter(
            lead.website,
            settings.websiteFilter
          );

          // If matches all filters, add to collected list
          if (passesReview && passesWebsite) {
            this.collectedBusinesses.push(lead);
            newBatch.push(lead);
          }

          // Emit progress update
          callbacks.onProgress?.({
            scannedCount: this.scannedCount,
            matchingCount: this.collectedBusinesses.length,
            targetCount,
            statusText: isCustom
              ? `${this.collectedBusinesses.length} / ${targetCount} matching businesses`
              : `${this.collectedBusinesses.length} matching businesses`,
            newBusinesses: [lead],
          });
        }

        // Check again after processing batch
        if (this.isCancelled) break;
        if (isCustom && this.collectedBusinesses.length >= (targetCount as number)) {
          break;
        }

        // Check for Google Maps end-of-list indicator
        if (this.isEndOfResultsReached(container)) {
          callbacks.onLog?.('End of Google Maps results detected.');
          break;
        }

        // Track consecutive attempts without new businesses
        if (newlyDiscoveredCount === 0) {
          consecutiveNoNewCards++;
          if (consecutiveNoNewCards >= MAX_CONSECUTIVE_NO_NEW) {
            callbacks.onLog?.(
              'No more new businesses loaded after multiple scroll attempts.'
            );
            break;
          }
        } else {
          consecutiveNoNewCards = 0;
        }

        // Scroll ONLY the results container
        lastScrollHeight = container.scrollHeight;
        this.scrollContainer(container);

        // Wait with a reasonable delay for Google Maps to load additional items
        await randomDelay(1200, 1900);

        if (this.isCancelled) break;

        // If scroll height hasn't changed, give it an extra slight nudge
        if (container.scrollHeight === lastScrollHeight && consecutiveNoNewCards > 1) {
          container.scrollBy({ top: 350, behavior: 'smooth' });
          await sleep(800);
        }
      }
    } catch (err) {
      this.isRunning = false;
      return {
        completed: false,
        stopped: this.isCancelled,
        totalScanned: this.scannedCount,
        totalMatching: this.collectedBusinesses.length,
        businesses: this.collectedBusinesses,
        error: err instanceof Error ? err.message : 'An unexpected scraping error occurred.',
      };
    }

    const wasStopped = this.isCancelled;
    this.isRunning = false;

    return {
      completed: !wasStopped,
      stopped: wasStopped,
      totalScanned: this.scannedCount,
      totalMatching: this.collectedBusinesses.length,
      businesses: this.collectedBusinesses,
      error: null,
    };
  }

  /**
   * Scrolls ONLY the detected Google Maps results container.
   * NEVER scrolls document.body or window.
   */
  private scrollContainer(container: HTMLElement): void {
    // Scroll down by 800px or to current scrollHeight
    const currentScroll = container.scrollTop;
    const scrollDelta = Math.max(600, Math.floor(container.clientHeight * 0.8));
    container.scrollTo({
      top: currentScroll + scrollDelta,
      behavior: 'smooth',
    });
  }

  /**
   * Detects whether Google Maps has reached the end of the results feed.
   */
  private isEndOfResultsReached(container: HTMLElement): boolean {
    // Check known Google Maps end-of-list class or text
    const endIndicators = [
      '.HlvSq', // "You've reached the end of the list." container
      '.qMYxae',
      '.PbZDve',
    ];

    for (const selector of endIndicators) {
      const el = container.querySelector(selector);
      if (el && el.textContent) {
        if (/end of the list|no more results/i.test(el.textContent)) {
          return true;
        }
      }
    }

    return false;
  }
}
