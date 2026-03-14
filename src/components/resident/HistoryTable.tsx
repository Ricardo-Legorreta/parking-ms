import React from 'react';
import { Badge } from '../ui/Badge';
import type { IParkingHistory } from '@/types';

const historyStatusVariant: Record<string, 'success' | 'neutral' | 'warning'> = { active: 'success', expired: 'neutral', released: 'warning' };

export const HistoryTable: React.FC<{ history: IParkingHistory[] }> = ({ history }) => {
  if (!history.length) return <p className="text-gray-400 text-center py-10">No parking history yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white">
        <thead className="bg-gray-50">
          <tr>{['Round','Spot','Floor','Type','Assigned','Expires','Status'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {history.map((h, i) => {
            const spot = h.spotId as unknown as { spotNumber: string; floor: number; type: string };
            return (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-indigo-600">#{h.roundNumber}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{spot?.spotNumber ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{spot?.floor ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 capitalize">{spot?.type ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.assignedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.expiresAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge label={h.status} variant={historyStatusVariant[h.status] ?? 'neutral'} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
