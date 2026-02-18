import { useCareerStore } from '../../store/career.store';
import { useMatchesStore } from '../../store/matches.store';
import { useSeasonsStore } from '../../store/seasons.store';
import { useSkillsStore } from '../../store/skills.store';
import { useTransfersStore } from '../../store/transfers.store';

export async function hydrateCareerModules(careerId: string): Promise<void> {
  await Promise.all([
    useCareerStore.getState().loadProfileState(careerId),
    useMatchesStore.getState().loadMatches(careerId),
    useSeasonsStore.getState().loadSeasons(careerId),
    useSkillsStore.getState().loadSkills(careerId),
    useTransfersStore.getState().loadTransfers(careerId),
  ]);
}

export async function hydrateActiveCareerModules(): Promise<void> {
  const activeCareerId = useCareerStore.getState().activeCareerId;
  if (!activeCareerId) {
    useCareerStore.getState().resetProfileState();
    useMatchesStore.getState().resetState();
    useSeasonsStore.getState().resetState();
    useSkillsStore.getState().resetState();
    useTransfersStore.getState().resetState();
    return;
  }
  await hydrateCareerModules(activeCareerId);
}
