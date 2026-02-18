import { create } from 'zustand';
import type { Trophy, SeasonChallenge, NarrativeTag } from '../types/season.types';
import * as seasonsApi from '../services/api/seasons.api';
import { useCareerStore } from './career.store';
import { nowISO } from '../utils/date';

interface SeasonsState {
  trophies: Trophy[];
  challenges: SeasonChallenge[];
  narrativeTags: NarrativeTag[];

  loadSeasons: (careerId?: string) => Promise<void>;
  addTrophy: (t: Omit<Trophy, 'id'>) => Promise<void>;
  deleteTrophy: (id: string) => Promise<void>;
  addChallenge: (c: Omit<SeasonChallenge, 'id'>) => Promise<void>;
  updateChallenge: (id: string, c: Partial<SeasonChallenge>) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  addNarrativeTag: (t: Omit<NarrativeTag, 'id' | 'createdAt'>) => Promise<void>;
  deleteNarrativeTag: (id: string) => Promise<void>;
  resetState: () => void;
}

function getCareerId(explicit?: string): string {
  const id = explicit || useCareerStore.getState().activeCareerId;
  if (!id) throw new Error('No active career selected');
  return id;
}

export const useSeasonsStore = create<SeasonsState>()((set) => ({
  trophies: [],
  challenges: [],
  narrativeTags: [],

  loadSeasons: async (careerId) => {
    const id = getCareerId(careerId);
    const [trophies, challenges, narrativeTags] = await Promise.all([
      seasonsApi.listTrophies(id),
      seasonsApi.listChallenges(id),
      seasonsApi.listNarrativeTags(id),
    ]);
    set({ trophies, challenges, narrativeTags });
  },

  addTrophy: async (trophy) => {
    const id = getCareerId();
    const created = await seasonsApi.createTrophy(id, trophy);
    set((state) => ({ trophies: [...state.trophies, created] }));
  },

  deleteTrophy: async (id) => {
    const careerId = getCareerId();
    await seasonsApi.deleteTrophy(careerId, id);
    set((state) => ({ trophies: state.trophies.filter((item) => item.id !== id) }));
  },

  addChallenge: async (challenge) => {
    const careerId = getCareerId();
    const created = await seasonsApi.createChallenge(careerId, challenge);
    set((state) => ({ challenges: [...state.challenges, created] }));
  },

  updateChallenge: async (id, challenge) => {
    const careerId = getCareerId();
    const updated = await seasonsApi.updateChallenge(careerId, id, challenge);
    set((state) => ({
      challenges: state.challenges.map((item) => (item.id === id ? updated : item)),
    }));
  },

  deleteChallenge: async (id) => {
    const careerId = getCareerId();
    await seasonsApi.deleteChallenge(careerId, id);
    set((state) => ({ challenges: state.challenges.filter((item) => item.id !== id) }));
  },

  addNarrativeTag: async (tag) => {
    const careerId = getCareerId();
    const created = await seasonsApi.createNarrativeTag(careerId, { ...tag, createdAt: nowISO() });
    set((state) => ({ narrativeTags: [...state.narrativeTags, created] }));
  },

  deleteNarrativeTag: async (id) => {
    const careerId = getCareerId();
    await seasonsApi.deleteNarrativeTag(careerId, id);
    set((state) => ({ narrativeTags: state.narrativeTags.filter((item) => item.id !== id) }));
  },

  resetState: () => set({ trophies: [], challenges: [], narrativeTags: [] }),
}));
