// The details shown inside a marker's popup, with Edit and Delete buttons.
import StatusBadge from './StatusBadge.jsx';
import { formatArea, formatCoords, formatDate, formatLabel } from '../utils/format.js';

export default function ParcelDetails({ parcel, onEdit, onDelete }) {
  return (
    <div className="details">
      <h3 className="details__title">{parcel.title}</h3>
      <StatusBadge status={parcel.status} />
      <dl className="details__grid">
        <dt>Land use</dt>
        <dd>{formatLabel(parcel.landUse)}</dd>
        <dt>Owner</dt>
        <dd>{parcel.ownerName || 'Not specified'}</dd>
        <dt>Area</dt>
        <dd>{formatArea(parcel.areaSqm)}</dd>
        <dt>Location</dt>
        <dd className="mono">{formatCoords(parcel.location)}</dd>
        <dt>Added</dt>
        <dd>{formatDate(parcel.createdAt)}</dd>
        {parcel.updatedAt !== parcel.createdAt && (
          <>
            <dt>Updated</dt>
            <dd>{formatDate(parcel.updatedAt)}</dd>
          </>
        )}
      </dl>
      {parcel.description && <p className="details__description">{parcel.description}</p>}

      <div className="details__actions">
        <button type="button" className="btn btn--small" onClick={() => onEdit(parcel)}>
          Edit
        </button>
        <button type="button" className="btn btn--small btn--danger-outline" onClick={() => onDelete(parcel)}>
          Delete
        </button>
      </div>
    </div>
  );
}
