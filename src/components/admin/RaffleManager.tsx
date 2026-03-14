import React, { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Alert } from '../ui/Alert';
import type { IRaffleRound } from '@/types';

interface RaffleManagerProps {
  building    : string;
  activeRaffle: { _id: string; roundNumber: number; status: string; participants: unknown[] } | null;
  onRefresh   : () => void;
}

export const RaffleManager: React.FC<RaffleManagerProps> = ({ building, activeRaffle, onRefresh }) => {
  const api = useApi();
  const [msg,   setMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy,  setBusy]  = useState(false);
  const [start, setStart] = useState('');
  const [end,   setEnd]   = useState('');

  const createRaffle = async () => {
    if (!start || !end) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.post<IRaffleRound>('/raffle', { building, startDate: start, endDate: end });
      setMsg({ type: 'success', text: r.message ?? 'Raffle created' });
      onRefresh();
    } catch (e: unknown) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed' }); }
    finally { setBusy(false); }
  };

  const executeRaffle = async () => {
    if (!activeRaffle || !confirm(`Run raffle for Round #${activeRaffle.roundNumber}? This cannot be undone.`)) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.post('/raffle/execute', { raffleId: activeRaffle._id });
      setMsg({ type: 'success', text: r.message ?? 'Raffle executed' });
      onRefresh();
    } catch (e: unknown) { setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Raffle Management</h2>
      {msg && <Alert variant={msg.type} message={msg.text} onClose={() => setMsg(null)} />}
      {activeRaffle ? (
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="font-semibold text-indigo-800">Round #{activeRaffle.roundNumber} is {activeRaffle.status}</p>
            <p className="text-sm text-indigo-600 mt-1">{activeRaffle.participants.length} resident(s) registered</p>
          </div>
          <button onClick={executeRaffle} disabled={busy || activeRaffle.participants.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
            {busy ? 'Running draw...' : 'Execute Draw'}
          </button>
          {activeRaffle.participants.length === 0 && <p className="text-xs text-amber-600 text-center">No participants yet — cannot run draw.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">No active raffle. Create a new round:</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">End Date</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          </div>
          <button onClick={createRaffle} disabled={busy || !start || !end} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
            {busy ? 'Creating...' : '+ Create Raffle Round'}
          </button>
        </div>
      )}
    </div>
  );
};
