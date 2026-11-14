// Custom hook that owns the list of parcels shown in the app.
// It loads parcels matching `filters` ({ search, status, landUse }) from the server and
// reloads whenever the filters change. The map and the sidebar both read from this ONE
// list, so they always show the same parcels.
import { useCallback, useEffect, useRef, useState } from 'react';
import { listParcels } from '../api/parcels.js';

export function useParcels(filters) {
  const [parcels, setParcels] = useState([]);
  const [total, setTotal] = useState(0); // all parcels in the database, ignoring filters
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [resultsKey, setResultsKey] = useState(null); // which filters the current list belongs to
  const latestRequest = useRef(0);

  // A string version of the filters: effects re-run only when a filter value really changes.
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setStatus('loading');
    setError(null);
    try {
      const result = await listParcels(JSON.parse(key));
      // While the user types, several requests can be in flight. Only the newest may update
      // the screen, otherwise a slow old answer could overwrite the latest results.
      if (requestId !== latestRequest.current) return;
      setParcels(result.parcels);
      setTotal(result.total ?? result.parcels.length); // fallback if an older API omits `total`
      setResultsKey(key);
      setStatus('ready');
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err);
      setStatus('error');
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  // Local updates after create / edit / delete, so the screen changes without a full reload.
  const addParcel = useCallback((parcel) => {
    setParcels((current) => [parcel, ...current]); // the list is newest first
    setTotal((t) => t + 1);
  }, []);

  const replaceParcel = useCallback((parcel) => {
    setParcels((current) => current.map((p) => (p.id === parcel.id ? parcel : p)));
  }, []);

  const removeParcel = useCallback((id) => {
    setParcels((current) => current.filter((p) => p.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return { parcels, total, status, error, resultsKey, reload: load, addParcel, replaceParcel, removeParcel };
}
