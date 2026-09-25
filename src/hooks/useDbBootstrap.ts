import { useState, useCallback } from 'react';
import { DbStatusData } from '../types/flight';

export interface BootstrapLogs {
  bootstrap?: string;
  seed?: string;
  error?: string;
}

export function useDbBootstrap() {
  const [dbStatus, setDbStatus] = useState<DbStatusData | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapLogs, setBootstrapLogs] = useState<BootstrapLogs | null>(null);

  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
    }
  }, []);

  const runDbBootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    setBootstrapLogs(null);
    try {
      const res = await fetch('/api/bootstrap/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBootstrapLogs({
          bootstrap: data.bootstrapLog,
          seed: data.seedLog,
        });
        await fetchDbStatus();
      } else {
        setBootstrapLogs({ error: data.error });
      }
    } catch (err: any) {
      setBootstrapLogs({ error: err.message || 'Bootstrap execution failed' });
    } finally {
      setIsBootstrapping(false);
    }
  }, [fetchDbStatus]);

  return {
    dbStatus,
    isBootstrapping,
    bootstrapLogs,
    fetchDbStatus,
    runDbBootstrap,
  };
}
