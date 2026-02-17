import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { CareerProfile, Achievement, InjuryLog, Suspension, PressNote, Theme } from '../types/career.types';
import { ACHIEVEMENT_DEFS } from '../utils/constants';
import { uid } from '../utils/id';
import { nowISO } from '../utils/date';

interface CareerState {
  career: CareerProfile | null;
  theme: Theme;
  achievements: Achievement[];
  injuries: InjuryLog[];
  suspensions: Suspension[];
  pressNotes: PressNote[];
  backupMatchThreshold: number;
  lastBackupMatchCount: number;

  setCareer: (c: CareerProfile) => void;
  clearCareer: () => void;
  setTheme: (t: Theme) => void;
  unlockAchievement: (key: string) => void;
  checkAchievements: (context: AchievementContext) => string[];
  addInjury: (i: Omit<InjuryLog, 'id'>) => void;
  updateInjury: (id: string, i: Partial<InjuryLog>) => void;
  deleteInjury: (id: string) => void;
  addSuspension: (s: Omit<Suspension, 'id'>) => void;
  deleteSuspension: (id: string) => void;
  addPressNote: (n: Omit<PressNote, 'id' | 'createdAt'>) => void;
  deletePressNote: (id: string) => void;
  setBackupThreshold: (n: number) => void;
  setLastBackupCount: (n: number) => void;
}

export interface AchievementContext {
  totalGoals: number;
  totalMatches: number;
  totalMotm: number;
  totalClutch: number;
  hatTricks: number;
  hasRating10: boolean;
  hasScoredUCLKO: boolean;
  gaStreak: number;
  maxDribblesInMatch: number;
}

export const useCareerStore = create<CareerState>()(
  persist(
    (set, get) => ({
      career: null,
      theme: 'dark',
      achievements: [],
      injuries: [],
      suspensions: [],
      pressNotes: [],
      backupMatchThreshold: 10,
      lastBackupMatchCount: 0,

      setCareer: (c) => set({ career: c }),
      clearCareer: () => set({ career: null }),
      setTheme: (t) => set({ theme: t }),

      unlockAchievement: (key) => {
        const existing = get().achievements.find((a) => a.key === key);
        if (existing?.unlockedAt) return;
        const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
        if (!def) return;
        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.key === key ? { ...a, unlockedAt: nowISO() } : a,
          ),
        }));
      },

      checkAchievements: (ctx) => {
        const state = get();
        const newlyUnlocked: string[] = [];

        const checks: { key: string; condition: boolean }[] = [
          { key: 'debut',          condition: ctx.totalMatches >= 1 },
          { key: 'first_goal',     condition: ctx.totalGoals >= 1 },
          { key: 'first_ucl_goal', condition: ctx.hasScoredUCLKO },
          { key: 'hat_trick',      condition: ctx.hatTricks >= 1 },
          { key: 'rating_10',      condition: ctx.hasRating10 },
          { key: 'streak_5_ga',    condition: ctx.gaStreak >= 5 },
          { key: 'motm_5',         condition: ctx.totalMotm >= 5 },
          { key: 'clutch_5',       condition: ctx.totalClutch >= 5 },
          { key: 'big_game',       condition: ctx.hasScoredUCLKO },
          { key: 'dribbles_10',    condition: ctx.maxDribblesInMatch >= 10 },
        ];

        const updatedAchievements = [...state.achievements];
        for (const check of checks) {
          if (!check.condition) continue;
          const existing = updatedAchievements.find((a) => a.key === check.key);
          if (existing?.unlockedAt) continue;
          const def = ACHIEVEMENT_DEFS.find((d) => d.key === check.key);
          if (!def) continue;
          if (existing) {
            existing.unlockedAt = nowISO();
          } else {
            updatedAchievements.push({
              id: uid(),
              key: def.key,
              label: def.label,
              description: def.description,
              icon: def.icon,
              unlockedAt: nowISO(),
            });
          }
          newlyUnlocked.push(check.key);
        }

        if (newlyUnlocked.length) set({ achievements: updatedAchievements });
        return newlyUnlocked;
      },

      addInjury: (i) => set((s) => ({ injuries: [...s.injuries, { ...i, id: uid() }] })),
      updateInjury: (id, i) => set((s) => ({ injuries: s.injuries.map((x) => x.id === id ? { ...x, ...i } : x) })),
      deleteInjury: (id) => set((s) => ({ injuries: s.injuries.filter((x) => x.id !== id) })),
      addSuspension: (s_) => set((s) => ({ suspensions: [...s.suspensions, { ...s_, id: uid() }] })),
      deleteSuspension: (id) => set((s) => ({ suspensions: s.suspensions.filter((x) => x.id !== id) })),
      addPressNote: (n) => set((s) => ({ pressNotes: [...s.pressNotes, { ...n, id: uid(), createdAt: nowISO() }] })),
      deletePressNote: (id) => set((s) => ({ pressNotes: s.pressNotes.filter((x) => x.id !== id) })),
      setBackupThreshold: (n) => set({ backupMatchThreshold: n }),
      setLastBackupCount: (n) => set({ lastBackupMatchCount: n }),
    }),
    { name: KEYS.CAREER },
  ),
);
