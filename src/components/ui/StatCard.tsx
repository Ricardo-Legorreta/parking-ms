import React from 'react';

export const StatCard: React.FC<{ label: string; value: number | string; sub?: string; icon?: React.ReactNode; color?: string }> =
  ({ label, value, sub, icon, color = 'text-indigo-600' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
    {icon && <div className={`p-3 rounded-xl bg-gray-50 ${color}`}>{icon}</div>}
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
);
