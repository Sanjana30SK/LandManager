// Turn raw API values into text for people.

// 'under_dispute' -> 'Under dispute'
export const formatLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ') : '';

// 1200 -> '1,200 m²' (Indian digit grouping)
export const formatArea = (sqm) => (sqm == null ? 'Not specified' : `${sqm.toLocaleString('en-IN')} m²`);

// { lat, lng } -> '12.96980, 77.75000'
export const formatCoords = ({ lat, lng }) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

// ISO date -> '13 Nov 2026'
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
