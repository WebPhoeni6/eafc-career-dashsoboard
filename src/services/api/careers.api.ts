import type { CareerProfile } from '../../types/career.types';
import { request } from './http';

export interface CareerRecord extends CareerProfile {
  id: string;
  saveName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profileUpdatedAt?: string | null;
}

export type CreateCareerInput = CareerProfile & {
  saveName: string;
  isActive?: boolean;
};

export type UpdateCareerInput = Partial<CreateCareerInput>;

export async function listCareers(): Promise<CareerRecord[]> {
  return request('/api/careers');
}

export async function createCareer(payload: CreateCareerInput): Promise<CareerRecord> {
  return request('/api/careers', {
    method: 'POST',
    body: payload,
  });
}

export async function getCareer(id: string): Promise<CareerRecord> {
  return request(`/api/careers/${id}`);
}

export async function updateCareer(id: string, payload: UpdateCareerInput): Promise<CareerRecord> {
  return request(`/api/careers/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteCareer(id: string): Promise<void> {
  await request(`/api/careers/${id}`, {
    method: 'DELETE',
  });
}

export async function activateCareer(id: string): Promise<void> {
  await request(`/api/careers/${id}/activate`, {
    method: 'POST',
  });
}
