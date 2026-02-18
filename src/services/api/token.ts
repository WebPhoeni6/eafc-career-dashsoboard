import { ACCESS_TOKEN_STORAGE_KEY } from './config';

let tokenCache: string | null = null;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getAccessToken(): string | null {
  if (tokenCache) return tokenCache;
  if (!canUseStorage()) return null;
  tokenCache = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  return tokenCache;
}

export function setAccessToken(token: string | null): void {
  tokenCache = token;
  if (!canUseStorage()) return;
  if (token) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}
