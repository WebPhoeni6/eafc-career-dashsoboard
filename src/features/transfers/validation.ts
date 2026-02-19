import type { OfferStatus, RoleType } from '../../types/transfer.types';

export const OFFER_STATUS_OPTIONS: OfferStatus[] = ['Pending', 'Accepted', 'Rejected', 'Expired'];
export const OFFER_ROLE_OPTIONS: RoleType[] = ['Crucial', 'Important', 'Rotation', 'Bench'];

const seasonPattern = /^\d{4}\/\d{2}$/;

export function validateOfferInput(input: {
  club: string;
  league: string;
  country: string;
  role: RoleType;
  wage: string;
  fee: string;
  hasUCL: boolean;
  status: OfferStatus;
  receivedDate: string;
}): string | null {
  if (!input.club.trim()) return 'Club is required';
  if (!input.league.trim()) return 'League is required';
  if (!input.country.trim()) return 'Country is required';
  if (!OFFER_ROLE_OPTIONS.includes(input.role)) return 'Role is invalid';
  if (!input.wage.trim()) return 'Requested weekly wage is required';
  if (!input.fee.trim()) return 'Current wage is required';
  if (!OFFER_STATUS_OPTIONS.includes(input.status)) return 'Status is invalid';
  if (!input.receivedDate.trim()) return 'Received date is required';
  return null;
}

export function validateContractStartInput(input: {
  club: string;
  league: string;
  startSeason: string;
}): string | null {
  if (!input.club.trim()) return 'Club is required';
  if (!input.league.trim()) return 'League is required';
  if (!input.startSeason.trim()) return 'Start season is required';
  if (!seasonPattern.test(input.startSeason.trim())) return 'Start season must look like 2025/26';
  return null;
}

export function validateContractCloseInput(input: {
  endSeason: string;
  apps: number;
  goals: number;
  assists: number;
  avgRating: number;
}): string | null {
  if (!input.endSeason.trim()) return 'End season is required';
  if (!seasonPattern.test(input.endSeason.trim())) return 'End season must look like 2027/28';
  if (input.apps < 0 || input.goals < 0 || input.assists < 0) return 'Stats cannot be negative';
  if (input.avgRating < 0 || input.avgRating > 10) return 'Avg rating must be between 0 and 10';
  return null;
}
