import { useState, useCallback } from 'react';
import { AirportCity } from '../types/flight';

export function useAirportDirectory(initialQuery: string = 'تهران') {
  const [dirQuery, setDirQuery] = useState(initialQuery);
  const [dirResults, setDirResults] = useState<AirportCity[]>([]);
  const [isDirLoading, setIsDirLoading] = useState(false);

  const loadDirectory = useCallback(async (q: string) => {
    setIsDirLoading(true);
    try {
      const res = await fetch(`/api/airports/search?q=${encodeURIComponent(q)}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setDirResults(data);
      }
    } catch (err) {
      console.error('Failed to load airport directory:', err);
    } finally {
      setIsDirLoading(false);
    }
  }, []);

  return {
    dirQuery,
    setDirQuery,
    dirResults,
    isDirLoading,
    loadDirectory,
  };
}
