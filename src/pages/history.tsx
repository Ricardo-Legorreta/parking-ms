import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useApi } from '@/hooks/useApi';
import { useMe } from '@/hooks/useMe';
import { Navbar } from '@/components/layout/Navbar';
import { HistoryTable } from '@/components/resident/HistoryTable';
import type { IParkingHistory } from '@/types';

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const router = useRouter();
  const api    = useApi();
  const { data: me } = useMe();
  const [history, setHistory] = useState<IParkingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/'); }, [authLoading, isAuthenticated]);  
  useEffect(() => { api.get<IParkingHistory[]>('/history').then(r => setHistory(r.data ?? [])).finally(() => setLoading(false)); }, []);  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={me?.resident.role ?? 'resident'} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div><h1 className="text-2xl font-black text-gray-900">Parking History</h1><p className="text-gray-400 text-sm mt-1">All your past and current parking assignments</p></div>
        {loading ? <p className="text-gray-400 text-center py-10">Loading...</p> : <HistoryTable history={history} />}
      </main>
    </div>
  );
}
