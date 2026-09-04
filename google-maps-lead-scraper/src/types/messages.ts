import { BusinessLead } from './business';
import { ScraperSettings } from './settings';

export type ScrapingStatus =
  | 'IDLE'
  | 'SCRAPING'
  | 'STOPPING'
  | 'COMPLETED'
  | 'STOPPED'
  | 'ERROR';

export type MessageType =
  | 'START_SCRAPING'
  | 'STOP_SCRAPING'
  | 'SCRAPING_PROGRESS'
  | 'SCRAPING_COMPLETED'
  | 'SCRAPING_STOPPED'
  | 'SCRAPING_ERROR'
  | 'GET_SCRAPING_STATE'
  | 'SCRAPING_STATE_RESPONSE'
  | 'CHECK_MAPS_STATUS'
  | 'MAPS_STATUS_RESPONSE';

export interface BaseMessage {
  type: MessageType;
}

export interface StartScrapingMessage extends BaseMessage {
  type: 'START_SCRAPING';
  settings: ScraperSettings;
}

export interface StopScrapingMessage extends BaseMessage {
  type: 'STOP_SCRAPING';
}

export interface ScrapingProgressMessage extends BaseMessage {
  type: 'SCRAPING_PROGRESS';
  scannedCount: number;
  matchingCount: number;
  targetCount: number | 'all';
  statusText: string;
  newBusinesses: BusinessLead[];
}

export interface ScrapingCompletedMessage extends BaseMessage {
  type: 'SCRAPING_COMPLETED';
  totalScanned: number;
  totalMatching: number;
  message?: string;
}

export interface ScrapingStoppedMessage extends BaseMessage {
  type: 'SCRAPING_STOPPED';
  totalScanned: number;
  totalMatching: number;
  message?: string;
}

export interface ScrapingErrorMessage extends BaseMessage {
  type: 'SCRAPING_ERROR';
  error: string;
}

export interface GetScrapingStateMessage extends BaseMessage {
  type: 'GET_SCRAPING_STATE';
}

export interface ScrapingStateResponseMessage extends BaseMessage {
  type: 'SCRAPING_STATE_RESPONSE';
  status: ScrapingStatus;
  scannedCount: number;
  matchingCount: number;
  targetCount: number | 'all';
  statusText: string;
  businesses: BusinessLead[];
  error?: string | null;
}

export interface CheckMapsStatusMessage extends BaseMessage {
  type: 'CHECK_MAPS_STATUS';
}

export interface MapsStatusResponseMessage extends BaseMessage {
  type: 'MAPS_STATUS_RESPONSE';
  isGoogleMaps: boolean;
  hasSearchResults: boolean;
  message?: string;
}

export type ExtensionMessage =
  | StartScrapingMessage
  | StopScrapingMessage
  | ScrapingProgressMessage
  | ScrapingCompletedMessage
  | ScrapingStoppedMessage
  | ScrapingErrorMessage
  | GetScrapingStateMessage
  | ScrapingStateResponseMessage
  | CheckMapsStatusMessage
  | MapsStatusResponseMessage;
