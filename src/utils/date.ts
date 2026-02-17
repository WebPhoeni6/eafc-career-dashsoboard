export function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

export function fmtMonth(ym: string): string {
  // ym = "2026-09"
  try {
    const d = new Date(ym + '-01T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  } catch {
    return ym;
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function currentWeek(): string {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
