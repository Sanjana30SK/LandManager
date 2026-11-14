// The Leaflet map: OpenStreetMap tiles + one marker per parcel.
// - Clicking a marker selects the parcel; selecting a parcel elsewhere (the list) flies the map to it.
// - Clicking an empty spot reports the location (used to create a parcel).
// - While creating or editing, a draggable red pin (DraftMarker) shows the parcel's location.
//   When editing, the parcel's normal marker is hidden so the red pin stands in for it.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import ParcelDetails from './ParcelDetails.jsx';
import DraftMarker from './DraftMarker.jsx';
import { MAP_CENTER, DEFAULT_ZOOM, FOCUS_ZOOM, OSM_TILES } from '../constants.js';

// Lives inside <MapContainer> so it can use the map instance (useMap only works there).
function FlyToSelected({ parcel, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!parcel) return;
    const latlng = L.latLng(parcel.location.lat, parcel.location.lng);
    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);

    // The popup opens ABOVE the marker. If the marker were in the middle of the map, a tall
    // popup would be cut off at the top on laptop-height screens. So aim the map a bit
    // higher than the marker: the marker ends up in the lower part, with room above it.
    const roomAbove = map.getSize().y * 0.25;
    const target = map.unproject(map.project(latlng, zoom).subtract([0, roomAbove]), zoom);

    // Open the popup once the map has stopped moving, so Leaflet can still nudge it fully
    // into view (it can't while flying). The extra tick matters for a just-created marker,
    // which React is still setting up (StrictMode mounts it twice in development).
    let opened = false;
    let tick;
    const open = () => {
      if (opened) return;
      opened = true;
      tick = setTimeout(() => markerRefs.current.get(parcel.id)?.openPopup(), 0);
    };
    map.once('moveend', open);
    const fallback = setTimeout(open, 1200); // in case the map didn't need to move at all
    map.flyTo(target, zoom, { duration: 0.8 });

    return () => {
      map.off('moveend', open);
      clearTimeout(fallback);
      clearTimeout(tick);
    };
  }, [parcel, map, markerRefs]);

  return null;
}

// Leaflet measures its container once. If the container changes size later (window resized,
// phone rotated, layout switching to mobile) the map must re-measure, or parts stay grey.
function ResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

// After a search / filter change, zoom the map to show all matching parcels.
// Skipped on the first load (the map starts centred on Bengaluru), while a parcel is
// selected (the map is already flying to it) and while the form is open.
function FitToResults({ parcels, resultsKey, enabled }) {
  const map = useMap();
  const firstKey = useRef(resultsKey);

  useEffect(() => {
    if (!resultsKey || resultsKey === firstKey.current) return;
    firstKey.current = null; // from now on, every new set of results is fitted
    if (!enabled || parcels.length === 0) return;
    map.closePopup();
    const bounds = L.latLngBounds(parcels.map((p) => [p.location.lat, p.location.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: FOCUS_ZOOM, duration: 0.6 });
    // Only react to new results, not to every change of `parcels` (e.g. after an edit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsKey]);

  return null;
}

// A small "reset view" button under the zoom buttons: back to the whole of Bengaluru.
function ResetViewButton() {
  const map = useMap();
  const ref = useRef(null);

  // Stop clicks on the button from reaching the map (which would start a new parcel).
  useEffect(() => {
    L.DomEvent.disableClickPropagation(ref.current);
  }, []);

  return (
    <div className="leaflet-top leaflet-left reset-view">
      <div className="leaflet-control leaflet-bar">
        <a
          ref={ref}
          href="#"
          role="button"
          title="Reset view to Bengaluru"
          aria-label="Reset view to Bengaluru"
          onClick={(e) => {
            e.preventDefault();
            map.flyTo(MAP_CENTER, DEFAULT_ZOOM, { duration: 0.6 });
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 2 11h3v9h6v-6h2v6h6v-9h3L12 3Z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// Reports clicks on empty map space.
// A click that only closes an open popup is ignored; otherwise closing a popup by
// clicking the map would unexpectedly start creating a parcel.
function MapClickHandler({ onMapClick }) {
  const popupOpen = useRef(false);
  const popupWasOpenAtPress = useRef(false);

  useMapEvents({
    popupopen: () => (popupOpen.current = true),
    popupclose: () => (popupOpen.current = false),
    mousedown: () => (popupWasOpenAtPress.current = popupOpen.current),
    click: (e) => {
      if (popupWasOpenAtPress.current) return;
      onMapClick(e.latlng);
    },
  });

  return null;
}

export default function ParcelMap({
  parcels,
  selectedId,
  onSelect,
  onMapClick,
  onEdit,
  onDelete,
  draft, // { mode, id?, location } or null
  onDraftMove,
  resultsKey, // changes whenever a new set of search / filter results arrives
}) {
  // Keeps a handle on every Leaflet marker (by parcel id) so we can open its popup from code.
  const markerRefs = useRef(new Map());
  const selected = parcels.find((p) => p.id === selectedId) ?? null;
  const hiddenId = draft?.mode === 'edit' ? draft.id : null;

  return (
    <MapContainer center={MAP_CENTER} zoom={DEFAULT_ZOOM} className="map" scrollWheelZoom>
      <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} />

      {parcels.filter((p) => p.id !== hiddenId).map((parcel) => (
        <Marker
          key={parcel.id}
          position={[parcel.location.lat, parcel.location.lng]}
          title={parcel.title}
          zIndexOffset={parcel.id === selectedId ? 1000 : 0}
          ref={(marker) => {
            if (marker) markerRefs.current.set(parcel.id, marker);
            else markerRefs.current.delete(parcel.id);
          }}
          eventHandlers={{
            click: () => onSelect(parcel.id),
            // Closing this popup clears the selection, unless another parcel was selected meanwhile.
            popupclose: () => onSelect((current) => (current === parcel.id ? null : current)),
          }}
        >
          {/* autoPanPadding: if the popup would touch the map's edge, the map shifts so it
              stays fully visible with some breathing room (more at the top for the controls). */}
          <Popup autoPanPaddingTopLeft={[60, 24]} autoPanPaddingBottomRight={[24, 24]}>
            <ParcelDetails parcel={parcel} onEdit={onEdit} onDelete={onDelete} />
          </Popup>
        </Marker>
      ))}

      {draft && (
        <DraftMarker
          location={draft.location}
          onMove={onDraftMove}
          title={draft.mode === 'edit' ? 'Parcel location (drag to move)' : 'New parcel location (drag to move)'}
        />
      )}

      <FlyToSelected parcel={selected} markerRefs={markerRefs} />
      <FitToResults parcels={parcels} resultsKey={resultsKey} enabled={!selectedId && !draft} />
      <ResetViewButton />
      <MapClickHandler onMapClick={onMapClick} />
      <ResizeWatcher />
    </MapContainer>
  );
}
