const { AppError } = require('../../middlewares/error');
const { assertCareerOwnership } = require('../careers/careers.repository');
const repo = require('./transfers.repository');

function mapOffer(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapAgentNote(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

function normalizeOfferDates(input) {
  const out = { ...input };
  if ('decisionDate' in out) {
    const value = typeof out.decisionDate === 'string' ? out.decisionDate.trim() : out.decisionDate;
    out.decisionDate = value || null;
  }
  return out;
}

function normalizeContractCreateInput(input) {
  return {
    club: String(input.club || '').trim(),
    league: String(input.league || '').trim(),
    startSeason: String(input.startSeason || '').trim(),
    endSeason: String(input.endSeason || '').trim() || 'Active',
    apps: Number.isFinite(Number(input.apps)) ? Number(input.apps) : 0,
    goals: Number.isFinite(Number(input.goals)) ? Number(input.goals) : 0,
    assists: Number.isFinite(Number(input.assists)) ? Number(input.assists) : 0,
    avgRating: Number.isFinite(Number(input.avgRating)) ? Math.max(0, Math.min(10, Number(input.avgRating))) : 0,
    trophies: Array.isArray(input.trophies) ? input.trophies.map((t) => String(t).trim()).filter(Boolean) : [],
    notes: typeof input.notes === 'string' ? input.notes : '',
  };
}

function normalizeContractUpdateInput(input) {
  const out = {};
  if ('club' in input) out.club = String(input.club || '').trim();
  if ('league' in input) out.league = String(input.league || '').trim();
  if ('startSeason' in input) out.startSeason = String(input.startSeason || '').trim();
  if ('endSeason' in input) out.endSeason = String(input.endSeason || '').trim() || 'Active';
  if ('apps' in input && Number.isFinite(Number(input.apps))) out.apps = Number(input.apps);
  if ('goals' in input && Number.isFinite(Number(input.goals))) out.goals = Number(input.goals);
  if ('assists' in input && Number.isFinite(Number(input.assists))) out.assists = Number(input.assists);
  if ('avgRating' in input && Number.isFinite(Number(input.avgRating))) {
    out.avgRating = Math.max(0, Math.min(10, Number(input.avgRating)));
  }
  if ('trophies' in input) {
    out.trophies = Array.isArray(input.trophies) ? input.trophies.map((t) => String(t).trim()).filter(Boolean) : [];
  }
  if ('notes' in input) out.notes = typeof input.notes === 'string' ? input.notes : '';
  return out;
}

async function listOffers(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.offer.list(careerId);
  return rows.map(mapOffer);
}

async function createOffer(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const normalized = normalizeOfferDates(input);
  const row = await repo.offer.create({
    careerId,
    ...normalized,
    decisionDate: normalized.decisionDate || null,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapOffer(row);
}

async function updateOffer(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const normalized = normalizeOfferDates(input);
  if (normalized.status === 'Pending' && !('decisionDate' in normalized)) {
    normalized.decisionDate = null;
  }
  const result = await repo.offer.update(careerId, id, normalized);
  if (!result.count) throw new AppError('Offer not found', 404, 'NOT_FOUND');
  const rows = await repo.offer.list(careerId);
  return mapOffer(rows.find((row) => row.id === id));
}

async function deleteOffer(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.offer.remove(careerId, id);
  if (!result.count) throw new AppError('Offer not found', 404, 'NOT_FOUND');
}

async function listContracts(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  return repo.contract.list(careerId);
}

async function createContract(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const existing = await repo.contract.list(careerId);
  if (existing.some((c) => c.endSeason === 'Active')) {
    throw new AppError('You already have an active contract. Close it before starting a new one.', 400, 'CONTRACT_ACTIVE');
  }
  return repo.contract.create({ careerId, ...normalizeContractCreateInput(input) });
}

async function updateContract(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const payload = normalizeContractUpdateInput(input);
  const result = await repo.contract.update(careerId, id, payload);
  if (!result.count) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  const rows = await repo.contract.list(careerId);
  const updated = rows.find((row) => row.id === id);
  if (!updated) throw new AppError('Contract not found', 404, 'NOT_FOUND');
  return updated;
}

async function deleteContract(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.contract.remove(careerId, id);
  if (!result.count) throw new AppError('Contract not found', 404, 'NOT_FOUND');
}

async function listAgentNotes(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.agentNote.list(careerId);
  return rows.map(mapAgentNote);
}

async function createAgentNote(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.agentNote.create({
    careerId,
    ...input,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapAgentNote(row);
}

async function deleteAgentNote(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.agentNote.remove(careerId, id);
  if (!result.count) throw new AppError('Agent note not found', 404, 'NOT_FOUND');
}

module.exports = {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  listContracts,
  createContract,
  updateContract,
  deleteContract,
  listAgentNotes,
  createAgentNote,
  deleteAgentNote,
};
