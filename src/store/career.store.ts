import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { CareerProfile, Achievement, InjuryLog, Suspension, PressNote, Theme } from '../types/career.types';
import type { CareerRecord } from '../services/api/careers.api';
import { ACHIEVEMENT_DEFS } from '../utils/constants';
import { nowISO } from '../utils/date';
import * as careersApi from '../services/api/careers.api';
import * as profileApi from '../services/api/profile.api';

interface CareerSlot {
  id: string;
  saveName: string;
  playerName: string;
  club: string;
  season: string;
  isActive: boolean;
  updatedAt: string;
}

interface CareerState {
  career: CareerProfile | null;
  careers: CareerSlot[];
  activeCareerId: string | null;
  theme: Theme;
  achievements: Achievement[];
  injuries: InjuryLog[];
  suspensions: Suspension[];
  pressNotes: PressNote[];
  backupMatchThreshold: number;
  lastBackupMatchCount: number;

  setCareer: (c: CareerProfile) => Promise<void>;
  clearCareer: () => Promise<void>;
  loadCareers: () => Promise<void>;
  activateCareer: (id: string) => Promise<void>;
  loadProfileState: (careerId?: string) => Promise<void>;
  resetProfileState: () => void;
  resetState: () => void;

  setTheme: (t: Theme) => void;
  unlockAchievement: (key: string) => Promise<void>;
  checkAchievements: (context: AchievementContext) => Promise<string[]>;
  addInjury: (i: Omit<InjuryLog, 'id'>) => Promise<void>;
  updateInjury: (id: string, i: Partial<InjuryLog>) => Promise<void>;
  deleteInjury: (id: string) => Promise<void>;
  addSuspension: (s: Omit<Suspension, 'id'>) => Promise<void>;
  deleteSuspension: (id: string) => Promise<void>;
  addPressNote: (n: Omit<PressNote, 'id' | 'createdAt'>) => Promise<void>;
  deletePressNote: (id: string) => Promise<void>;
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

function toCareerProfile(record: CareerRecord): CareerProfile {
  return {
    playerName: record.playerName,
    nationality: record.nationality,
    archetype: record.archetype as CareerProfile['archetype'],
    primaryPos: record.primaryPos,
    secondaryPos: record.secondaryPos || undefined,
    club: record.club,
    season: record.season,
    ovr: record.ovr,
    spAvailable: record.spAvailable,
    height: record.height,
    weight: record.weight,
    preferredFoot: record.preferredFoot,
    weakFootStars: record.weakFootStars as CareerProfile['weakFootStars'],
    skillMoves: record.skillMoves as CareerProfile['skillMoves'],
    badgeUrl: record.badgeUrl || undefined,
    flagUrl: record.flagUrl || undefined,
    updatedAt: (record.profileUpdatedAt || record.updatedAt) as string,
  };
}

function toCareerSlot(record: CareerRecord): CareerSlot {
  return {
    id: record.id,
    saveName: record.saveName,
    playerName: record.playerName,
    club: record.club,
    season: record.season,
    isActive: record.isActive,
    updatedAt: record.updatedAt,
  };
}

const emptyProfileState = {
  achievements: [] as Achievement[],
  injuries: [] as InjuryLog[],
  suspensions: [] as Suspension[],
  pressNotes: [] as PressNote[],
};

export const useCareerStore = create<CareerState>()(
  persist(
    (set, get) => ({
      career: null,
      careers: [],
      activeCareerId: null,
      theme: 'dark',
      achievements: [],
      injuries: [],
      suspensions: [],
      pressNotes: [],
      backupMatchThreshold: 10,
      lastBackupMatchCount: 0,

      loadCareers: async () => {
        const careers = await careersApi.listCareers();
        if (!careers.length) {
          set({ careers: [], activeCareerId: null, career: null, ...emptyProfileState });
          return;
        }

        const active = careers.find((c) => c.isActive) || careers[0];
        const activeDetails = await careersApi.getCareer(active.id);

        set({
          careers: careers.map(toCareerSlot),
          activeCareerId: active.id,
          career: toCareerProfile(activeDetails),
        });
      },

      activateCareer: async (id) => {
        await careersApi.activateCareer(id);
        const careers = await careersApi.listCareers();
        const detail = await careersApi.getCareer(id);
        set({
          careers: careers.map(toCareerSlot),
          activeCareerId: id,
          career: toCareerProfile(detail),
        });
      },

      setCareer: async (career) => {
        const activeCareerId = get().activeCareerId;
        if (!activeCareerId) {
          const created = await careersApi.createCareer({
            ...career,
            saveName: `${career.playerName || 'Career'} Save`,
            isActive: true,
          });
          set({
            career: toCareerProfile(created),
            activeCareerId: created.id,
            careers: [...get().careers.filter((c) => c.id !== created.id), toCareerSlot(created)],
          });
          return;
        }

        const updated = await careersApi.updateCareer(activeCareerId, { ...career });
        set((state) => ({
          career: toCareerProfile(updated),
          careers: state.careers.map((slot) =>
            slot.id === activeCareerId ? toCareerSlot(updated) : slot,
          ),
        }));
      },

      clearCareer: async () => {
        const activeCareerId = get().activeCareerId;
        if (!activeCareerId) {
          set({ career: null, careers: [], activeCareerId: null, ...emptyProfileState });
          return;
        }

        await careersApi.deleteCareer(activeCareerId);
        await get().loadCareers();

        const nextCareerId = get().activeCareerId;
        if (nextCareerId) await get().loadProfileState(nextCareerId);
        else get().resetProfileState();
      },

      loadProfileState: async (careerId) => {
        const targetCareerId = careerId || get().activeCareerId;
        if (!targetCareerId) {
          set(emptyProfileState);
          return;
        }

        const [injuries, suspensions, pressNotes, achievements] = await Promise.all([
          profileApi.listInjuries(targetCareerId),
          profileApi.listSuspensions(targetCareerId),
          profileApi.listPressNotes(targetCareerId),
          profileApi.listAchievements(targetCareerId),
        ]);

        set({ injuries, suspensions, pressNotes, achievements });
      },

      resetProfileState: () => set(emptyProfileState),

      resetState: () =>
        set({
          career: null,
          careers: [],
          activeCareerId: null,
          ...emptyProfileState,
        }),

      setTheme: (t) => set({ theme: t }),

      unlockAchievement: async (key) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        const existing = get().achievements.find((a) => a.key === key);
        if (existing?.unlockedAt) return;
        const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
        if (!def) return;

        const unlockedAt = nowISO();
        const saved = await profileApi.unlockAchievement(careerId, {
          key: def.key,
          label: def.label,
          description: def.description,
          icon: def.icon,
          unlockedAt,
        });

        set((state) => {
          const already = state.achievements.find((a) => a.key === key);
          if (already) {
            return {
              achievements: state.achievements.map((a) => (a.key === key ? { ...a, ...saved } : a)),
            };
          }
          return { achievements: [...state.achievements, saved] };
        });
      },

      checkAchievements: async (ctx) => {
        const state = get();
        const careerId = state.activeCareerId;
        if (!careerId) return [];

        const checks: { key: string; condition: boolean }[] = [
          { key: 'debut', condition: ctx.totalMatches >= 1 },
          { key: 'first_goal', condition: ctx.totalGoals >= 1 },
          { key: 'first_ucl_goal', condition: ctx.hasScoredUCLKO },
          { key: 'hat_trick', condition: ctx.hatTricks >= 1 },
          { key: 'rating_10', condition: ctx.hasRating10 },
          { key: 'streak_5_ga', condition: ctx.gaStreak >= 5 },
          { key: 'motm_5', condition: ctx.totalMotm >= 5 },
          { key: 'clutch_5', condition: ctx.totalClutch >= 5 },
          { key: 'big_game', condition: ctx.hasScoredUCLKO },
          { key: 'dribbles_10', condition: ctx.maxDribblesInMatch >= 10 },
        ];

        const newlyUnlocked: string[] = [];
        for (const check of checks) {
          if (!check.condition) continue;
          const existing = get().achievements.find((a) => a.key === check.key);
          if (existing?.unlockedAt) continue;
          const def = ACHIEVEMENT_DEFS.find((d) => d.key === check.key);
          if (!def) continue;

          const unlockedAt = nowISO();
          await profileApi.unlockAchievement(careerId, {
            key: def.key,
            label: def.label,
            description: def.description,
            icon: def.icon,
            unlockedAt,
          });
          newlyUnlocked.push(check.key);
        }

        if (newlyUnlocked.length) {
          await get().loadProfileState(careerId);
        }
        return newlyUnlocked;
      },

      addInjury: async (injury) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        const created = await profileApi.createInjury(careerId, injury);
        set((state) => ({ injuries: [...state.injuries, created] }));
      },

      updateInjury: async (id, injury) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        const updated = await profileApi.updateInjury(careerId, id, injury);
        set((state) => ({
          injuries: state.injuries.map((item) => (item.id === id ? updated : item)),
        }));
      },

      deleteInjury: async (id) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        await profileApi.deleteInjury(careerId, id);
        set((state) => ({ injuries: state.injuries.filter((item) => item.id !== id) }));
      },

      addSuspension: async (suspension) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        const created = await profileApi.createSuspension(careerId, suspension);
        set((state) => ({ suspensions: [...state.suspensions, created] }));
      },

      deleteSuspension: async (id) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        await profileApi.deleteSuspension(careerId, id);
        set((state) => ({ suspensions: state.suspensions.filter((item) => item.id !== id) }));
      },

      addPressNote: async (note) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        const created = await profileApi.createPressNote(careerId, { ...note, createdAt: nowISO() });
        set((state) => ({ pressNotes: [...state.pressNotes, created] }));
      },

      deletePressNote: async (id) => {
        const careerId = get().activeCareerId;
        if (!careerId) return;
        await profileApi.deletePressNote(careerId, id);
        set((state) => ({ pressNotes: state.pressNotes.filter((item) => item.id !== id) }));
      },

      setBackupThreshold: (n) => set({ backupMatchThreshold: n }),
      setLastBackupCount: (n) => set({ lastBackupMatchCount: n }),
    }),
    {
      name: KEYS.CAREER,
      partialize: (state) => ({
        theme: state.theme,
        backupMatchThreshold: state.backupMatchThreshold,
        lastBackupMatchCount: state.lastBackupMatchCount,
      }),
    },
  ),
);
