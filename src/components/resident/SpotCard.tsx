import React from 'react';
import { Badge } from '../ui/Badge';
import type { IParkingSpot } from '@/types';

const typeLabel: Record<string, string> = { standard: 'Standard', accessible: 'Accessible', ev: 'EV Charging' };

export const SpotCard: React.FC<{ spot: IParkingSpot | null }> = ({ spot }) => {
  if (!spot) return (
    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
      <div className="text-5xl">P</div>
      <p className="text-gray-500 font-medium">No spot assigned</p>
      <p className="text-sm text-gray-400">Register for the next raffle to get a spot</p>
    </div>
  );
  const exp = spot.currentAssignment?.expiresAt
    ? new Date(spot.currentAssignment.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Your Spot</p>
          <p className="text-5xl font-black tracking-tight">{spot.spotNumber}</p>
          <p className="text-indigo-200 mt-1">Floor {spot.floor} &middot; Building {spot.building}</p>
        </div>
        <div className="bg-white/20 rounded-xl p-3 text-3xl">&#x1F697;</div>
      </div>
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Badge label={typeLabel[spot.type] ?? spot.type} variant="info" className="bg-white/20 text-white border-white/30" />
        <span className="text-indigo-200 text-sm">Expires {exp}</span>
      </div>
    </div>
  );
};
