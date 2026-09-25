import { useState, useCallback } from 'react';
import { SandboxFormData, SandboxResultData } from '../types/flight';

const defaultForm: SandboxFormData = {
  airlineCode: 'W5',
  flightNumber: 'W5-1024',
  origin: 'THR',
  destination: 'MHD',
  departureAt: '2026-06-02T06:30:00Z',
  cabin: 'economy',
};

export function useKeySandbox() {
  const [sandboxForm, setSandboxForm] = useState<SandboxFormData>(defaultForm);
  const [sandboxResult, setSandboxResult] = useState<SandboxResultData | null>(null);

  const calculateSandboxKey = useCallback(async () => {
    try {
      const res = await fetch('/api/search/group-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sandboxForm),
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxResult(data);
      }
    } catch (err) {
      console.error('Failed to calculate sandbox key:', err);
    }
  }, [sandboxForm]);

  return {
    sandboxForm,
    setSandboxForm,
    sandboxResult,
    calculateSandboxKey,
  };
}
