// The ONLY place that converts between the API format and the database format.
//
//   API / frontend:  { lat: 12.97, lng: 77.59 }                  (named values, no ordering)
//   MongoDB GeoJSON: { type: 'Point', coordinates: [77.59, 12.97] }  (longitude FIRST)
//
// Keeping the conversion here means the lng/lat order can only be wrong in one place.

export function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

// { lat, lng }  ->  GeoJSON Point
export function toGeoPoint({ lat, lng }) {
  return { type: 'Point', coordinates: [lng, lat] };
}

// GeoJSON Point  ->  { lat, lng }
export function toLatLng(point) {
  if (!point || !Array.isArray(point.coordinates)) return null;
  const [lng, lat] = point.coordinates;
  return { lat, lng };
}
