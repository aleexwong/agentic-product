import { useCallback, useEffect, useRef, useState } from 'react';

/** Syncs a state value to localStorage, hydrating on mount and persisting on every change. Silently ignores quota/privacy errors. */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // quota or privacy mode — silently ignore
    }
  }, [key, state]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) =>
        typeof value === 'function' ? (value as (p: T) => T)(prev) : value,
      );
    },
    [],
  );

  return [state, setValue];
}
