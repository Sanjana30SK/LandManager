import { formatLabel } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{formatLabel(status)}</span>;
}
