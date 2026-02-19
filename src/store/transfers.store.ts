import { create } from 'zustand';
import type { TransferOffer, Contract, AgentNote, ContractCreateInput, ContractUpdateInput } from '../types/transfer.types';
import * as transfersApi from '../services/api/transfers.api';
import { useCareerStore } from './career.store';
import { nowISO } from '../utils/date';

interface TransfersState {
  offers: TransferOffer[];
  contracts: Contract[];
  agentNotes: AgentNote[];

  loadTransfers: (careerId?: string) => Promise<void>;
  addOffer: (o: Omit<TransferOffer, 'id' | 'createdAt'>) => Promise<void>;
  updateOffer: (id: string, o: Partial<TransferOffer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  addContract: (c: ContractCreateInput) => Promise<void>;
  updateContract: (id: string, c: ContractUpdateInput) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  addAgentNote: (n: Omit<AgentNote, 'id' | 'createdAt'>) => Promise<void>;
  deleteAgentNote: (id: string) => Promise<void>;
  resetState: () => void;
}

function getCareerId(explicit?: string): string {
  const id = explicit || useCareerStore.getState().activeCareerId;
  if (!id) throw new Error('No active career selected');
  return id;
}

export const useTransfersStore = create<TransfersState>()((set) => ({
  offers: [],
  contracts: [],
  agentNotes: [],

  loadTransfers: async (careerId) => {
    const id = getCareerId(careerId);
    const [offers, contracts, agentNotes] = await Promise.all([
      transfersApi.listOffers(id),
      transfersApi.listContracts(id),
      transfersApi.listAgentNotes(id),
    ]);
    set({ offers, contracts, agentNotes });
  },

  addOffer: async (offer) => {
    const careerId = getCareerId();
    const created = await transfersApi.createOffer(careerId, { ...offer, createdAt: nowISO() });
    set((state) => ({ offers: [...state.offers, created] }));
  },

  updateOffer: async (id, offer) => {
    const careerId = getCareerId();
    const updated = await transfersApi.updateOffer(careerId, id, offer);
    set((state) => ({ offers: state.offers.map((item) => (item.id === id ? updated : item)) }));
  },

  deleteOffer: async (id) => {
    const careerId = getCareerId();
    await transfersApi.deleteOffer(careerId, id);
    set((state) => ({ offers: state.offers.filter((item) => item.id !== id) }));
  },

  addContract: async (contract) => {
    const careerId = getCareerId();
    const created = await transfersApi.createContract(careerId, contract);
    set((state) => ({ contracts: [...state.contracts, created] }));
  },

  updateContract: async (id, contract) => {
    const careerId = getCareerId();
    const updated = await transfersApi.updateContract(careerId, id, contract);
    set((state) => ({ contracts: state.contracts.map((item) => (item.id === id ? updated : item)) }));
  },

  deleteContract: async (id) => {
    const careerId = getCareerId();
    await transfersApi.deleteContract(careerId, id);
    set((state) => ({ contracts: state.contracts.filter((item) => item.id !== id) }));
  },

  addAgentNote: async (note) => {
    const careerId = getCareerId();
    const created = await transfersApi.createAgentNote(careerId, { ...note, createdAt: nowISO() });
    set((state) => ({ agentNotes: [...state.agentNotes, created] }));
  },

  deleteAgentNote: async (id) => {
    const careerId = getCareerId();
    await transfersApi.deleteAgentNote(careerId, id);
    set((state) => ({ agentNotes: state.agentNotes.filter((item) => item.id !== id) }));
  },

  resetState: () => set({ offers: [], contracts: [], agentNotes: [] }),
}));
