export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080';

export const ACCESS_TOKEN_STORAGE_KEY = 'fc26_access_token';
