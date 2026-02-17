import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { Trophy, SeasonChallenge, NarrativeTag } from '../types/season.types';
import { uid } from '../utils/id';
import { nowISO } from '../utils/date';

interface SeasonsState {
  trophies: Trophy[];
  challenges: SeasonChallenge[];
  narrativeTags: NarrativeTag[];

  addTrophy: (t: Omit<Trophy, 'id'>) => void;
  deleteTrophy: (id: string) => void;
  addChallenge: (c: Omit<SeasonChallenge, 'id'>) => void;
  updateChallenge: (id: string, c: Partial<SeasonChallenge>) => void;
  deleteChallenge: (id: string) => void;
  addNarrativeTag: (t: Omit<NarrativeTag, 'id' | 'createdAt'>) => void;
  deleteNarrativeTag: (id: string) => void;
}

export const useSeasonsStore = create<SeasonsState>()(
  persist(
    (set) => ({
      trophies: [],
      challenges: [],
      narrativeTags: [],

      addTrophy: (t) => set((s) => ({ trophies: [...s.trophies, { ...t, id: uid() }] })),
      deleteTrophy: (id) => set((s) => ({ trophies: s.trophies.filter((x) => x.id !== id) })),
      addChallenge: (c) => set((s) => ({ challenges: [...s.challenges, { ...c, id: uid() }] })),
      updateChallenge: (id, c) => set((s) => ({ challenges: s.challenges.map((x) => x.id === id ? { ...x, ...c } : x) })),
      deleteChallenge: (id) => set((s) => ({ challenges: s.challenges.filter((x) => x.id !== id) })),
      addNarrativeTag: (t) => set((s) => ({ narrativeTags: [...s.narrativeTags, { ...t, id: uid(), createdAt: nowISO() }] })),
      deleteNarrativeTag: (id) => set((s) => ({ narrativeTags: s.narrativeTags.filter((x) => x.id !== id) })),
    }),
    { name: KEYS.SEASONS },
  ),
);
