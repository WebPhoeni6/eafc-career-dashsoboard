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

async function listOffers(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.offer.list(careerId);
  return rows.map(mapOffer);
}

async function createOffer(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.offer.create({
    careerId,
    ...input,
    decisionDate: input.decisionDate || null,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapOffer(row);
}

async function updateOffer(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.offer.update(careerId, id, input);
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
  return repo.contract.create({ careerId, ...input });
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
  deleteContract,
  listAgentNotes,
  createAgentNote,
  deleteAgentNote,
};
