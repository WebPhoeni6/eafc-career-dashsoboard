export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
export type RoleType = 'Crucial' | 'Important' | 'Rotation' | 'Bench';

export interface TransferOffer {
  id: string;
  club: string;
  league: string;
  country: string;
  role: RoleType;
  wage: string; // e.g. "£45k/w"
  fee: string;  // e.g. "€12M"
  hasUCL: boolean;
  status: OfferStatus;
  receivedDate: string;
  decisionDate?: string;
  notes: string;
  score?: number; // computed 0-100
  createdAt: string;
}

export interface Contract {
  id: string;
  club: string;
  league: string;
  startSeason: string;
  endSeason: string;
  apps: number;
  goals: number;
  assists: number;
  avgRating: number;
  trophies: string[];
  notes: string;
}

export interface AgentNote {
  id: string;
  date: string;
  content: string;
  tag: 'Strategy' | 'Rumor' | 'Goal' | 'Warning' | 'Other';
  createdAt: string;
}
