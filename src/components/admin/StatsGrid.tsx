import React from 'react';
import { StatCard } from '../ui/StatCard';
import type { AdminStats } from '@/hooks/useAdminStats';

export const StatsGrid: React.FC<{ stats: AdminStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Total Residents" value={stats.residents.total}   sub="All active residents" icon={<span className="text-xl">&#x1F465;</span>} color="text-indigo-600" />
    <StatCard label="Available Spots" value={stats.spots.available}   sub={`${stats.spots.occupied} occupied of ${stats.spots.total}`} icon={<span className="text-xl">P</span>} color="text-green-600" />
    <StatCard label="Raffle Rounds"   value={stats.rounds.total}      sub="All time" icon={<span className="text-xl">&#x1F3B2;</span>} color="text-purple-600" />
    <StatCard label="Active Raffle"   value={stats.activeRaffle ? `Round #${stats.activeRaffle.roundNumber}` : 'None'} sub={stats.activeRaffle ? `${stats.activeRaffle.participants.length} registered` : 'No raffle running'} icon={<span className="text-xl">&#x1F3AB;</span>} color="text-amber-600" />
  </div>
);
