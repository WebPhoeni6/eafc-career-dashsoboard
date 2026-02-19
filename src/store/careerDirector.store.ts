import { create } from 'zustand';
import {
  chatCareerDirector,
  generateCareerDirectorReport,
  getCareerDirectorHistory,
  type CareerDirectorChatMessage,
  type CareerDirectorFocus,
  type CareerDirectorReportRecord,
  type CareerDirectorRequestInput,
  type CareerDirectorTone,
} from '../services/api/careerDirector.api';
import { useCareerStore } from './career.store';

interface CareerDirectorState {
  reportsByCareer: Record<string, CareerDirectorReportRecord[]>;
  chatsByCareer: Record<string, CareerDirectorChatMessage[]>;
  loadingByCareer: Record<string, boolean>;
  chatLoadingByCareer: Record<string, boolean>;

  loadHistory: (careerId?: string) => Promise<void>;
  generateReport: (
    careerId: string | undefined,
    input: CareerDirectorRequestInput & { tone: CareerDirectorTone; focus: CareerDirectorFocus },
  ) => Promise<CareerDirectorReportRecord>;
  sendChat: (
    careerId: string | undefined,
    input: CareerDirectorRequestInput & {
      message: string;
      tone: CareerDirectorTone;
      focus: CareerDirectorFocus;
    },
  ) => Promise<void>;
  resetState: () => void;
}

function resolveCareerId(explicit?: string): string {
  const id = explicit || useCareerStore.getState().activeCareerId;
  if (!id) throw new Error('No active career selected');
  return id;
}

function byTimestampAsc<T extends { timestamp?: string; createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.timestamp || a.createdAt || '';
    const tb = b.timestamp || b.createdAt || '';
    return ta.localeCompare(tb);
  });
}

export const useCareerDirectorStore = create<CareerDirectorState>()((set, get) => ({
  reportsByCareer: {},
  chatsByCareer: {},
  loadingByCareer: {},
  chatLoadingByCareer: {},

  loadHistory: async (careerId) => {
    const id = resolveCareerId(careerId);
    set((state) => ({
      loadingByCareer: { ...state.loadingByCareer, [id]: true },
    }));
    try {
      const history = await getCareerDirectorHistory(id);
      set((state) => ({
        reportsByCareer: {
          ...state.reportsByCareer,
          [id]: byTimestampAsc(history.reports),
        },
        chatsByCareer: {
          ...state.chatsByCareer,
          [id]: byTimestampAsc(history.chats),
        },
      }));
    } finally {
      set((state) => ({
        loadingByCareer: { ...state.loadingByCareer, [id]: false },
      }));
    }
  },

  generateReport: async (careerId, input) => {
    const id = resolveCareerId(careerId);
    set((state) => ({
      loadingByCareer: { ...state.loadingByCareer, [id]: true },
    }));
    try {
      const created = await generateCareerDirectorReport(id, input);
      set((state) => ({
        reportsByCareer: {
          ...state.reportsByCareer,
          [id]: byTimestampAsc([...(state.reportsByCareer[id] || []), created]),
        },
      }));
      return created;
    } finally {
      set((state) => ({
        loadingByCareer: { ...state.loadingByCareer, [id]: false },
      }));
    }
  },

  sendChat: async (careerId, input) => {
    const id = resolveCareerId(careerId);
    set((state) => ({
      chatLoadingByCareer: { ...state.chatLoadingByCareer, [id]: true },
    }));
    try {
      const created = await chatCareerDirector(id, input);
      set((state) => ({
        chatsByCareer: {
          ...state.chatsByCareer,
          [id]: byTimestampAsc([
            ...(state.chatsByCareer[id] || []),
            created.user,
            created.assistant,
          ]),
        },
      }));
    } finally {
      set((state) => ({
        chatLoadingByCareer: { ...state.chatLoadingByCareer, [id]: false },
      }));
    }
  },

  resetState: () =>
    set({
      reportsByCareer: {},
      chatsByCareer: {},
      loadingByCareer: {},
      chatLoadingByCareer: {},
    }),
}));
