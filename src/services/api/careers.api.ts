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

export interface CareerPerformanceInsights {
  summary: string;
  momentum: 'improving' | 'stable' | 'declining';
  confidence: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    nextMatch: string[];
    training: string[];
    season: string[];
    transfers: string[];
  };
  recommendationRationale?: {
    nextMatch?: string;
    training?: string;
    season?: string;
    transfers?: string;
  };
  milestoneSuggestions: {
    label: string;
    target: number;
    unit: string;
    why?: string;
  }[];
  keyMetricsToWatch: string[];
  recentFormSnapshot: string;
  recentMatchesConsidered: number;
  generatedAt: string;
}

export interface CareerPerformanceQuestionResponse {
  question: string;
  answer: string;
  why?: string;
  confidence: number | null;
  recentMatchesConsidered: number;
  generatedAt: string;
}

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

export async function getCareerPerformanceInsights(id: string, recentMatches = 8): Promise<CareerPerformanceInsights> {
  const query = new URLSearchParams({ recentMatches: String(recentMatches) });
  return request(`/api/careers/${id}/performance-insights?${query.toString()}`);
}

export async function askCareerPerformanceQuestion(
  id: string,
  question: string,
  recentMatches = 8,
): Promise<CareerPerformanceQuestionResponse> {
  return request(`/api/careers/${id}/performance-insights/ask`, {
    method: 'POST',
    body: {
      question,
      recentMatches,
    },
  });
}
