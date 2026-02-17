import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KEYS } from '../services/storage/storage.keys';
import type { TransferOffer, Contract, AgentNote } from '../types/transfer.types';
import { uid } from '../utils/id';
import { nowISO } from '../utils/date';

interface TransfersState {
  offers: TransferOffer[];
  contracts: Contract[];
  agentNotes: AgentNote[];

  addOffer: (o: Omit<TransferOffer, 'id' | 'createdAt'>) => void;
  updateOffer: (id: string, o: Partial<TransferOffer>) => void;
  deleteOffer: (id: string) => void;
  addContract: (c: Omit<Contract, 'id'>) => void;
  deleteContract: (id: string) => void;
  addAgentNote: (n: Omit<AgentNote, 'id' | 'createdAt'>) => void;
  deleteAgentNote: (id: string) => void;
}

export const useTransfersStore = create<TransfersState>()(
  persist(
    (set) => ({
      offers: [],
      contracts: [],
      agentNotes: [],

      addOffer: (o) => set((s) => ({ offers: [...s.offers, { ...o, id: uid(), createdAt: nowISO() }] })),
      updateOffer: (id, o) => set((s) => ({ offers: s.offers.map((x) => x.id === id ? { ...x, ...o } : x) })),
      deleteOffer: (id) => set((s) => ({ offers: s.offers.filter((x) => x.id !== id) })),
      addContract: (c) => set((s) => ({ contracts: [...s.contracts, { ...c, id: uid() }] })),
      deleteContract: (id) => set((s) => ({ contracts: s.contracts.filter((x) => x.id !== id) })),
      addAgentNote: (n) => set((s) => ({ agentNotes: [...s.agentNotes, { ...n, id: uid(), createdAt: nowISO() }] })),
      deleteAgentNote: (id) => set((s) => ({ agentNotes: s.agentNotes.filter((x) => x.id !== id) })),
    }),
    { name: KEYS.TRANSFERS },
  ),
);
