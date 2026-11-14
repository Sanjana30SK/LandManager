// Map settings used across the app.
export const MAP_CENTER = [12.9716, 77.5946]; // Bengaluru, as [lat, lng] (Leaflet's order)
export const DEFAULT_ZOOM = 11; // whole city visible
export const FOCUS_ZOOM = 15; // zoom used when jumping to one parcel

export const OSM_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
