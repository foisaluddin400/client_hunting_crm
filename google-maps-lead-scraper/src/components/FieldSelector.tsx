import React from 'react';
import { SCRAPABLE_FIELDS, ScrapableFieldKey } from '../types/business';
import { CheckSquare, Square, Layers } from 'lucide-react';

interface FieldSelectorProps {
  selectedFields: ScrapableFieldKey[];
  disabled: boolean;
  onChange: (fields: ScrapableFieldKey[]) => void;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  selectedFields,
  disabled,
  onChange,
}) => {
  const allFieldKeys = SCRAPABLE_FIELDS.map((f) => f.key);
  const isAllSelected = selectedFields.length === allFieldKeys.length;

  const handleToggleField = (fieldKey: ScrapableFieldKey) => {
    if (disabled) return;
    if (selectedFields.includes(fieldKey)) {
      // Keep at least one field
      if (selectedFields.length > 1) {
        onChange(selectedFields.filter((k) => k !== fieldKey));
      }
    } else {
      onChange([...selectedFields, fieldKey]);
    }
  };

  const handleToggleAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      // Keep Business Name selected by default
      onChange(['name']);
    } else {
      onChange([...allFieldKeys]);
    }
  };

  return (
    <div className="card-section">
      <div className="section-header">
        <label className="section-title">
          <Layers size={14} className="title-icon" />
          Fields to Scrape & Export
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggleAll}
          className="link-action-btn"
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="checkbox-grid">
        {SCRAPABLE_FIELDS.map((field) => {
          const isChecked = selectedFields.includes(field.key);
          return (
            <label
              key={field.key}
              className={`checkbox-item ${isChecked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={isChecked}
                onChange={() => handleToggleField(field.key)}
                className="hidden-checkbox"
              />
              <span className="custom-checkbox">
                {isChecked ? (
                  <CheckSquare size={14} className="check-icon active" />
                ) : (
                  <Square size={14} className="check-icon" />
                )}
              </span>
              <span className="field-label-text">{field.label}</span>
            </label>
          );
        })}
      </div>

      <p className="field-hint">
        Selected fields determine table columns and CSV export columns. Internal scraper filters run regardless of export selection.
      </p>
    </div>
  );
};
