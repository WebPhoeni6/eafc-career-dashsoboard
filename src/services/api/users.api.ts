import { request } from './http';
import type { AuthUser } from './auth.api';

export async function getMe(): Promise<AuthUser> {
  return request('/api/users/me');
}

export async function updateMe(payload: Partial<Pick<AuthUser, 'email' | 'username' | 'avatarUrl'>>): Promise<AuthUser> {
  return request('/api/users/me', {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteMe(): Promise<void> {
  await request('/api/users/me', {
    method: 'DELETE',
  });
}
