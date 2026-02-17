import type { CareerProfile } from '../../../types/career.types';

export type CareerFormValues = Omit<CareerProfile, 'updatedAt'>;

export function validateCareerForm(v: Partial<CareerFormValues>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!v.playerName?.trim()) errors.playerName = 'Player name is required';
  if (!v.club?.trim()) errors.club = 'Club is required';
  if (!v.season?.trim()) errors.season = 'Season is required';
  if (!v.ovr || v.ovr < 40 || v.ovr > 99) errors.ovr = 'OVR must be 40–99';
  return errors;
}

export function defaultCareerValues(): CareerFormValues {
  return {
    playerName: 'Samuel Adebayo',
    nationality: 'Nigeria',
    archetype: 'Magician',
    primaryPos: 'RW',
    club: 'Ajax',
    season: '2026/27',
    ovr: 73,
    spAvailable: 2,
    height: "5'9\"",
    weight: '154 lbs',
    preferredFoot: 'Right',
    weakFootStars: 3,
    skillMoves: 3,
  };
}
