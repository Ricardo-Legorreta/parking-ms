import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useApi } from '@/hooks/useApi';
import { useMe } from '@/hooks/useMe';
import { Navbar } from '@/components/layout/Navbar';
import { SpotCard } from '@/components/resident/SpotCard';
import { EligibilityBanner } from '@/components/resident/EligibilityBanner';
import { Alert } from '@/components/ui/Alert';


export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const router = useRouter();
  const { data, loading, error, refetch } = useMe();
  const api    = useApi();
  const [registering, setRegistering] = useState(false);
  const [raffleMsg,   setRaffleMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/'); }, [authLoading, isAuthenticated]);  

  const joinRaffle = async () => {
    setRegistering(true); setRaffleMsg(null);
    try {
      const r = await api.post('/raffle/register');
      setRaffleMsg({ type: 'success', text: r.message ?? 'Registered for raffle!' });
      refetch();
    } catch (e: unknown) { setRaffleMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to register' }); }
    finally { setRegistering(false); }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error || !data) {
    const isUnregistered = error?.toLowerCase().includes('not found');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-2xl">&#x1F697;</p>
          <p className="text-gray-700 font-semibold">{isUnregistered ? "You're not registered yet" : error}</p>
          {isUnregistered && <button onClick={() => router.push('/register')} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">Complete Registration</button>}
        </div>
      </div>
    );
  }

  const { resident, currentSpot, raffle, eligibility } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={resident.role} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hi, {resident.name.split(' ')[0]}</h1>
          <p className="text-gray-400 text-sm mt-1">Unit {resident.unit} &middot; Building {resident.building} &middot; {resident.totalWins} win{resident.totalWins !== 1 ? 's' : ''} all time</p>
        </div>
        {raffleMsg && <Alert variant={raffleMsg.type} message={raffleMsg.text} onClose={() => setRaffleMsg(null)} />}
        {resident.role !== 'admin' && (
          <section><h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Spot</h2><SpotCard spot={currentSpot} /></section>
        )}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Raffle Status</h2>
          <EligibilityBanner isRegisteredInRaffle={eligibility.isRegisteredInRaffle} hasActiveRaffle={!!raffle} onRegister={joinRaffle} registering={registering} />
        </section>
        {raffle && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([['Round', `#${raffle.roundNumber}`], ['Status', raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)], ['Opens', new Date(raffle.startDate).toLocaleDateString()], ['Closes', new Date(raffle.endDate).toLocaleDateString()]] as const).map(([label, value]) => (
              <div key={label}><p className="text-xs text-gray-400 font-medium">{label}</p><p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p></div>
            ))}
          </section>
        )}
        {resident.vehicle && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Vehicle</h2>
            <div className="grid grid-cols-3 gap-4">
              {([['Plate', resident.vehicle.plate], ['Model', resident.vehicle.model], ['Color', resident.vehicle.color]] as const).map(([label, value]) => (
                <div key={label}><p className="text-xs text-gray-400 font-medium">{label}</p><p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p></div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
