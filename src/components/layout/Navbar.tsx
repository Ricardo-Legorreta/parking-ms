import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth0 } from '@auth0/auth0-react';

const navLinks   = [{ href: '/dashboard', label: 'Dashboard' }, { href: '/history', label: 'My History' }, { href: '/raffle', label: 'Raffle', disabled: true }];
const adminLinks = [{ href: '/admin', label: 'Overview' }, { href: '/admin/spots', label: 'Spots' }, { href: '/admin/residents', label: 'Residents', disabled: true }, { href: '/admin/raffle', label: 'Raffle Mgmt', disabled: true }];

export const Navbar: React.FC<{ role: 'resident' | 'admin' }> = ({ role }) => {
  const { logout, user } = useAuth0();
  const { pathname }     = useRouter();
  const links = role === 'admin' ? adminLinks : navLinks;
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
          ParkingMS
          {role === 'admin' && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>}
        </Link>
        <div className="hidden sm:flex items-center gap-1">
          {links.map(l => (
            l.disabled ? (
              <span key={l.href} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed">{l.label}</span>
            ) : (
              <Link key={l.href} href={l.href} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith(l.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>{l.label}</Link>
            )
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user?.picture && <img src={user.picture} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-indigo-100" />}
          <span className="hidden sm:block text-sm text-gray-600">{user?.name}</span>
          <button onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })} className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Sign out</button>
        </div>
      </div>
    </nav>
  );
};
