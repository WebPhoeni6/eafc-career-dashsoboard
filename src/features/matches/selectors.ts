import type { Match } from '../../types/match.types';

export function getFilteredMatches(
  matches: Match[],
  filter: {
    search: string;
    competition: string;
    position: string;
    dateFrom: string;
    dateTo: string;
    pinnedOnly: boolean;
  },
): Match[] {
  const q = filter.search.trim().toLowerCase();
  return matches
    .filter((m) => {
      if (filter.pinnedOnly && !m.pinned) return false;
      if (filter.competition !== 'ALL' && m.competition !== filter.competition) return false;
      if (filter.position !== 'ALL' && m.posPlayed !== filter.position) return false;
      if (filter.dateFrom && m.matchDate && m.matchDate < filter.dateFrom) return false;
      if (filter.dateTo && m.matchDate && m.matchDate > filter.dateTo) return false;
      if (q) {
        const hay = [m.competition, m.opponent, m.posPlayed, m.notes, m.trust, m.stage].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const da = (a.matchDate || '') + (a.createdAt || '');
      const db = (b.matchDate || '') + (b.createdAt || '');
      return db.localeCompare(da);
    });
}
