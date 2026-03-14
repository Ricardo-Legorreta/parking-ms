import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Auth0Provider } from '@auth0/auth0-react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{ redirect_uri: typeof window !== 'undefined' ? window.location.origin : '', audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE, scope: 'openid profile email' }}
      onRedirectCallback={state => router.push(state?.returnTo ?? '/dashboard')}
    >
      <Component {...pageProps} />
    </Auth0Provider>
  );
}
