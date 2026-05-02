import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * State that persists to AsyncStorage, survives page reloads and app restarts.
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw) {
        try {
          setState(JSON.parse(raw));
        } catch {
          // corrupted cache, use initial value
        }
      }
      setLoaded(true);
    });
  }, [key]);

  const setAndPersist = useCallback(
    (value: React.SetStateAction<T>) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [key],
  );

  return [loaded ? state : initialValue, setAndPersist];
}
