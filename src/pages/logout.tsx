import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function LogoutPage() {
  const { logout, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } });
      } else {
        window.location.href = '/';
      }
    }
  }, [isLoading, isAuthenticated, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Signing out...</p>
    </div>
  );
}
