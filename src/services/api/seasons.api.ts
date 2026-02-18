import type { NarrativeTag, SeasonChallenge, Trophy } from '../../types/season.types';
import { request } from './http';

export async function listTrophies(careerId: string): Promise<Trophy[]> {
  return request(`/api/careers/${careerId}/trophies`);
}

export async function createTrophy(careerId: string, payload: Omit<Trophy, 'id'>): Promise<Trophy> {
  return request(`/api/careers/${careerId}/trophies`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteTrophy(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/trophies/${id}`, {
    method: 'DELETE',
  });
}

export async function listChallenges(careerId: string): Promise<SeasonChallenge[]> {
  return request(`/api/careers/${careerId}/challenges`);
}

export async function createChallenge(careerId: string, payload: Omit<SeasonChallenge, 'id'>): Promise<SeasonChallenge> {
  return request(`/api/careers/${careerId}/challenges`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateChallenge(
  careerId: string,
  id: string,
  payload: Partial<Omit<SeasonChallenge, 'id'>>,
): Promise<SeasonChallenge> {
  return request(`/api/careers/${careerId}/challenges/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteChallenge(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/challenges/${id}`, {
    method: 'DELETE',
  });
}

export async function listNarrativeTags(careerId: string): Promise<NarrativeTag[]> {
  return request(`/api/careers/${careerId}/narrative-tags`);
}

export async function createNarrativeTag(
  careerId: string,
  payload: Omit<NarrativeTag, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<NarrativeTag> {
  return request(`/api/careers/${careerId}/narrative-tags`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteNarrativeTag(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/narrative-tags/${id}`, {
    method: 'DELETE',
  });
}
