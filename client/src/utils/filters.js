// Search + filter helpers shared by the filter bar and App.

export const EMPTY_FILTERS = { search: '', status: '', landUse: '' };

export const hasActiveFilters = (f) => Boolean(f.search.trim() || f.status || f.landUse);

// Does a parcel match the filters? Mirrors the server's rules (case-insensitive partial
// title match + exact status / land use). Used after saving, to know whether the
// saved parcel would be visible in the current filtered list.
export function matchesFilters(parcel, f) {
  const search = f.search.trim().toLowerCase();
  if (search && !parcel.title.toLowerCase().includes(search)) return false;
  if (f.status && parcel.status !== f.status) return false;
  if (f.landUse && parcel.landUse !== f.landUse) return false;
  return true;
}
