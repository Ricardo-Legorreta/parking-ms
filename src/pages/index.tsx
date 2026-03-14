import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';

export default function LandingPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();
  useEffect(() => { if (!isLoading && isAuthenticated) router.push('/dashboard'); }, [isAuthenticated, isLoading]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="text-7xl">P</div>
          <h1 className="text-4xl font-black text-gray-900">ParkingMS</h1>
          <p className="text-gray-500 text-lg">Fair parking allocation for your residential community</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {([['Fair Raffle','Weighted draws every 3 months'],['Blackout System','Winners sit out 3 rounds'],['Full History','Track every assignment']] as const).map(([title, desc]) => (
            <div key={title} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-700">{title}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => loginWithRedirect()} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
          {isLoading ? 'Loading...' : 'Sign in to continue'}
        </button>
      </div>
    </div>
  );
}
