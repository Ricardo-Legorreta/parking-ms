import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useMe } from '@/hooks/useMe';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Navbar } from '@/components/layout/Navbar';
import { StatsGrid } from '@/components/admin/StatsGrid';
import { RaffleManager } from '@/components/admin/RaffleManager';

const BUILDINGS = ['A', 'B', 'C', 'D'];

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const router = useRouter();
  const { data: me, loading: meLoading } = useMe();
  const [building, setBuilding] = useState('A');
  const { stats, loading, error, refetch } = useAdminStats(building);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/');
    if (!meLoading && me && me.resident.role !== 'admin') router.push('/dashboard');
  }, [authLoading, isAuthenticated, meLoading, me]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="admin" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-black text-gray-900">Admin Overview</h1><p className="text-gray-400 text-sm mt-1">Manage parking allocation across buildings</p></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Building:</span>
            <div className="flex gap-1">
              {BUILDINGS.map(b => (
                <button key={b} onClick={() => setBuilding(b)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${building === b ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{b}</button>
              ))}
            </div>
          </div>
        </div>
        {loading && <p className="text-gray-400 text-center py-8">Loading stats...</p>}
        {error   && <p className="text-red-500 text-center py-8">{error}</p>}
        {stats   && <StatsGrid stats={stats} />}
        {stats   && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RaffleManager building={building} activeRaffle={stats.activeRaffle as any} onRefresh={refetch} />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Top Winners</h2>
              {stats.topWinners.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No winners yet</p>
              ) : (
                <ul className="space-y-2">
                  {stats.topWinners.map((w, i) => (
                    <li key={w._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{['1st','2nd','3rd','4th','5th'][i]}</span>
                        <div><p className="text-sm font-semibold text-gray-800">{w.name}</p><p className="text-xs text-gray-400">Unit {w.unit}</p></div>
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{w.totalWins} win{w.totalWins !== 1 ? 's' : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
