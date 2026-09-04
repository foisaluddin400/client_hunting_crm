import React from 'react';
import { ScrapingStatus } from '../types/messages';
import {
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Search,
  CheckCheck,
} from 'lucide-react';

interface ProgressDisplayProps {
  status: ScrapingStatus;
  scannedCount: number;
  matchingCount: number;
  targetCount: number | 'all';
  statusText: string;
  errorMessage: string | null;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  status,
  scannedCount,
  matchingCount,
  targetCount,
  errorMessage,
}) => {
  if (status === 'IDLE' && matchingCount === 0 && !errorMessage) {
    return null;
  }

  const isCustom = typeof targetCount === 'number';
  const progressPercent =
    isCustom && targetCount > 0
      ? Math.min(100, Math.round((matchingCount / targetCount) * 100))
      : 0;

  return (
    <div className="progress-card">
      {/* Active Scraping State */}
      {status === 'SCRAPING' && (
        <div className="status-header active-pulse">
          <span className="live-dot" />
          <span className="status-title">
            Scraping...{' '}
            {isCustom
              ? `${matchingCount} / ${targetCount} matching businesses`
              : `${matchingCount} matching businesses`}
          </span>
        </div>
      )}

      {/* Stopping State */}
      {status === 'STOPPING' && (
        <div className="status-header">
          <PauseCircle size={16} className="text-amber-500" />
          <span className="status-title">Stopping scraper safely...</span>
        </div>
      )}

      {/* Completed State */}
      {status === 'COMPLETED' && (
        <div className="status-banner banner-success">
          <CheckCircle size={16} />
          <div>
            <strong>Scraping completed</strong>
            <p>{matchingCount} businesses collected</p>
          </div>
        </div>
      )}

      {/* Stopped State */}
      {status === 'STOPPED' && (
        <div className="status-banner banner-warning">
          <PauseCircle size={16} />
          <div>
            <strong>Scraping stopped</strong>
            <p>{matchingCount} businesses collected</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'ERROR' && errorMessage && (
        <div className="status-banner banner-error">
          <AlertCircle size={16} />
          <div>
            <strong>Error</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Progress Bar for Custom Target */}
      {isCustom && (status === 'SCRAPING' || status === 'STOPPING') && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Scanned vs Matching Counters */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-label">
            <Search size={12} className="stat-icon" />
            <span>Businesses scanned</span>
          </div>
          <div className="stat-number">{scannedCount}</div>
        </div>

        <div className="stat-box highlight">
          <div className="stat-label">
            <CheckCheck size={12} className="stat-icon" />
            <span>Matching businesses</span>
          </div>
          <div className="stat-number">{matchingCount}</div>
        </div>
      </div>

      {(status === 'SCRAPING' || status === 'STOPPING') && (
        <p className="field-hint-subtle">
          * Businesses scanned != Matching businesses. Leads are filtered in real-time.
        </p>
      )}
    </div>
  );
};
