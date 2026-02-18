import type { ArchetypeStage, AttributeTarget, SkillSpend, TrainingLog } from '../../types/skill.types';
import { request } from './http';

export async function listSkillSpends(careerId: string): Promise<SkillSpend[]> {
  return request(`/api/careers/${careerId}/skill-spends`);
}

export async function createSkillSpend(
  careerId: string,
  payload: Omit<SkillSpend, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<SkillSpend> {
  return request(`/api/careers/${careerId}/skill-spends`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteSkillSpend(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/skill-spends/${id}`, {
    method: 'DELETE',
  });
}

export async function listAttributeTargets(careerId: string): Promise<AttributeTarget[]> {
  return request(`/api/careers/${careerId}/attribute-targets`);
}

export async function createAttributeTarget(careerId: string, payload: Omit<AttributeTarget, 'id'>): Promise<AttributeTarget> {
  return request(`/api/careers/${careerId}/attribute-targets`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAttributeTarget(
  careerId: string,
  id: string,
  payload: Partial<Omit<AttributeTarget, 'id'>>,
): Promise<AttributeTarget> {
  return request(`/api/careers/${careerId}/attribute-targets/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAttributeTarget(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/attribute-targets/${id}`, {
    method: 'DELETE',
  });
}

export async function getArchetypeStage(careerId: string): Promise<ArchetypeStage | null> {
  return request(`/api/careers/${careerId}/archetype-stage`);
}

export async function putArchetypeStage(careerId: string, payload: ArchetypeStage): Promise<ArchetypeStage> {
  return request(`/api/careers/${careerId}/archetype-stage`, {
    method: 'PUT',
    body: payload,
  });
}

export async function listTrainingLogs(careerId: string): Promise<TrainingLog[]> {
  return request(`/api/careers/${careerId}/training-logs`);
}

export async function createTrainingLog(
  careerId: string,
  payload: Omit<TrainingLog, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<TrainingLog> {
  return request(`/api/careers/${careerId}/training-logs`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteTrainingLog(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/training-logs/${id}`, {
    method: 'DELETE',
  });
}
