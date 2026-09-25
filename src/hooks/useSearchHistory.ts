import { useState, useCallback } from 'react';
import { SqliteSearchItem } from '../types/flight';

export function useSearchHistory() {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [sqliteSearches, setSqliteSearches] = useState<SqliteSearchItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  const fetchSqliteHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/history/searches');
      if (res.ok) {
        const data = await res.json();
        setSqliteSearches(data.searches || []);
      }
    } catch (err) {
      console.error('Failed to load SQLite history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  return {
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    sqliteSearches,
    isHistoryLoading,
    fetchSqliteHistory,
  };
}
