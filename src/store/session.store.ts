import { create } from 'zustand';
import type { LoginInput, SignupInput, AuthUser } from '../services/api/auth.api';
import * as authApi from '../services/api/auth.api';
import * as usersApi from '../services/api/users.api';
import { clearAccessToken, getAccessToken, setAccessToken } from '../services/api/token';
import { tryRefreshSession } from '../services/api/http';
import { useCareerStore } from './career.store';
import { useMatchesStore } from './matches.store';
import { useSeasonsStore } from './seasons.store';
import { useSkillsStore } from './skills.store';
import { useTransfersStore } from './transfers.store';
import { useCareerDirectorStore } from './careerDirector.store';

interface SessionState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  authError: string | null;

  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

async function hydrateCareerData(): Promise<void> {
  const careerState = useCareerStore.getState();
  await careerState.loadCareers();

  const activeCareerId = useCareerStore.getState().activeCareerId;
  if (!activeCareerId) {
    useMatchesStore.getState().resetState();
    useSeasonsStore.getState().resetState();
    useSkillsStore.getState().resetState();
    useTransfersStore.getState().resetState();
    useCareerDirectorStore.getState().resetState();
    useCareerStore.getState().resetProfileState();
    return;
  }

  await Promise.all([
    useCareerStore.getState().loadProfileState(activeCareerId),
    useMatchesStore.getState().loadMatches(activeCareerId),
    useSeasonsStore.getState().loadSeasons(activeCareerId),
    useSkillsStore.getState().loadSkills(activeCareerId),
    useTransfersStore.getState().loadTransfers(activeCareerId),
  ]);
}

function clearAllDomainStores(): void {
  useCareerStore.getState().resetState();
  useMatchesStore.getState().resetState();
  useSeasonsStore.getState().resetState();
  useSkillsStore.getState().resetState();
  useTransfersStore.getState().resetState();
  useCareerDirectorStore.getState().resetState();
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  authError: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  bootstrap: async () => {
    set({ isBootstrapping: true, authError: null });

    try {
      let token = getAccessToken();
      if (!token) {
        const refreshed = await tryRefreshSession();
        if (!refreshed) {
          set({ user: null, isAuthenticated: false, isBootstrapping: false });
          return;
        }
        token = getAccessToken();
      }

      if (!token) {
        set({ user: null, isAuthenticated: false, isBootstrapping: false });
        return;
      }

      const user = await usersApi.getMe();
      set({ user, isAuthenticated: true });
      await hydrateCareerData();
    } catch (err) {
      clearAccessToken();
      clearAllDomainStores();
      set({
        user: null,
        isAuthenticated: false,
        authError: err instanceof Error ? err.message : 'Failed to restore session',
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  login: async (input) => {
    set({ authError: null });
    const result = await authApi.login(input);
    setAccessToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
    await hydrateCareerData();
  },

  signup: async (input) => {
    set({ authError: null });
    const result = await authApi.signup(input);
    setAccessToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
    await hydrateCareerData();
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout network failures and clear local session anyway.
    }
    clearAccessToken();
    clearAllDomainStores();
    set({ user: null, isAuthenticated: false, authError: null });
  },
}));
