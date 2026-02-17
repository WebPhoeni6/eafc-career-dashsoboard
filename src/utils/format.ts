export function num(n: unknown, fallback = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function fmtRating(r: number): string {
  return r.toFixed(1);
}

export function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

export function fmtDecimal(n: number, places = 2): string {
  return n.toFixed(places);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function resultLabel(forScore: number, againstScore: number): { text: string; cls: string } {
  if (forScore > againstScore) return { text: `${forScore}–${againstScore} W`, cls: 'win' };
  if (forScore === againstScore) return { text: `${forScore}–${againstScore} D`, cls: 'draw' };
  return { text: `${forScore}–${againstScore} L`, cls: 'loss' };
}

export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function pluralize(n: number, word: string, plural = `${word}s`): string {
  return `${n} ${n === 1 ? word : plural}`;
}

export function per90(stat: number, minutes: number): number {
  if (!minutes) return 0;
  return (stat / minutes) * 90;
}

export function conversionRate(goals: number, shots: number): number {
  if (!shots) return 0;
  return (goals / shots) * 100;
}
