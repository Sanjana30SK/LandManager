import { formatLabel } from '../utils/format.js';

// Small coloured label, e.g. "Sold". The colour comes from CSS (.badge--sold etc.).
export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{formatLabel(status)}</span>;
}
