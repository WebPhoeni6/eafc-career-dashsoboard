import { request } from './http';

export type CareerDirectorTone = 'Supportive' | 'Balanced' | 'Harsh';
export type CareerDirectorFocus = 'UCL' | 'Domestic' | 'Development' | 'Transfers' | 'Mentality';
export type CareerDirectorContextWindow = 'LAST_N' | 'WHOLE_CAREER';

export interface CareerDirectorReportOutput {
  headline: string;
  phase: 'breakout' | 'consolidation' | 'prime' | 'decline';
  phaseConfidence: number;
  reputationScore: { score: number; rationale: string };
  europeanImpactIndex: { score: number; rationale: string };
  pressureBoard: string[];
  storyline: { recentArc: string; seasonArc: string; longArc: string };
  ruthlessTruths: string[];
  strengths: string[];
  weaknesses: string[];
  nextMatchMandates: string[];
  developmentPlan: { allocation: string; reason: string }[];
  transferOutlook: {
    recommendation: 'stay' | 'leave' | 'conditional';
    rationale: string;
    thresholds: string[];
  };
  milestonesSuggested: {
    label: string;
    target: number;
    unit: string;
    rationale: string;
    deadline: string;
  }[];
  narrativeTagsSuggested: string[];
  agentNotesSuggested: string[];
  risks: string[];
  whatToTrackNext: string[];
  dataQualityFlags: string[];
  groundingDataPoints: string[];
}

export interface CareerDirectorReportRecord {
  id: string;
  createdAt: string;
  input: {
    tone: CareerDirectorTone;
    focus: CareerDirectorFocus;
    recentMatches: number | null;
    wholeCareer: boolean;
    contextWindow: CareerDirectorContextWindow;
  };
  output: CareerDirectorReportOutput;
}

export interface CareerDirectorChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tone: CareerDirectorTone;
  focus: CareerDirectorFocus;
  contextWindow: CareerDirectorContextWindow;
  recentMatches: number | null;
  followUpQuestions?: string[];
  dataQualityFlags?: string[];
  groundingDataPoints?: string[];
}

export interface CareerDirectorChatRecord {
  id: string;
  createdAt: string;
  tone: CareerDirectorTone;
  focus: CareerDirectorFocus;
  contextWindow: CareerDirectorContextWindow;
  recentMatches: number | null;
  user: CareerDirectorChatMessage;
  assistant: CareerDirectorChatMessage;
}

export interface CareerDirectorHistory {
  reports: CareerDirectorReportRecord[];
  chats: CareerDirectorChatMessage[];
}

export interface CareerDirectorRequestInput {
  recentMatches?: number;
  wholeCareer?: boolean;
  tone?: CareerDirectorTone;
  focus?: CareerDirectorFocus;
}

export async function generateCareerDirectorReport(
  careerId: string,
  payload: CareerDirectorRequestInput,
): Promise<CareerDirectorReportRecord> {
  return request(`/api/careers/${careerId}/ai/career-director/report`, {
    method: 'POST',
    body: payload,
  });
}

export async function chatCareerDirector(
  careerId: string,
  payload: CareerDirectorRequestInput & { message: string },
): Promise<CareerDirectorChatRecord> {
  return request(`/api/careers/${careerId}/ai/career-director/chat`, {
    method: 'POST',
    body: payload,
  });
}

export async function getCareerDirectorHistory(careerId: string): Promise<CareerDirectorHistory> {
  return request(`/api/careers/${careerId}/ai/career-director/history`);
}
