export const EMPTY_FILTERS = { search: '', status: '', landUse: '' };

export const hasActiveFilters = (f) => Boolean(f.search.trim() || f.status || f.landUse);

export function matchesFilters(parcel, f) {
  const search = f.search.trim().toLowerCase();
  if (search && !parcel.title.toLowerCase().includes(search)) return false;
  if (f.status && parcel.status !== f.status) return false;
  if (f.landUse && parcel.landUse !== f.landUse) return false;
  return true;
}
