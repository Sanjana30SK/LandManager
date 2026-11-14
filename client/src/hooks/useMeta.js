import { useCallback, useEffect, useState } from 'react';
import { getMeta } from '../api/parcels.js';

export function useMeta() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMeta(await getMeta());
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { meta, error, reload: load };
}
