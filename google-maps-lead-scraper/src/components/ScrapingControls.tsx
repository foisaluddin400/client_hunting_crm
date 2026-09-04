import React from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { ScrapingStatus } from '../types/messages';

interface ScrapingControlsProps {
  status: ScrapingStatus;
  isValid: boolean;
  validationError: string | null;
  onStart: () => void;
  onStop: () => void;
}

export const ScrapingControls: React.FC<ScrapingControlsProps> = ({
  status,
  isValid,
  validationError,
  onStart,
  onStop,
}) => {
  const isScraping = status === 'SCRAPING' || status === 'STOPPING';

  return (
    <div className="controls-wrapper">
      {!isScraping ? (
        <button
          type="button"
          disabled={!isValid}
          onClick={onStart}
          className="cta-btn start-btn"
          title={!isValid && validationError ? validationError : 'Start lead discovery'}
        >
          <Play size={18} fill="currentColor" />
          <span>Start Scraping</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={status === 'STOPPING'}
          onClick={onStop}
          className="cta-btn stop-btn"
        >
          {status === 'STOPPING' ? (
            <>
              <Loader2 size={18} className="spin-icon" />
              <span>Stopping...</span>
            </>
          ) : (
            <>
              <Square size={16} fill="currentColor" />
              <span>Stop Scraping</span>
            </>
          )}
        </button>
      )}

      {!isValid && validationError && (
        <p className="validation-error-text">{validationError}</p>
      )}
    </div>
  );
};
