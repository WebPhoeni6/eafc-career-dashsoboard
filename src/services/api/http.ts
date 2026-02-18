import { API_BASE_URL } from './config';
import { clearAccessToken, getAccessToken, setAccessToken } from './token';
import { ApiError, type ApiEnvelope, type ApiFailure, type ApiSuccess } from './types';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  retryOn401?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function isFailure(payload: unknown): payload is ApiFailure {
  return !!payload && typeof payload === 'object' && (payload as { success?: boolean }).success === false;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function parseJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return (await res.json()) as T;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const payload = await parseJson<ApiEnvelope<{ accessToken: string }>>(res);
    if (!payload || isFailure(payload) || !payload.data?.accessToken) {
      clearAccessToken();
      return null;
    }

    setAccessToken(payload.data.accessToken);
    return payload.data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function runRequest<T>(path: string, options: RequestOptions = {}, retry = true): Promise<ApiSuccess<T>> {
  const { body, headers, skipAuth = false, retryOn401 = true, ...rest } = options;
  const token = getAccessToken();

  const nextHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers && typeof headers === 'object' ? (headers as Record<string, string>) : {}),
  };

  let payloadBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) payloadBody = body;
    else {
      nextHeaders['Content-Type'] = 'application/json';
      payloadBody = JSON.stringify(body);
    }
  }

  if (!skipAuth && token) nextHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path), {
    ...rest,
    credentials: 'include',
    headers: nextHeaders,
    body: payloadBody,
  });

  if (res.status === 204) {
    return { success: true, message: 'No content', data: undefined as T };
  }

  const responsePayload = await parseJson<ApiEnvelope<T>>(res);

  if (res.status === 401 && !skipAuth && retryOn401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return runRequest<T>(path, options, false);
  }

  if (!res.ok || !responsePayload || isFailure(responsePayload)) {
    if (isFailure(responsePayload)) {
      throw new ApiError(
        responsePayload.error.message,
        res.status,
        responsePayload.error.code,
        responsePayload.error.details,
      );
    }
    throw new ApiError(`Request failed with status ${res.status}`, res.status);
  }

  return responsePayload;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await runRequest<T>(path, options);
  return payload.data;
}

export async function requestEnvelope<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  return runRequest<T>(path, options);
}

export async function tryRefreshSession(): Promise<boolean> {
  const token = await refreshAccessToken();
  return !!token;
}
