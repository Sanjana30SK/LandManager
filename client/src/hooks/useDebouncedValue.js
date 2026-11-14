// Returns `value`, but only after it has stopped changing for `delay` ms.
// Used for the search box: the server is asked once the user pauses typing,
// not on every key press. An empty value (search cleared) is applied immediately.
import { useEffect, useState } from 'react';

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === '') {
      setDebounced('');
      return undefined;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
