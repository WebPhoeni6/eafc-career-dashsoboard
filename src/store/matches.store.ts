import { create } from 'zustand';
import type { Match, Competition } from '../types/match.types';
import type { Position } from '../types/career.types';
import * as matchesApi from '../services/api/matches.api';
import { useCareerStore } from './career.store';

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

  loadMatches: (careerId?: string) => Promise<void>;
  addMatch: (m: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Match>;
  updateMatch: (id: string, m: Partial<Omit<Match, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  uploadPerformanceImage: (id: string, file: File) => Promise<void>;
  deletePerformanceImage: (id: string) => Promise<void>;
  analyzePerformanceImages: (files: File[]) => Promise<matchesApi.MatchAnalysisResult>;
  setFilter: (f: Partial<MatchFilter>) => void;
  resetFilter: () => void;
  importMatches: (matches: Match[]) => void;
  resetState: () => void;
}

const defaultFilter: MatchFilter = {
  search: '',
  competition: 'ALL',
  position: 'ALL',
  dateFrom: '',
  dateTo: '',
  pinnedOnly: false,
};

function getCareerId(explicit?: string): string {
  const id = explicit || useCareerStore.getState().activeCareerId;
  if (!id) throw new Error('No active career selected');
  return id;
}

export const useMatchesStore = create<MatchesState>()((set) => ({
  matches: [],
  filter: defaultFilter,

  loadMatches: async (careerId) => {
    const id = getCareerId(careerId);
    const items = await matchesApi.listMatches(id, { page: 1, limit: 1000 });
    set({ matches: items });
  },

  addMatch: async (m) => {
    const careerId = getCareerId();
    const match = await matchesApi.createMatch(careerId, m);
    set((state) => ({ matches: [...state.matches, match] }));
    return match;
  },

  updateMatch: async (id, m) => {
    const careerId = getCareerId();
    const updated = await matchesApi.updateMatch(careerId, id, m);
    set((state) => ({
      matches: state.matches.map((item) => (item.id === id ? updated : item)),
    }));
  },

  deleteMatch: async (id) => {
    const careerId = getCareerId();
    await matchesApi.deleteMatch(careerId, id);
    set((state) => ({ matches: state.matches.filter((item) => item.id !== id) }));
  },

  togglePin: async (id) => {
    const careerId = getCareerId();
    const updated = await matchesApi.togglePin(careerId, id);
    set((state) => ({
      matches: state.matches.map((item) => (item.id === id ? updated : item)),
    }));
  },

  uploadPerformanceImage: async (id, file) => {
    const careerId = getCareerId();
    const updated = await matchesApi.uploadPerformanceImage(careerId, id, file);
    set((state) => ({
      matches: state.matches.map((item) => (item.id === id ? updated : item)),
    }));
  },

  deletePerformanceImage: async (id) => {
    const careerId = getCareerId();
    const updated = await matchesApi.deletePerformanceImage(careerId, id);
    set((state) => ({
      matches: state.matches.map((item) => (item.id === id ? updated : item)),
    }));
  },

  analyzePerformanceImages: async (files) => {
    const careerId = getCareerId();
    return matchesApi.analyzePerformanceImages(careerId, files);
  },

  setFilter: (f) => set((state) => ({ filter: { ...state.filter, ...f } })),
  resetFilter: () => set({ filter: defaultFilter }),
  importMatches: (matches) => set({ matches }),
  resetState: () => set({ matches: [], filter: defaultFilter }),
}));
