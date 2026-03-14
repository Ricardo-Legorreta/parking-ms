import React from 'react';

interface EligibilityProps {
  isRegisteredInRaffle: boolean;
  onRegister: () => void; registering: boolean; hasActiveRaffle: boolean;
}

export const EligibilityBanner: React.FC<EligibilityProps> = ({ isRegisteredInRaffle, onRegister, registering, hasActiveRaffle }) => {
  if (!hasActiveRaffle) return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
      <span className="text-2xl">&#x1F4C5;</span>
      <div><p className="font-semibold text-gray-700">No active raffle</p><p className="text-sm text-gray-500">The next raffle hasn&apos;t been scheduled yet.</p></div>
    </div>
  );
  if (isRegisteredInRaffle) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
      <span className="text-2xl">&#x2705;</span>
      <div><p className="font-semibold text-green-800">You&apos;re in the raffle!</p><p className="text-sm text-green-600">Sit tight — the admin will run the draw soon.</p></div>
    </div>
  );
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <span className="text-2xl">&#x1F3AB;</span>
        <div><p className="font-semibold text-indigo-800">Raffle is open!</p><p className="text-sm text-indigo-600">Register now to compete for a spot.</p></div>
      </div>
      <button onClick={onRegister} disabled={registering} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap">
        {registering ? 'Registering...' : 'Join Raffle'}
      </button>
    </div>
  );
};
