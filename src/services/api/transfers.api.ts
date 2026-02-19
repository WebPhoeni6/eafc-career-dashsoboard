import type { AgentNote, Contract, ContractCreateInput, ContractUpdateInput, TransferOffer } from '../../types/transfer.types';
import { request } from './http';

export async function listOffers(careerId: string): Promise<TransferOffer[]> {
  return request(`/api/careers/${careerId}/offers`);
}

export async function createOffer(
  careerId: string,
  payload: Omit<TransferOffer, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<TransferOffer> {
  return request(`/api/careers/${careerId}/offers`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateOffer(
  careerId: string,
  id: string,
  payload: Partial<Omit<TransferOffer, 'id' | 'createdAt'>>,
): Promise<TransferOffer> {
  return request(`/api/careers/${careerId}/offers/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteOffer(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/offers/${id}`, {
    method: 'DELETE',
  });
}

export async function listContracts(careerId: string): Promise<Contract[]> {
  return request(`/api/careers/${careerId}/contracts`);
}

export async function createContract(careerId: string, payload: ContractCreateInput): Promise<Contract> {
  return request(`/api/careers/${careerId}/contracts`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateContract(careerId: string, id: string, payload: ContractUpdateInput): Promise<Contract> {
  return request(`/api/careers/${careerId}/contracts/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteContract(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/contracts/${id}`, {
    method: 'DELETE',
  });
}

export async function listAgentNotes(careerId: string): Promise<AgentNote[]> {
  return request(`/api/careers/${careerId}/agent-notes`);
}

export async function createAgentNote(
  careerId: string,
  payload: Omit<AgentNote, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<AgentNote> {
  return request(`/api/careers/${careerId}/agent-notes`, {
    method: 'POST',
    body: payload,
  });
}

export async function deleteAgentNote(careerId: string, id: string): Promise<void> {
  await request(`/api/careers/${careerId}/agent-notes/${id}`, {
    method: 'DELETE',
  });
}
