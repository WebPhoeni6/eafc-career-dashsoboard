import type { Achievement, InjuryLog, PressNote, Suspension } from '../../types/career.types';
import { request } from './http';

export async function listInjuries(careerId: string): Promise<InjuryLog[]> {
  return request(`/api/careers/${careerId}/injuries`);
}

export async function createInjury(careerId: string, payload: Omit<InjuryLog, 'id'>): Promise<InjuryLog> {
  return request(`/api/careers/${careerId}/injuries`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateInjury(careerId: string, id: string, payload: Partial<Omit<InjuryLog, 'id'>>): Promise<InjuryLog> {
  return request(`/api/careers/${careerId}/injuries/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteInjury(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/injuries/${id}`, {
    method: 'DELETE',
  });
}

export async function listSuspensions(careerId: string): Promise<Suspension[]> {
  return request(`/api/careers/${careerId}/suspensions`);
}

export async function createSuspension(
  careerId: string,
  payload: Omit<Suspension, 'id'> & { createdAt?: string },
): Promise<Suspension> {
  return request(`/api/careers/${careerId}/suspensions`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteSuspension(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/suspensions/${id}`, {
    method: 'DELETE',
  });
}

export async function listPressNotes(careerId: string): Promise<PressNote[]> {
  return request(`/api/careers/${careerId}/press-notes`);
}

export async function createPressNote(
  careerId: string,
  payload: Omit<PressNote, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<PressNote> {
  return request(`/api/careers/${careerId}/press-notes`, {
    method: 'POST',
    body: payload,
  });
}

export async function deletePressNote(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/press-notes/${id}`, {
    method: 'DELETE',
  });
}

export async function listAchievements(careerId: string): Promise<Achievement[]> {
  return request(`/api/careers/${careerId}/achievements`);
}

export async function unlockAchievement(
  careerId: string,
  payload: Pick<Achievement, 'key' | 'label' | 'description' | 'icon' | 'unlockedAt'>,
): Promise<Achievement> {
  return request(`/api/careers/${careerId}/achievements`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAchievement(
  careerId: string,
  id: string,
  payload: Partial<Pick<Achievement, 'label' | 'description' | 'icon' | 'unlockedAt'>>,
): Promise<Achievement> {
  return request(`/api/careers/${careerId}/achievements/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}
