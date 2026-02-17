import { KEYS } from './storage.keys';
import type { Match } from '../../types/match.types';
import type { CareerProfile } from '../../types/career.types';

/**
 * Migrate v1 localStorage data (fc26_career_tracker_v1) to v2 separate keys.
 * Runs once on first app load if legacy key exists.
 */
export function runMigrations(): void {
  const raw = localStorage.getItem(KEYS.LEGACY_V1);
  if (!raw) return;

  try {
    const v1 = JSON.parse(raw) as {
      career: Record<string, unknown> | null;
      matches: Record<string, unknown>[];
    };

    // Migrate career
    if (v1.career) {
      const c = v1.career;
      const career: CareerProfile = {
        playerName:     String(c.playerName ?? ''),
        nationality:    String(c.nationality ?? ''),
        archetype:      (c.archetype as CareerProfile['archetype']) ?? 'Other',
        primaryPos:     (c.primaryPos as CareerProfile['primaryPos']) ?? 'RW',
        club:           String(c.club ?? ''),
        season:         String(c.season ?? ''),
        ovr:            Number(c.ovr ?? 70),
        spAvailable:    Number(c.spAvailable ?? 0),
        height:         String(c.height ?? ''),
        weight:         String(c.weight ?? ''),
        preferredFoot:  'Right',
        weakFootStars:  3,
        skillMoves:     3,
        updatedAt:      String(c.updatedAt ?? new Date().toISOString()),
      };
      localStorage.setItem(KEYS.CAREER, JSON.stringify(career));
    }

    // Migrate matches
    if (Array.isArray(v1.matches)) {
      const matches: Match[] = v1.matches.map((m) => ({
        id:                   String(m.id ?? Math.random().toString(16)),
        competition:          (m.competition as Match['competition']) ?? 'Friendly',
        stage:                'N/A' as const,
        matchDate:            String(m.matchDate ?? ''),
        opponent:             String(m.opponent ?? ''),
        posPlayed:            (m.posPlayed as Match['posPlayed']) ?? 'RW',
        scoreFor:             Number(m.scoreFor ?? 0),
        scoreAgainst:         Number(m.scoreAgainst ?? 0),
        minutesPlayed:        90,
        matchRating:          Number(m.matchRating ?? 0),
        goals:                Number(m.goals ?? 0),
        assists:              Number(m.assists ?? 0),
        shots:                0,
        shotsOnTarget:        0,
        xG:                   0,
        keyPasses:            0,
        chancesCreated:       0,
        dribblesAttempted:    0,
        dribblesCompleted:    0,
        passAccuracy:         0,
        crossAccuracy:        0,
        motm:                 false,
        clutchMoment:         false,
        objectivesCompleted:  false,
        objectivesNotes:      '',
        opponentStrength:     3,
        ovrAfter:             m.ovrAfter !== undefined && m.ovrAfter !== '' ? Number(m.ovrAfter) : '',
        spAfter:              m.spAfter  !== undefined && m.spAfter  !== '' ? Number(m.spAfter)  : '',
        trust:                (m.trust as Match['trust']) ?? 'Full',
        notes:                String(m.notes ?? ''),
        pinned:               false,
        createdAt:            String(m.createdAt ?? new Date().toISOString()),
        updatedAt:            String(m.updatedAt ?? new Date().toISOString()),
      }));
      localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    }

    // Remove legacy key
    localStorage.removeItem(KEYS.LEGACY_V1);
    console.info('[FC26] Migrated v1 data to v2.');
  } catch (e) {
    console.error('[FC26] Migration failed', e);
  }
}
