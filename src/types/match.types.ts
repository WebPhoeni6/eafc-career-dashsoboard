import type { Position } from './career.types';

export type Competition = 'Friendly' | 'League' | 'Cup' | 'UCL' | 'UEL' | 'International' | 'Other';
export type Stage = 'N/A' | 'Group' | 'Round of 16' | 'Quarter-Final' | 'Semi-Final' | 'Final';
export type MatchResult = 'W' | 'D' | 'L';
export type ManagerTrust = 'Full' | 'High' | 'Medium' | 'Low';

export interface Match {
  id: string;
  competition: Competition;
  stage: Stage;
  matchDate: string;
  opponent: string;
  posPlayed: Position;
  scoreFor: number;
  scoreAgainst: number;
  minutesPlayed: number;
  matchRating: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xG: number;
  keyPasses: number;
  chancesCreated: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  passAccuracy: number; // percentage 0-100
  crossAccuracy: number; // percentage 0-100
  motm: boolean;
  clutchMoment: boolean; // late goal, winner, etc.
  objectivesCompleted: boolean;
  objectivesNotes: string;
  opponentStrength: 1 | 2 | 3 | 4 | 5;
  ovrAfter: number | '';
  spAfter: number | '';
  trust: ManagerTrust;
  notes: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AutoTag = 'Hat-trick' | '10.0 Rating' | 'Debut' | 'MOTM' | 'Clutch' | 'Brace' | 'Big Game' | 'First Goal' | 'First UCL Goal';

export interface MatchTemplate {
  id: string;
  name: string;
  defaults: Partial<Match>;
}
