import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchResultsProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  disabled?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchTerm,
  onSearchChange,
  disabled = false,
}) => {
  return (
    <div className="search-bar-wrapper">
      <Search size={14} className="search-icon" />
      <input
        type="text"
        placeholder="Filter results by name, address, phone, website..."
        disabled={disabled}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="search-clear-btn"
          aria-label="Clear filter"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
