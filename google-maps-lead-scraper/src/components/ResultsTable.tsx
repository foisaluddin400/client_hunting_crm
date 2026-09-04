import React, { useState } from 'react';
import {
  BusinessLead,
  SCRAPABLE_FIELDS,
  ScrapableFieldKey,
} from '../types/business';
import { SearchResults } from './SearchResults';
import { Download, Trash2, ExternalLink, CloudUpload, Loader2 } from 'lucide-react';

interface ResultsTableProps {
  businesses: BusinessLead[];
  selectedFields: ScrapableFieldKey[];
  isScrapingActive: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSaveData: () => void;
  isSaving: boolean;
  saveStatusMap: Record<string, 'imported' | 'duplicate' | 'failed'>;
  saveFeedbackMessage: string | null;
  onClearResults: () => void;
  onExportCsv: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  businesses,
  selectedFields,
  isScrapingActive,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSaveData,
  isSaving,
  saveStatusMap,
  saveFeedbackMessage,
  onClearResults,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter businesses by search term without mutating original data
  const filteredBusinesses = businesses.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = b.name?.toLowerCase().includes(term);
    const addrMatch = b.address?.toLowerCase().includes(term);
    const phoneMatch = b.phone?.toLowerCase().includes(term);
    const webMatch = b.website?.toLowerCase().includes(term);
    const catMatch = b.category?.toLowerCase().includes(term);
    return Boolean(nameMatch || addrMatch || phoneMatch || webMatch || catMatch);
  });

  if (businesses.length === 0) {
    return null;
  }

  const isAllSelected =
    businesses.length > 0 && businesses.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="results-container">
      {/* Save Feedback Banner */}
      {saveFeedbackMessage && (
        <div className="save-feedback-banner">
          <span>{saveFeedbackMessage}</span>
        </div>
      )}

      <div className="results-header-bar">
        <div className="results-count-title">
          <span className="count-number">{businesses.length}</span>
          <span className="count-text">businesses found</span>
          {someSelected && (
            <span className="selected-pill">({selectedIds.size} selected)</span>
          )}
          {searchTerm.trim() && (
            <span className="filtered-pill">
              ({filteredBusinesses.length} shown)
            </span>
          )}
        </div>

        <div className="results-actions">
          {/* Save Data Button */}
          <button
            type="button"
            disabled={isSaving || isScrapingActive}
            onClick={onSaveData}
            className={`action-btn save-data-btn ${isSaving ? 'saving' : ''}`}
            title="Save selected businesses directly to Client Hunting CRM database"
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="spin-icon" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CloudUpload size={13} />
                <span>Save Data {someSelected ? `(${selectedIds.size})` : ''}</span>
              </>
            )}
          </button>

          {/* Export CSV Button (Preserved) */}
          <button
            type="button"
            onClick={onExportCsv}
            className="action-btn export-btn"
            title="Export collected leads to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Clear Button (Preserved) */}
          <button
            type="button"
            disabled={isScrapingActive}
            onClick={onClearResults}
            className="action-btn clear-btn"
            title={isScrapingActive ? 'Cannot clear while scraping' : 'Clear all collected leads'}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Inline Search Bar */}
      <SearchResults searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Responsive Horizontal Scrolling Table */}
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  title="Select / Deselect all"
                  className="row-checkbox"
                />
              </th>
              <th className="index-col">#</th>
              <th className="crm-status-col">CRM Status</th>
              {selectedFields.map((fieldKey) => {
                const def = SCRAPABLE_FIELDS.find((f) => f.key === fieldKey);
                return <th key={fieldKey}>{def ? def.label : fieldKey}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.map((b, idx) => {
              const isChecked = selectedIds.has(b.id);
              const saveStatus = saveStatusMap[b.id];

              return (
                <tr key={b.id || idx} className={isChecked ? 'row-selected' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(b.id)}
                      className="row-checkbox"
                    />
                  </td>
                  <td className="index-col">{idx + 1}</td>
                  <td className="crm-status-col">
                    {saveStatus === 'imported' && (
                      <span className="save-badge badge-saved">✓ Saved</span>
                    )}
                    {saveStatus === 'duplicate' && (
                      <span className="save-badge badge-duplicate">⚠ Exists</span>
                    )}
                    {saveStatus === 'failed' && (
                      <span className="save-badge badge-failed">✕ Failed</span>
                    )}
                    {!saveStatus && <span className="empty-cell">—</span>}
                  </td>
                  {selectedFields.map((fieldKey) => (
                    <td key={fieldKey} className={`col-${fieldKey}`}>
                      {renderCellContent(b, fieldKey)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBusinesses.length === 0 && (
          <div className="empty-filter-state">
            No businesses match filter &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    </div>
  );
};

function renderCellContent(lead: BusinessLead, fieldKey: ScrapableFieldKey): React.ReactNode {
  const value = lead[fieldKey];
  if (value === null || value === undefined || value === '') {
    return <span className="empty-cell">—</span>;
  }

  if (fieldKey === 'mapsUrl') {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="cell-link"
        title={String(value)}
      >
        <span>View Place</span>
        <ExternalLink size={11} />
      </a>
    );
  }

  if (fieldKey === 'website') {
    let displayUrl = String(value).replace(/^https?:\/\/(www\.)?/, '');
    if (displayUrl.length > 25) {
      displayUrl = displayUrl.substring(0, 23) + '...';
    }
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="cell-link"
        title={String(value)}
      >
        <span>{displayUrl}</span>
        <ExternalLink size={11} />
      </a>
    );
  }

  if (fieldKey === 'rating') {
    return (
      <span className="rating-badge">
        ★ {Number(value).toFixed(1)}
      </span>
    );
  }

  if (fieldKey === 'reviewCount') {
    return <span className="review-badge">{Number(value).toLocaleString()}</span>;
  }

  if (fieldKey === 'openStatus') {
    const isClosed = /closed/i.test(String(value));
    return (
      <span className={`status-pill ${isClosed ? 'closed' : 'open'}`}>
        {String(value)}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}
