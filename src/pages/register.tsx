import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useApi } from '@/hooks/useApi';
import { Alert } from '@/components/ui/Alert';

interface FormData { name: string; unit: string; building: string; vehiclePlate: string; vehicleModel: string; vehicleColor: string }
const initialForm: FormData = { name: '', unit: '', building: '', vehiclePlate: '', vehicleModel: '', vehicleColor: '' };

function validateForm(f: FormData): string | null {
  if (!f.name.trim())         return 'Full name is required';
  if (!f.unit.trim())         return 'Unit number is required';
  if (!f.building.trim())     return 'Building is required';
  if (!f.vehiclePlate.trim()) return 'License plate is required';
  if (!/^[A-Z0-9-]{4,10}$/i.test(f.vehiclePlate)) return 'Plate must be 4-10 alphanumeric characters';
  if (!f.vehicleModel.trim()) return 'Vehicle model is required';
  if (!f.vehicleColor.trim()) return 'Vehicle color is required';
  return null;
}

export default function RegisterPage() {
  const { user }    = useAuth0();
  const api         = useApi();
  const router      = useRouter();
  const [form, setForm] = useState<FormData>({ ...initialForm, name: user?.name ?? '' });
  const [err,  setErr]  = useState<string | null>(null);
  const [ok,   setOk]   = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = validateForm(form);
    if (ve) { setErr(ve); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/residents', { name: form.name, unit: form.unit, building: form.building, vehicle: { plate: form.vehiclePlate.toUpperCase(), model: form.vehicleModel, color: form.vehicleColor } });
      setOk(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Registration failed'); }
    finally { setBusy(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div><h1 className="text-2xl font-black text-gray-900">Complete your profile</h1><p className="text-gray-400 text-sm mt-1">One-time setup to join the parking system</p></div>
        {ok  && <Alert variant="success" message="Registered! Redirecting to dashboard..." />}
        {err && <Alert variant="error"   message={err} onClose={() => setErr(null)} />}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={form.name} onChange={set('name')} placeholder="Jane Doe" className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label><input type="text" value={form.unit} onChange={set('unit')} placeholder="4B" className={inputCls} /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select value={form.building} onChange={set('building')} className={inputCls}>
              <option value="">Select building...</option>
              {['A','B','C','D'].map(b => <option key={b} value={b}>Building {b}</option>)}
            </select>
          </div>
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle</p>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label><input type="text" value={form.vehiclePlate} onChange={set('vehiclePlate')} placeholder="ABC-1234" className={`${inputCls} uppercase`} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Model</label><input type="text" value={form.vehicleModel} onChange={set('vehicleModel')} placeholder="Toyota Corolla" className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label><input type="text" value={form.vehicleColor} onChange={set('vehicleColor')} placeholder="Silver" className={inputCls} /></div>
          <button type="submit" disabled={busy || ok} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors mt-2">
            {busy ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
