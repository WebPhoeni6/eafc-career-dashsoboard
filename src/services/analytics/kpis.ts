import type { Match, Competition } from '../../types/match.types';
import type { Position } from '../../types/career.types';
import { num, per90, conversionRate } from '../../utils/format';

export interface KPIs {
  apps: number;
  goals: number;
  assists: number;
  ga: number;
  avgRating: number;
  bestRating: number;
  worstRating: number;
  gaPer90: number;
  goalsPer90: number;
  assistsPer90: number;
  totalMinutes: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  motmCount: number;
  clutchCount: number;
  hatTricks: number;
  perfectRatings: number; // 10.0s
  xGTotal: number;
  conversionRate: number;
  latestOvr: number | string;
}

export function computeKPIs(matches: Match[], careerOvr?: number): KPIs {
  const apps = matches.length;
  if (!apps) {
    return {
      apps: 0, goals: 0, assists: 0, ga: 0, avgRating: 0, bestRating: 0, worstRating: 0,
      gaPer90: 0, goalsPer90: 0, assistsPer90: 0, totalMinutes: 0,
      wins: 0, draws: 0, losses: 0, winRate: 0, motmCount: 0, clutchCount: 0,
      hatTricks: 0, perfectRatings: 0, xGTotal: 0, conversionRate: 0,
      latestOvr: careerOvr ?? '—',
    };
  }

  const goals   = matches.reduce((s, m) => s + num(m.goals), 0);
  const assists = matches.reduce((s, m) => s + num(m.assists), 0);
  const ga      = goals + assists;
  const totalMinutes = matches.reduce((s, m) => s + num(m.minutesPlayed, 90), 0);
  const ratings = matches.map((m) => num(m.matchRating));
  const avgRating = ratings.reduce((s, r) => s + r, 0) / apps;
  const bestRating  = Math.max(...ratings);
  const worstRating = Math.min(...ratings);
  const wins   = matches.filter((m) => num(m.scoreFor) > num(m.scoreAgainst)).length;
  const draws  = matches.filter((m) => num(m.scoreFor) === num(m.scoreAgainst)).length;
  const losses = apps - wins - draws;
  const shots  = matches.reduce((s, m) => s + num(m.shots), 0);
  const xGTotal = matches.reduce((s, m) => s + num(m.xG), 0);

  // Latest OVR from most recent match ovrAfter, else career ovr
  const sorted = [...matches].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  const last = sorted.at(-1);
  const latestOvr: number | string =
    last && last.ovrAfter !== '' && last.ovrAfter !== null && last.ovrAfter !== undefined
      ? last.ovrAfter
      : careerOvr ?? '—';

  return {
    apps,
    goals,
    assists,
    ga,
    avgRating,
    bestRating,
    worstRating,
    gaPer90: per90(ga, totalMinutes),
    goalsPer90: per90(goals, totalMinutes),
    assistsPer90: per90(assists, totalMinutes),
    totalMinutes,
    wins,
    draws,
    losses,
    winRate: (wins / apps) * 100,
    motmCount: matches.filter((m) => m.motm).length,
    clutchCount: matches.filter((m) => m.clutchMoment).length,
    hatTricks: matches.filter((m) => num(m.goals) >= 3).length,
    perfectRatings: matches.filter((m) => num(m.matchRating) >= 10).length,
    xGTotal,
    conversionRate: conversionRate(goals, shots),
    latestOvr,
  };
}

export interface FormData {
  last5AvgRating: number;
  gaStreak: number; // consecutive matches with G/A
  ratingTrend: number[]; // last 5 ratings
}

export function computeForm(matches: Match[]): FormData {
  const sorted = [...matches].sort((a, b) => {
    const da = (a.matchDate || '') + (a.createdAt || '');
    const db = (b.matchDate || '') + (b.createdAt || '');
    return db.localeCompare(da);
  });
  const last5 = sorted.slice(0, 5);
  const last5AvgRating = last5.length
    ? last5.reduce((s, m) => s + num(m.matchRating), 0) / last5.length
    : 0;
  const ratingTrend = last5.map((m) => num(m.matchRating)).reverse();

  let gaStreak = 0;
  for (const m of sorted) {
    if (num(m.goals) + num(m.assists) > 0) gaStreak++;
    else break;
  }

  return { last5AvgRating, gaStreak, ratingTrend };
}

export interface CompSplit {
  competition: string;
  apps: number;
  goals: number;
  assists: number;
  avgRating: number;
}

export function computeCompSplits(matches: Match[]): CompSplit[] {
  const map = new Map<Competition, Match[]>();
  for (const m of matches) {
    const arr = map.get(m.competition) ?? [];
    arr.push(m);
    map.set(m.competition, arr);
  }
  return Array.from(map.entries()).map(([comp, ms]) => ({
    competition: comp,
    apps: ms.length,
    goals: ms.reduce((s, m) => s + num(m.goals), 0),
    assists: ms.reduce((s, m) => s + num(m.assists), 0),
    avgRating: ms.reduce((s, m) => s + num(m.matchRating), 0) / ms.length,
  }));
}

export interface PosSplit {
  position: string;
  apps: number;
  goals: number;
  assists: number;
  avgRating: number;
}

export function computePosSplits(matches: Match[]): PosSplit[] {
  const map = new Map<Position, Match[]>();
  for (const m of matches) {
    const arr = map.get(m.posPlayed) ?? [];
    arr.push(m);
    map.set(m.posPlayed, arr);
  }
  return Array.from(map.entries()).map(([pos, ms]) => ({
    position: pos,
    apps: ms.length,
    goals: ms.reduce((s, m) => s + num(m.goals), 0),
    assists: ms.reduce((s, m) => s + num(m.assists), 0),
    avgRating: ms.reduce((s, m) => s + num(m.matchRating), 0) / ms.length,
  }));
}

export function isBigGamePerformer(matches: Match[]): boolean {
  // Scored in UCL KO stage or a Final
  return matches.some(
    (m) =>
      m.goals > 0 &&
      (m.competition === 'UCL' || m.competition === 'UEL') &&
      (m.stage === 'Round of 16' || m.stage === 'Quarter-Final' || m.stage === 'Semi-Final' || m.stage === 'Final'),
  );
}
