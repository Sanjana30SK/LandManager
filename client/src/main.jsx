// Entry point: loads global styles and the Leaflet setup, then renders <App />.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css'; // Leaflet's own styles (map tiles, popups, controls)
import './utils/leafletSetup.js';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
