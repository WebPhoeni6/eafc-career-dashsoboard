export type Archetype = 'Magician' | 'Spark' | 'Engine' | 'Anchor' | 'Guardian' | 'Other';
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'CF' | 'ST';

export interface CareerProfile {
  playerName: string;
  nationality: string;
  archetype: Archetype;
  primaryPos: Position;
  secondaryPos?: Position;
  club: string;
  season: string;
  ovr: number;
  spAvailable: number;
  height: string;
  weight: string;
  preferredFoot: 'Left' | 'Right';
  weakFootStars: 1 | 2 | 3 | 4 | 5;
  skillMoves: 1 | 2 | 3 | 4 | 5;
  badgeUrl?: string;
  flagUrl?: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface InjuryLog {
  id: string;
  type: string;
  startDate: string;
  returnDate?: string;
  matchesMissed: number;
  notes: string;
}

export interface Suspension {
  id: string;
  type: 'Yellow' | 'Red' | 'Accumulated';
  matchesMissed: number;
  competition: string;
  date: string;
  notes: string;
}

export interface PressNote {
  id: string;
  month: string; // e.g. "2026-09"
  content: string;
  tag?: 'Praise' | 'Rumor' | 'Transfer' | 'Objective' | 'Other';
  createdAt: string;
}

export type Theme = 'dark' | 'light';
