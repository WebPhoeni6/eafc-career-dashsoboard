export interface Trophy {
  id: string;
  name: string;
  competition: string;
  season: string;
  date: string;
}

export interface Milestone {
  id: string;
  key: string;
  label: string;
  target: number;
  unit: string;
  reached: boolean;
  reachedAt?: string;
}

export interface SeasonChallenge {
  id: string;
  season: string;
  label: string;
  target: number;
  current: number;
  unit: string;
  completed: boolean;
}

export interface NarrativeTag {
  id: string;
  season: string;
  tag: string; // e.g. "Breakout season", "Injury setback", "Golden boot chase"
  createdAt: string;
}
