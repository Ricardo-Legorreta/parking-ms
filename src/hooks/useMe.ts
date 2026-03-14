import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import type { IResident, IParkingSpot, IRaffleRound } from '@/types';

export interface MeData {
  resident    : IResident;
  currentSpot : IParkingSpot | null;
  raffle      : IRaffleRound | null;
  eligibility : { isRegisteredInRaffle: boolean };
}

export function useMe() {
  const api = useApi();
  const [data,    setData]    = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<MeData>('/residents/me');
      setData(res.data ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line
  return { data, loading, error, refetch: fetchData };
}
