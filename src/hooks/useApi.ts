import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import type { ApiResponse } from '@/types';

const BASE = '/api';
type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();

  const request = useCallback(async <T>(path: string, method: HttpMethod = 'GET', body?: unknown): Promise<ApiResponse<T>> => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE },
    });
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: ApiResponse<T>;
    try { data = JSON.parse(text); }
    catch { throw new Error(`Server error (${res.status})`); }
    if (!res.ok) throw new Error(data.error ?? 'Request failed');
    return data;
  }, [getAccessTokenSilently]);

  return {
    get  : <T>(path: string)                 => request<T>(path, 'GET'),
    post : <T>(path: string, body?: unknown) => request<T>(path, 'POST',   body),
    patch: <T>(path: string, body?: unknown) => request<T>(path, 'PATCH',  body),
    del  : <T>(path: string)                 => request<T>(path, 'DELETE'),
  };
}
