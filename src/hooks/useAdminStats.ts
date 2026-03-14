import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface AdminStats {
  residents   : { total: number };
  spots       : { total: number; occupied: number; available: number };
  rounds      : { total: number };
  activeRaffle: { roundNumber: number; status: string; participants: unknown[]; startDate: string; endDate: string } | null;
  topWinners  : { _id: string; name: string; unit: string; totalWins: number }[];
}

export function useAdminStats(building: string) {
  const api = useApi();
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!building) return;
    setLoading(true);
    api.get<AdminStats>(`/admin/stats?building=${building}`)
      .then(r => setStats(r.data ?? null))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [building]); // eslint-disable-line

  return { stats, loading, error };
}
