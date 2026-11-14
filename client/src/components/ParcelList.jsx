import { useEffect, useRef } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { formatArea, formatLabel } from '../utils/format.js';

function ParcelListItem({ parcel, isSelected, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isSelected]);

  return (
    <li>
      <button
        ref={ref}
        type="button"
        className={`parcel-item${isSelected ? ' parcel-item--selected' : ''}`}
        aria-current={isSelected ? 'true' : undefined}
        onClick={() => onSelect(parcel.id)}
      >
        <span className="parcel-item__top">
          <span className="parcel-item__title">{parcel.title}</span>
          <StatusBadge status={parcel.status} />
        </span>
        <span className="parcel-item__meta">
          {formatLabel(parcel.landUse)} · {formatArea(parcel.areaSqm)}
        </span>
      </button>
    </li>
  );
}

export default function ParcelList({ parcels, status, error, onRetry, selectedId, onSelect, filtered, onClearFilters }) {
  if (status === 'loading' && parcels.length === 0) {
    return (
      <p className="list-state" role="status">
        {filtered ? 'Searching…' : 'Loading parcels…'}
      </p>
    );
  }

  if (status === 'error') {
    return (
      <div className="list-state list-state--error" role="alert">
        <p>{error?.message || 'Could not load parcels.'}</p>
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (parcels.length === 0) {
    return filtered ? (
      <div className="list-state" role="status">
        <p>No parcels match your search and filters.</p>
        <button type="button" className="btn" onClick={onClearFilters}>
          Clear search and filters
        </button>
      </div>
    ) : (
      <p className="list-state">No parcels yet. Click anywhere on the map to add the first one.</p>
    );
  }

  return (
    <ul className={`parcel-list${status === 'loading' ? ' parcel-list--refreshing' : ''}`} aria-busy={status === 'loading'}>
      {parcels.map((parcel) => (
        <ParcelListItem
          key={parcel.id}
          parcel={parcel}
          isSelected={parcel.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
