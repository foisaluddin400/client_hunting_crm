import React from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { validateReviewRange } from '../utils/validation';

interface ReviewRangeProps {
  minReviews: number | null;
  maxReviews: number | null;
  disabled: boolean;
  onMinReviewsChange: (val: number | null) => void;
  onMaxReviewsChange: (val: number | null) => void;
}

export const ReviewRange: React.FC<ReviewRangeProps> = ({
  minReviews,
  maxReviews,
  disabled,
  onMinReviewsChange,
  onMaxReviewsChange,
}) => {
  const validation = validateReviewRange(minReviews, maxReviews);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onMinReviewsChange(null);
    } else {
      const num = parseInt(val, 10);
      onMinReviewsChange(isNaN(num) ? null : Math.max(0, num));
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onMaxReviewsChange(null);
    } else {
      const num = parseInt(val, 10);
      onMaxReviewsChange(isNaN(num) ? null : Math.max(0, num));
    }
  };

  return (
    <div className="card-section">
      <div className="section-header">
        <label className="section-title">
          <Star size={14} className="title-icon" />
          Review Range Filter
        </label>
        <span className="section-badge">
          {minReviews === null && maxReviews === null
            ? 'Any Reviews'
            : `${minReviews ?? 0} – ${maxReviews ?? '∞'} reviews`}
        </span>
      </div>

      <div className="dual-input-row">
        <div className="input-field-col">
          <label className="input-sublabel">Min Reviews</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0 (None)"
            disabled={disabled}
            value={minReviews !== null ? minReviews : ''}
            onChange={handleMinChange}
            className={`text-input ${!validation.isValid ? 'input-error' : ''}`}
          />
        </div>

        <div className="range-divider">to</div>

        <div className="input-field-col">
          <label className="input-sublabel">Max Reviews</label>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="∞ (Unlimited)"
            disabled={disabled}
            value={maxReviews !== null ? maxReviews : ''}
            onChange={handleMaxChange}
            className={`text-input ${!validation.isValid ? 'input-error' : ''}`}
          />
        </div>
      </div>

      {!validation.isValid && (
        <div className="error-banner">
          <AlertCircle size={14} className="error-icon" />
          <span>{validation.error}</span>
        </div>
      )}

      <p className="field-hint">
        Inclusive review count filter. Discovered businesses must meet this range to count toward the target.
      </p>
    </div>
  );
};
