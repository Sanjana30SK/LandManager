import { useCallback, useEffect, useMemo, useState } from 'react';
import FilterBar from './components/FilterBar.jsx';
import ParcelList from './components/ParcelList.jsx';
import ParcelMap from './components/ParcelMap.jsx';
import ParcelForm from './components/ParcelForm.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toasts from './components/Toasts.jsx';
import { useParcels } from './hooks/useParcels.js';
import { useMeta } from './hooks/useMeta.js';
import { useToasts } from './hooks/useToasts.js';
import { useDebouncedValue } from './hooks/useDebouncedValue.js';
import { createParcel, deleteParcel, updateParcel } from './api/parcels.js';
import { roundCoord } from './utils/parcelForm.js';
import { EMPTY_FILTERS, hasActiveFilters, matchesFilters } from './utils/filters.js';

export default function App() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const queryFilters = useMemo(
    () => ({ search: debouncedSearch, status: filters.status, landUse: filters.landUse }),
    [debouncedSearch, filters.status, filters.landUse],
  );
  const filtered = hasActiveFilters(queryFilters);

  const { parcels, total, status, error, resultsKey, reload, addParcel, replaceParcel, removeParcel } =
    useParcels(queryFilters);
  const { meta, error: metaError, reload: reloadMeta } = useMeta();
  const { toasts, showToast, dismiss } = useToasts();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteState, setDeleteState] = useState({ busy: false, error: null });

  const editingParcel = draft?.mode === 'edit' ? (parcels.find((p) => p.id === draft.id) ?? null) : null;

  useEffect(() => {
    if (draft?.mode === 'edit' && !editingParcel) setDraft(null);
  }, [draft, editingParcel]);

  const changeFilters = useCallback((next) => {
    setSelectedId(null);
    setFilters(next);
  }, []);

  const clearFilters = useCallback(() => changeFilters(EMPTY_FILTERS), [changeFilters]);

  // If a saved parcel doesn't match the active filters, clear them so it doesn't seem to vanish.
  const keepVisible = useCallback(
    (parcel) => {
      if (matchesFilters(parcel, queryFilters)) return false;
      setFilters(EMPTY_FILTERS);
      return true;
    },
    [queryFilters],
  );

  const handleMapClick = useCallback((latlng) => {
    const location = { lat: roundCoord(latlng.lat), lng: roundCoord(latlng.lng) };
    setSelectedId(null);
    setDraft((current) => (current ? { ...current, location } : { mode: 'create', location }));
  }, []);

  const startEdit = useCallback((parcel) => {
    setSelectedId(null);
    setDraft({ mode: 'edit', id: parcel.id, location: parcel.location });
  }, []);

  const setDraftLocation = useCallback((location) => setDraft((d) => (d ? { ...d, location } : d)), []);

  const cancelDraft = useCallback(() => {
    if (draft?.mode === 'edit') setSelectedId(draft.id);
    setDraft(null);
  }, [draft]);

  const handleSubmit = useCallback(
    async (payload) => {
      if (draft.mode === 'edit') {
        try {
          const updated = await updateParcel(draft.id, payload);
          replaceParcel(updated);
          setDraft(null);
          setSelectedId(updated.id);
          const cleared = keepVisible(updated);
          showToast(`Saved changes to “${updated.title}”${cleared ? '. Filters were cleared so you can see it' : ''}`);
        } catch (err) {
          if (err.status !== 404) throw err;
          removeParcel(draft.id);
          setDraft(null);
          showToast('This parcel no longer exists. It may have been deleted elsewhere.', 'error');
        }
        return;
      }

      const created = await createParcel(payload);
      addParcel(created);
      setDraft(null);
      setSelectedId(created.id);
      const cleared = keepVisible(created);
      showToast(`Added “${created.title}”${cleared ? '. Filters were cleared so you can see it' : ''}`);
    },
    [draft, addParcel, replaceParcel, removeParcel, showToast, keepVisible],
  );

  const requestDelete = useCallback((parcel) => {
    setDeleteState({ busy: false, error: null });
    setPendingDelete(parcel);
  }, []);

  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const confirmDelete = useCallback(async () => {
    const parcel = pendingDelete;
    setDeleteState({ busy: true, error: null });
    let alreadyGone = false;
    try {
      await deleteParcel(parcel.id);
    } catch (err) {
      if (err.status !== 404) {
        setDeleteState({ busy: false, error: err.message });
        return;
      }
      alreadyGone = true;
    }
    removeParcel(parcel.id);
    setSelectedId((current) => (current === parcel.id ? null : current));
    setPendingDelete(null);
    setDeleteState({ busy: false, error: null });
    showToast(alreadyGone ? `“${parcel.title}” had already been deleted` : `Deleted “${parcel.title}”`);
  }, [pendingDelete, removeParcel, showToast]);

  const isEditing = draft?.mode === 'edit';
  const formReady = draft && (!isEditing || editingParcel);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <svg className="app-header__logo" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <div>
            <h1 className="app-header__title">Land Parcel Manager</h1>
            <p className="app-header__subtitle">Bengaluru</p>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar" aria-label={draft ? 'Parcel form' : 'Parcel list'}>
          {formReady ? (
            <>
              <div className="sidebar__header">
                <h2 className="sidebar__title">{isEditing ? 'Edit parcel' : 'New parcel'}</h2>
                <p className="sidebar__hint">
                  {isEditing ? `Editing “${editingParcel.title}”. ` : ''}Fields marked * are required.
                </p>
              </div>
              <div className="sidebar__body">
                {meta ? (
                  <ParcelForm
                    key={isEditing ? `edit-${draft.id}` : 'create'}
                    meta={meta}
                    parcel={editingParcel}
                    location={draft.location}
                    onLocationChange={setDraftLocation}
                    onSubmit={handleSubmit}
                    onCancel={cancelDraft}
                    submitLabel={isEditing ? 'Save changes' : 'Save parcel'}
                  />
                ) : metaError ? (
                  <div className="list-state list-state--error" role="alert">
                    <p>Could not load the form options. {metaError.message}</p>
                    <button type="button" className="btn" onClick={reloadMeta}>
                      Try again
                    </button>
                  </div>
                ) : (
                  <p className="list-state">Loading form…</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="sidebar__header">
                <h2 className="sidebar__title">
                  Parcels
                  {status !== 'error' && resultsKey !== null && (
                    <span className="count" aria-live="polite">
                      {filtered ? `${parcels.length} of ${total}` : total}
                    </span>
                  )}
                </h2>
                <p className="sidebar__hint">Select a parcel to see it on the map, or click the map to add one.</p>
                <FilterBar filters={filters} onChange={changeFilters} onClear={clearFilters} meta={meta} />
              </div>
              <ParcelList
                parcels={parcels}
                status={status}
                error={error}
                onRetry={reload}
                selectedId={selectedId}
                onSelect={setSelectedId}
                filtered={filtered}
                onClearFilters={clearFilters}
              />
            </>
          )}
        </aside>

        <section className={`map-pane${draft ? ' map-pane--picking' : ''}`} aria-label="Map">
          <ParcelMap
            parcels={parcels}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMapClick={handleMapClick}
            onEdit={startEdit}
            onDelete={requestDelete}
            draft={draft}
            onDraftMove={setDraftLocation}
            resultsKey={resultsKey}
          />
          {(draft || !selectedId) && (
            <p className={`map-hint${draft ? '' : ' map-hint--idle'}`} aria-live="polite">
              {isEditing
                ? 'Drag the red pin or click the map to move this parcel'
                : draft
                  ? 'Click the map or drag the red pin to set the location'
                  : 'Click anywhere on the map to add a parcel'}
            </p>
          )}
          <Toasts toasts={toasts} onDismiss={dismiss} />
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete parcel?"
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleteState.busy}
        error={deleteState.error}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      >
        <p>
          <strong>“{pendingDelete?.title}”</strong> will be permanently deleted. This can’t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
