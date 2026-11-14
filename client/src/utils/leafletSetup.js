// Fixes Leaflet's default marker icon when used with a bundler like Vite.
// Leaflet normally guesses the icon image URLs from its CSS file location, which breaks
// after bundling (markers show as broken images). Importing the images lets Vite give
// them proper URLs, and we hand those to Leaflet directly.
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
