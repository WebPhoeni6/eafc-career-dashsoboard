import { request } from './http';

export interface ImportPayload {
  saveName: string;
  [key: string]: unknown;
}

export interface ImportResult {
  careerId: string;
  counts: Record<string, number>;
}

export async function importCareer(payload: ImportPayload): Promise<ImportResult> {
  return request('/api/sync/import', {
    method: 'POST',
    body: payload,
  });
}

export async function exportCareer(careerId: string): Promise<Record<string, unknown>> {
  return request(`/api/sync/export/${careerId}`);
}

export async function downloadCareerExport(careerId: string, playerName?: string): Promise<void> {
  const data = await exportCareer(careerId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fc26-career-${(playerName || 'player').replaceAll(' ', '_')}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
