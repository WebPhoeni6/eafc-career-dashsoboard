import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { SkillSpend, ArchetypeStage, TrainingLog, AttributeTarget } from '../types/skill.types';
import { uid } from '../utils/id';
import { nowISO } from '../utils/date';

interface SkillsState {
  skillSpends: SkillSpend[];
  archetypeStage: ArchetypeStage | null;
  trainingLogs: TrainingLog[];
  attributeTargets: AttributeTarget[];

  addSkillSpend: (s: Omit<SkillSpend, 'id' | 'createdAt'>) => void;
  deleteSkillSpend: (id: string) => void;
  setArchetypeStage: (a: ArchetypeStage) => void;
  addTrainingLog: (t: Omit<TrainingLog, 'id' | 'createdAt'>) => void;
  deleteTrainingLog: (id: string) => void;
  addAttributeTarget: (t: Omit<AttributeTarget, 'id'>) => void;
  updateAttributeTarget: (id: string, t: Partial<AttributeTarget>) => void;
  deleteAttributeTarget: (id: string) => void;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      skillSpends: [],
      archetypeStage: null,
      trainingLogs: [],
      attributeTargets: [],

      addSkillSpend: (s) => set((st) => ({ skillSpends: [...st.skillSpends, { ...s, id: uid(), createdAt: nowISO() }] })),
      deleteSkillSpend: (id) => set((st) => ({ skillSpends: st.skillSpends.filter((x) => x.id !== id) })),
      setArchetypeStage: (a) => set({ archetypeStage: a }),
      addTrainingLog: (t) => set((st) => ({ trainingLogs: [...st.trainingLogs, { ...t, id: uid(), createdAt: nowISO() }] })),
      deleteTrainingLog: (id) => set((st) => ({ trainingLogs: st.trainingLogs.filter((x) => x.id !== id) })),
      addAttributeTarget: (t) => set((st) => ({ attributeTargets: [...st.attributeTargets, { ...t, id: uid() }] })),
      updateAttributeTarget: (id, t) => set((st) => ({ attributeTargets: st.attributeTargets.map((x) => x.id === id ? { ...x, ...t } : x) })),
      deleteAttributeTarget: (id) => set((st) => ({ attributeTargets: st.attributeTargets.filter((x) => x.id !== id) })),
    }),
    { name: KEYS.SKILLS },
  ),
);
