import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { Match, Competition } from '../types/match.types';
import type { Position } from '../types/career.types';
import { uid } from '../utils/id';
import { nowISO } from '../utils/date';

interface MatchFilter {
  search: string;
  competition: Competition | 'ALL';
  position: Position | 'ALL';
  dateFrom: string;
  dateTo: string;
  pinnedOnly: boolean;
}

interface MatchesState {
  matches: Match[];
  filter: MatchFilter;

  addMatch: (m: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => Match;
  updateMatch: (id: string, m: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  togglePin: (id: string) => void;
  setFilter: (f: Partial<MatchFilter>) => void;
  resetFilter: () => void;
  importMatches: (matches: Match[]) => void;
}

const defaultFilter: MatchFilter = {
  search: '',
  competition: 'ALL',
  position: 'ALL',
  dateFrom: '',
  dateTo: '',
  pinnedOnly: false,
};

export const useMatchesStore = create<MatchesState>()(
  persist(
    (set) => ({
      matches: [],
      filter: defaultFilter,

      addMatch: (m) => {
        const match: Match = { ...m, id: uid(), createdAt: nowISO(), updatedAt: nowISO() };
        set((s) => ({ matches: [...s.matches, match] }));
        return match;
      },

      updateMatch: (id, m) =>
        set((s) => ({
          matches: s.matches.map((x) =>
            x.id === id ? { ...x, ...m, updatedAt: nowISO() } : x,
          ),
        })),

      deleteMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((x) => x.id !== id) })),

      togglePin: (id) =>
        set((s) => ({
          matches: s.matches.map((x) =>
            x.id === id ? { ...x, pinned: !x.pinned } : x,
          ),
        })),

      setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f } })),
      resetFilter: () => set({ filter: defaultFilter }),

      importMatches: (matches) => set({ matches }),
    }),
    { name: KEYS.MATCHES },
  ),
);
