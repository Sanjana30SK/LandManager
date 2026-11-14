// Search box + status / land-use filters shown above the parcel list.
// Keyboard: "/" anywhere focuses the search box; Esc inside it clears the search.
import { useEffect, useRef } from 'react';
import { formatLabel } from '../utils/format.js';
import { hasActiveFilters } from '../utils/filters.js';

export default function FilterBar({ filters, onChange, onClear, meta }) {
  const searchRef = useRef(null);
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  // "/" focuses search (unless the user is already typing somewhere).
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
      if (e.key === '/' && !typing && !e.target.closest?.('dialog')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="filters" role="search">
      <div className="search">
        <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
        </svg>
        <input
          ref={searchRef}
          type="search"
          className="search__input"
          placeholder="Search by title…"
          aria-label="Search parcels by title"
          value={filters.search}
          maxLength={100}
          onChange={set('search')}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && filters.search) {
              e.stopPropagation();
              onChange({ ...filters, search: '' });
            }
          }}
        />
        {filters.search ? (
          <button
            type="button"
            className="search__clear"
            aria-label="Clear search"
            onClick={() => {
              onChange({ ...filters, search: '' });
              searchRef.current?.focus();
            }}
          >
            ×
          </button>
        ) : (
          <kbd className="search__kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>

      <div className="filters__row">
        <select aria-label="Filter by status" value={filters.status} onChange={set('status')} disabled={!meta}>
          <option value="">Any status</option>
          {meta?.statuses.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
        <select aria-label="Filter by land use" value={filters.landUse} onChange={set('landUse')} disabled={!meta}>
          <option value="">Any land use</option>
          {meta?.landUses.map((l) => (
            <option key={l} value={l}>
              {formatLabel(l)}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters(filters) && (
        <button type="button" className="link-button" onClick={onClear}>
          Clear search and filters
        </button>
      )}
    </div>
  );
}
