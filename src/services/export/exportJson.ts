import { APP_VERSION } from '../../utils/constants';

export function exportAllData(state: Record<string, unknown>, playerName?: string): void {
  const payload = { ...state, exportedAt: new Date().toISOString(), version: APP_VERSION };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fc26-career-${(playerName || 'player').replaceAll(' ', '_')}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
