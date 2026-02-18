import type { Match } from '../../types/match.types';
import { request } from './http';
import { API_BASE_URL } from './config';

export interface ListMatchesQuery {
  competition?: Match['competition'];
  posPlayed?: Match['posPlayed'];
  dateFrom?: string;
  dateTo?: string;
  pinnedOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MatchAnalysisResult {
  suggested: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>;
  confidence: number | null;
  missingFields: string[];
  warnings: string[];
  summary: string;
}

function toQueryString(query?: ListMatchesQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.competition) params.set('competition', query.competition);
  if (query.posPlayed) params.set('posPlayed', query.posPlayed);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  if (typeof query.pinnedOnly === 'boolean') params.set('pinnedOnly', String(query.pinnedOnly));
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

export async function listMatches(careerId: string, query?: ListMatchesQuery): Promise<Match[]> {
  return request(`/api/careers/${careerId}/matches${toQueryString(query)}`);
}

export async function createMatch(careerId: string, payload: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
  return request(`/api/careers/${careerId}/matches`, {
    method: 'POST',
    body: payload,
  });
}

export async function getMatch(careerId: string, id: string): Promise<Match> {
  return request(`/api/careers/${careerId}/matches/${id}`);
}

export async function updateMatch(
  careerId: string,
  id: string,
  payload: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Match> {
  return request(`/api/careers/${careerId}/matches/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteMatch(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/matches/${id}`, {
    method: 'DELETE',
  });
}

export async function togglePin(careerId: string, id: string): Promise<Match> {
  return request(`/api/careers/${careerId}/matches/${id}/pin`, {
    method: 'POST',
  });
}

export async function uploadPerformanceImage(careerId: string, id: string, image: File): Promise<Match> {
  const formData = new FormData();
  formData.append('image', image);

  return request(`/api/careers/${careerId}/matches/${id}/performance-image`, {
    method: 'POST',
    body: formData,
  });
}

export async function deletePerformanceImage(careerId: string, id: string): Promise<Match> {
  return request(`/api/careers/${careerId}/matches/${id}/performance-image`, {
    method: 'DELETE',
  });
}

export async function analyzePerformanceImages(careerId: string, images: File[]): Promise<MatchAnalysisResult> {
  const formData = new FormData();
  images.forEach((image) => formData.append('images', image));
  return request(`/api/careers/${careerId}/matches/analyze-performance`, {
    method: 'POST',
    body: formData,
  });
}

export function resolveMatchImageUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${API_BASE_URL}${pathOrUrl}`;
  return `${API_BASE_URL}/${pathOrUrl}`;
}
