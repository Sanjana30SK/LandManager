import { useCallback, useEffect, useRef, useState } from 'react';
import { listParcels } from '../api/parcels.js';

export function useParcels(filters) {
  const [parcels, setParcels] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [resultsKey, setResultsKey] = useState(null);
  const latestRequest = useRef(0);

  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setStatus('loading');
    setError(null);
    try {
      const result = await listParcels(JSON.parse(key));
      // Only the newest request may update the list; a slower, older response is ignored.
      if (requestId !== latestRequest.current) return;
      setParcels(result.parcels);
      setTotal(result.total ?? result.parcels.length);
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

  const addParcel = useCallback((parcel) => {
    setParcels((current) => [parcel, ...current]);
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
