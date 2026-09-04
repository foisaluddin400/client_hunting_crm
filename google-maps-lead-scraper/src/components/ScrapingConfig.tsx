import React from 'react';
import { ScrapeCountMode } from '../types/settings';
import { Hash, Infinity as InfinityIcon } from 'lucide-react';

interface ScrapingConfigProps {
  countMode: ScrapeCountMode;
  customCount: number;
  disabled: boolean;
  onCountModeChange: (mode: ScrapeCountMode) => void;
  onCustomCountChange: (count: number) => void;
}

export const ScrapingConfig: React.FC<ScrapingConfigProps> = ({
  countMode,
  customCount,
  disabled,
  onCountModeChange,
  onCustomCountChange,
}) => {
  const presets = [25, 50, 100, 200];

  return (
    <div className="card-section">
      <div className="section-header">
        <label className="section-title">Scraping Limit</label>
        <span className="section-badge">
          {countMode === 'custom' ? `${customCount} Target` : 'Continuous'}
        </span>
      </div>

      <div className="pill-group" role="tablist">
        <button
          type="button"
          disabled={disabled}
          className={`pill-btn ${countMode === 'custom' ? 'active' : ''}`}
          onClick={() => onCountModeChange('custom')}
        >
          <Hash size={14} className="pill-icon" />
          <span>Custom Count</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`pill-btn ${countMode === 'all' ? 'active' : ''}`}
          onClick={() => onCountModeChange('all')}
        >
          <InfinityIcon size={14} className="pill-icon" />
          <span>All Discoverable</span>
        </button>
      </div>

      {countMode === 'custom' && (
        <div className="custom-count-wrapper">
          <div className="input-group">
            <span className="input-prefix">Count:</span>
            <input
              type="number"
              min="1"
              max="2000"
              step="1"
              disabled={disabled}
              value={customCount || ''}
              onChange={(e) => onCustomCountChange(parseInt(e.target.value, 10) || 0)}
              className="number-input"
              placeholder="e.g. 50"
            />
          </div>

          <div className="quick-presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                className={`preset-btn ${customCount === preset ? 'active-preset' : ''}`}
                onClick={() => onCustomCountChange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <p className="field-hint">
            Collects exactly {customCount || 0} <strong>matching</strong> businesses after review & website filters.
          </p>
        </div>
      )}

      {countMode === 'all' && (
        <p className="field-hint">
          Continuously discovers leads until Google Maps results end, with automatic loop safety checks.
        </p>
      )}
    </div>
  );
};
