import type { Match } from '../../types/match.types';
import { num } from '../../utils/format';
import { fmtDate } from '../../utils/date';

export interface ChartSeries {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

function sortedByDate(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const da = (a.matchDate || '') + (a.createdAt || '');
    const db = (b.matchDate || '') + (b.createdAt || '');
    return da.localeCompare(db);
  });
}

export function ovrOverTimeSeries(matches: Match[], baseOvr?: number): ChartSeries {
  const sorted = sortedByDate(matches).filter((m) => m.ovrAfter !== '' && m.ovrAfter !== null);
  const labels = sorted.map((m) => fmtDate(m.matchDate) || `#${sorted.indexOf(m) + 1}`);
  const data = sorted.map((m) => num(m.ovrAfter));
  if (baseOvr !== undefined && sorted.length === 0) {
    labels.push('Start');
    data.push(baseOvr);
  }
  return { labels, datasets: [{ label: 'OVR', data, color: '#7c5cff' }] };
}

export function goalsAssistsPerMatchSeries(matches: Match[]): ChartSeries {
  const sorted = sortedByDate(matches);
  const labels = sorted.map((m, i) =>
    m.matchDate ? fmtDate(m.matchDate) : `M${i + 1}`,
  );
  return {
    labels,
    datasets: [
      { label: 'Goals',   data: sorted.map((m) => num(m.goals)),   color: '#22c55e' },
      { label: 'Assists', data: sorted.map((m) => num(m.assists)), color: '#7c5cff' },
    ],
  };
}

export function ratingTrendSeries(matches: Match[]): ChartSeries {
  const sorted = sortedByDate(matches);
  const labels = sorted.map((m, i) =>
    m.matchDate ? fmtDate(m.matchDate) : `M${i + 1}`,
  );
  return {
    labels,
    datasets: [{ label: 'Rating', data: sorted.map((m) => num(m.matchRating)), color: '#f59e0b' }],
  };
}

export function gaPer90Series(matches: Match[]): ChartSeries {
  const sorted = sortedByDate(matches);
  // Rolling G/A per 90 up to each match
  let totalGA = 0;
  let totalMin = 0;
  const data: number[] = [];
  const labels: string[] = [];
  sorted.forEach((m, i) => {
    totalGA  += num(m.goals) + num(m.assists);
    totalMin += num(m.minutesPlayed, 90);
    data.push(totalMin > 0 ? (totalGA / totalMin) * 90 : 0);
    labels.push(m.matchDate ? fmtDate(m.matchDate) : `M${i + 1}`);
  });
  return { labels, datasets: [{ label: 'G/A per 90', data, color: '#22c55e' }] };
}

export function trustTrendSeries(matches: Match[]): ChartSeries {
  const trustMap: Record<string, number> = { Full: 4, High: 3, Medium: 2, Low: 1 };
  const sorted = sortedByDate(matches);
  const labels = sorted.map((m, i) => m.matchDate ? fmtDate(m.matchDate) : `M${i + 1}`);
  const data   = sorted.map((m) => trustMap[m.trust] ?? 2);
  return { labels, datasets: [{ label: 'Manager Trust', data, color: '#06b6d4' }] };
}
