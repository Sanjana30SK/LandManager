export const formatLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ') : '';

export const formatArea = (sqm) => (sqm == null ? 'Not specified' : `${sqm.toLocaleString('en-IN')} m²`);

export const formatCoords = ({ lat, lng }) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
