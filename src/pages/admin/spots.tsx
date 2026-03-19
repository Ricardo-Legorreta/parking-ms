import { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useMe } from '@/hooks/useMe';
import { useApi } from '@/hooks/useApi';
import { Navbar } from '@/components/layout/Navbar';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import type { IParkingSpot } from '@/types';

const BUILDINGS = ['A', 'B', 'C', 'D'];
const SPOT_TYPES = ['standard', 'accessible', 'ev'] as const;

interface NewSpot {
  spotNumber: string;
  building: string;
  floor: string;
  type: typeof SPOT_TYPES[number];
}

const initialSpot: NewSpot = { spotNumber: '', building: 'A', floor: '1', type: 'standard' };

export default function AdminSpotsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const router = useRouter();
  const { data: me, loading: meLoading } = useMe();
  const api = useApi();

  const [building, setBuilding] = useState('A');
  const [spots, setSpots] = useState<IParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<NewSpot>(initialSpot);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/');
    if (!meLoading && me && me.resident.role !== 'admin') router.push('/dashboard');
  }, [authLoading, isAuthenticated, meLoading, me]);  

  const fetchSpots = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<IParkingSpot[]>(`/spots?building=${building}`)
      .then(r => setSpots(r.data ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [building]);  

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.spotNumber.trim()) { setMsg({ type: 'error', text: 'Spot number is required' }); return; }
    setCreating(true);
    setMsg(null);
    try {
      await api.post('/spots', {
        spotNumber: form.spotNumber.trim().toUpperCase(),
        building: form.building,
        floor: parseInt(form.floor),
        type: form.type,
      });
      setMsg({ type: 'success', text: `Spot ${form.spotNumber.toUpperCase()} created` });
      setForm(initialSpot);
      if (form.building === building) fetchSpots();
    } catch (e: unknown) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to create spot' });
    } finally {
      setCreating(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';
  const occupied = spots.filter(s => s.currentAssignment).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="admin" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Parking Spots</h1>
            <p className="text-gray-400 text-sm mt-1">Create and view parking spots by building</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Building:</span>
            <div className="flex gap-1">
              {BUILDINGS.map(b => (
                <button key={b} onClick={() => setBuilding(b)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${building === b ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{b}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Create Spot Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Spot</h2>
          {msg && <div className="mb-4"><Alert variant={msg.type} message={msg.text} onClose={() => setMsg(null)} /></div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spot Number</label>
              <input type="text" value={form.spotNumber} onChange={e => setForm(f => ({ ...f, spotNumber: e.target.value }))} placeholder="A-101" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <select value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value }))} className={inputCls}>
                {BUILDINGS.map(b => <option key={b} value={b}>Building {b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input type="number" min="1" max="20" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as NewSpot['type'] }))} className={inputCls}>
                {SPOT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors">
              {creating ? 'Creating...' : 'Add Spot'}
            </button>
          </form>
        </div>

        {/* Spots Summary */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><strong className="text-gray-800">{spots.length}</strong> total spots</span>
          <span><strong className="text-green-600">{spots.length - occupied}</strong> available</span>
          <span><strong className="text-amber-600">{occupied}</strong> occupied</span>
        </div>

        {/* Spots Table */}
        {loading && <p className="text-gray-400 text-center py-8">Loading spots...</p>}
        {error && <p className="text-red-500 text-center py-8">{error}</p>}
        {!loading && !error && spots.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400">No spots found for Building {building}. Create one above.</p>
          </div>
        )}
        {!loading && spots.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Spot</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Floor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Until</th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map(spot => (
                    <tr key={spot._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-800">{spot.spotNumber}</td>
                      <td className="px-5 py-3 text-gray-600">{spot.floor}</td>
                      <td className="px-5 py-3">
                        <Badge
                          label={spot.type.charAt(0).toUpperCase() + spot.type.slice(1)}
                          variant={spot.type === 'ev' ? 'info' : spot.type === 'accessible' ? 'warning' : 'neutral'}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          label={spot.currentAssignment ? 'Occupied' : 'Available'}
                          variant={spot.currentAssignment ? 'danger' : 'success'}
                        />
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {spot.currentAssignment ? new Date(spot.currentAssignment.expiresAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
