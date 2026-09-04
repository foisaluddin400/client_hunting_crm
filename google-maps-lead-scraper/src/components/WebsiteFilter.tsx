import React from 'react';
import { WebsiteFilterOption } from '../types/settings';
import { Globe, CheckCircle2, XCircle } from 'lucide-react';

interface WebsiteFilterProps {
  value: WebsiteFilterOption;
  disabled: boolean;
  onChange: (val: WebsiteFilterOption) => void;
}

export const WebsiteFilter: React.FC<WebsiteFilterProps> = ({
  value,
  disabled,
  onChange,
}) => {
  return (
    <div className="card-section">
      <div className="section-header">
        <label className="section-title">
          <Globe size={14} className="title-icon" />
          Website Filter
        </label>
        <span className="section-badge">
          {value === 'all'
            ? 'All'
            : value === 'has_website'
            ? 'Has Website'
            : 'No Website'}
        </span>
      </div>

      <div className="pill-group" role="radiogroup">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'all'}
          disabled={disabled}
          className={`pill-btn ${value === 'all' ? 'active' : ''}`}
          onClick={() => onChange('all')}
        >
          <Globe size={13} className="pill-icon" />
          <span>All</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'has_website'}
          disabled={disabled}
          className={`pill-btn ${value === 'has_website' ? 'active' : ''}`}
          onClick={() => onChange('has_website')}
        >
          <CheckCircle2 size={13} className="pill-icon" />
          <span>Website Available</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'no_website'}
          disabled={disabled}
          className={`pill-btn ${value === 'no_website' ? 'active' : ''}`}
          onClick={() => onChange('no_website')}
        >
          <XCircle size={13} className="pill-icon" />
          <span>No Website</span>
        </button>
      </div>

      <p className="field-hint">
        Filters businesses based on whether a publicly visible website link is present on Google Maps.
      </p>
    </div>
  );
};
