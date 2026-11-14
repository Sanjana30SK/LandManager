// The red pin showing where a parcel will be placed: a new one (create) or a moved one (edit).
// It can be dragged; typing coordinates in the form also moves it (and pans the map if needed).
import { useEffect } from 'react';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import { roundCoord } from '../utils/parcelForm.js';

const draftIcon = L.divIcon({
  className: 'draft-icon',
  html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 38], // the tip of the pin sits on the location
});

export default function DraftMarker({ location, onMove, title = 'New parcel location (drag to move)' }) {
  const map = useMap();
  const position = [location.lat, location.lng];

  // If the location is moved off-screen (e.g. typed in the form), bring it into view.
  useEffect(() => {
    if (!map.getBounds().contains([location.lat, location.lng])) map.panTo([location.lat, location.lng]);
  }, [location.lat, location.lng, map]);

  return (
    <Marker
      position={position}
      icon={draftIcon}
      draggable
      zIndexOffset={2000}
      title={title}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMove({ lat: roundCoord(lat), lng: roundCoord(lng) });
        },
      }}
    />
  );
}
