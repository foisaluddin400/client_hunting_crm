import { BusinessLead } from '../types/business';

export interface ScraperCallbacks {
  onProgress?: (data: {
    scannedCount: number;
    matchingCount: number;
    targetCount: number | 'all';
    statusText: string;
    newBusinesses: BusinessLead[];
  }) => void;
  onLog?: (message: string) => void;
}

export interface ScrapingRunResult {
  completed: boolean;
  stopped: boolean;
  totalScanned: number;
  totalMatching: number;
  businesses: BusinessLead[];
  error?: string | null;
}

export interface ContainerDetectionResult {
  container: HTMLElement | null;
  error?: string;
}
