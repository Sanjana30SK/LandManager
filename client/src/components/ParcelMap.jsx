import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import ParcelDetails from './ParcelDetails.jsx';
import DraftMarker from './DraftMarker.jsx';
import { MAP_CENTER, DEFAULT_ZOOM, FOCUS_ZOOM, OSM_TILES } from '../constants.js';

function FlyToSelected({ parcel, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!parcel) return;
    const latlng = L.latLng(parcel.location.lat, parcel.location.lng);
    const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);

    // Aim above the marker so its popup (which opens upward) fits on screen.
    const roomAbove = map.getSize().y * 0.25;
    const target = map.unproject(map.project(latlng, zoom).subtract([0, roomAbove]), zoom);

    // Open once the map stops moving so Leaflet can pan the popup into view; the extra tick
    // lets a just-created marker finish mounting (StrictMode mounts it twice in development).
    let opened = false;
    let tick;
    const open = () => {
      if (opened) return;
      opened = true;
      tick = setTimeout(() => markerRefs.current.get(parcel.id)?.openPopup(), 0);
    };
    map.once('moveend', open);
    const fallback = setTimeout(open, 1200);
    map.flyTo(target, zoom, { duration: 0.8 });

    return () => {
      map.off('moveend', open);
      clearTimeout(fallback);
      clearTimeout(tick);
    };
  }, [parcel, map, markerRefs]);

  return null;
}

// Leaflet measures its container once; re-measure on resize or parts of the map stay grey.
function ResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function FitToResults({ parcels, resultsKey, enabled }) {
  const map = useMap();
  const firstKey = useRef(resultsKey);

  useEffect(() => {
    if (!resultsKey || resultsKey === firstKey.current) return;
    firstKey.current = null;
    if (!enabled || parcels.length === 0) return;
    map.closePopup();
    const bounds = L.latLngBounds(parcels.map((p) => [p.location.lat, p.location.lng]));
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: FOCUS_ZOOM, duration: 0.6 });
  }, [resultsKey]);

  return null;
}

function ResetViewButton() {
  const map = useMap();
  const ref = useRef(null);

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

// A click that only closes a popup is ignored, so it doesn't start a new parcel.
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
  draft,
  onDraftMove,
  resultsKey,
}) {
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
            popupclose: () => onSelect((current) => (current === parcel.id ? null : current)),
          }}
        >
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
