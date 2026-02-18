import { create } from 'zustand';
import type { SkillSpend, ArchetypeStage, TrainingLog, AttributeTarget } from '../types/skill.types';
import * as skillsApi from '../services/api/skills.api';
import { useCareerStore } from './career.store';
import { nowISO } from '../utils/date';

interface SkillsState {
  skillSpends: SkillSpend[];
  archetypeStage: ArchetypeStage | null;
  trainingLogs: TrainingLog[];
  attributeTargets: AttributeTarget[];

  loadSkills: (careerId?: string) => Promise<void>;
  addSkillSpend: (s: Omit<SkillSpend, 'id' | 'createdAt'>) => Promise<void>;
  deleteSkillSpend: (id: string) => Promise<void>;
  setArchetypeStage: (a: ArchetypeStage) => Promise<void>;
  addTrainingLog: (t: Omit<TrainingLog, 'id' | 'createdAt'>) => Promise<void>;
  deleteTrainingLog: (id: string) => Promise<void>;
  addAttributeTarget: (t: Omit<AttributeTarget, 'id'>) => Promise<void>;
  updateAttributeTarget: (id: string, t: Partial<AttributeTarget>) => Promise<void>;
  deleteAttributeTarget: (id: string) => Promise<void>;
  resetState: () => void;
}

function getCareerId(explicit?: string): string {
  const id = explicit || useCareerStore.getState().activeCareerId;
  if (!id) throw new Error('No active career selected');
  return id;
}

export const useSkillsStore = create<SkillsState>()((set) => ({
  skillSpends: [],
  archetypeStage: null,
  trainingLogs: [],
  attributeTargets: [],

  loadSkills: async (careerId) => {
    const id = getCareerId(careerId);
    const [skillSpends, archetypeStage, trainingLogs, attributeTargets] = await Promise.all([
      skillsApi.listSkillSpends(id),
      skillsApi.getArchetypeStage(id),
      skillsApi.listTrainingLogs(id),
      skillsApi.listAttributeTargets(id),
    ]);
    set({ skillSpends, archetypeStage, trainingLogs, attributeTargets });
  },

  addSkillSpend: async (spend) => {
    const id = getCareerId();
    const created = await skillsApi.createSkillSpend(id, { ...spend, createdAt: nowISO() });
    set((state) => ({ skillSpends: [...state.skillSpends, created] }));
  },

  deleteSkillSpend: async (id) => {
    const careerId = getCareerId();
    await skillsApi.deleteSkillSpend(careerId, id);
    set((state) => ({ skillSpends: state.skillSpends.filter((item) => item.id !== id) }));
  },

  setArchetypeStage: async (archetypeStage) => {
    const careerId = getCareerId();
    const saved = await skillsApi.putArchetypeStage(careerId, archetypeStage);
    set({ archetypeStage: saved });
  },

  addTrainingLog: async (log) => {
    const careerId = getCareerId();
    const created = await skillsApi.createTrainingLog(careerId, { ...log, createdAt: nowISO() });
    set((state) => ({ trainingLogs: [...state.trainingLogs, created] }));
  },

  deleteTrainingLog: async (id) => {
    const careerId = getCareerId();
    await skillsApi.deleteTrainingLog(careerId, id);
    set((state) => ({ trainingLogs: state.trainingLogs.filter((item) => item.id !== id) }));
  },

  addAttributeTarget: async (target) => {
    const careerId = getCareerId();
    const created = await skillsApi.createAttributeTarget(careerId, target);
    set((state) => ({ attributeTargets: [...state.attributeTargets, created] }));
  },

  updateAttributeTarget: async (id, target) => {
    const careerId = getCareerId();
    const updated = await skillsApi.updateAttributeTarget(careerId, id, target);
    set((state) => ({
      attributeTargets: state.attributeTargets.map((item) => (item.id === id ? updated : item)),
    }));
  },

  deleteAttributeTarget: async (id) => {
    const careerId = getCareerId();
    await skillsApi.deleteAttributeTarget(careerId, id);
    set((state) => ({
      attributeTargets: state.attributeTargets.filter((item) => item.id !== id),
    }));
  },

  resetState: () =>
    set({
      skillSpends: [],
      archetypeStage: null,
      trainingLogs: [],
      attributeTargets: [],
    }),
}));
