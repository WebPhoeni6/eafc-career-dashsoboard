const { AppError } = require('../../middlewares/error');
const { assertCareerOwnership } = require('../careers/careers.repository');
const repo = require('./seasons.repository');

function mapNarrativeTag(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

async function listTrophies(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  return repo.trophy.list(careerId);
}

async function createTrophy(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  return repo.trophy.create({ careerId, ...input });
}

async function deleteTrophy(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.trophy.remove(careerId, id);
  if (!result.count) throw new AppError('Trophy not found', 404, 'NOT_FOUND');
}

async function listChallenges(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  return repo.challenge.list(careerId);
}

async function createChallenge(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  return repo.challenge.create({ careerId, ...input });
}

async function updateChallenge(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.challenge.update(careerId, id, input);
  if (!result.count) throw new AppError('Challenge not found', 404, 'NOT_FOUND');
  return prismaChallengeById(careerId, id);
}

async function deleteChallenge(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.challenge.remove(careerId, id);
  if (!result.count) throw new AppError('Challenge not found', 404, 'NOT_FOUND');
}

async function listNarrativeTags(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.narrativeTag.list(careerId);
  return rows.map(mapNarrativeTag);
}

async function createNarrativeTag(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.narrativeTag.create({
    careerId,
    season: input.season,
    tag: input.tag,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapNarrativeTag(row);
}

async function deleteNarrativeTag(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.narrativeTag.remove(careerId, id);
  if (!result.count) throw new AppError('Narrative tag not found', 404, 'NOT_FOUND');
}

async function prismaChallengeById(careerId, id) {
  const rows = await repo.challenge.list(careerId);
  const row = rows.find((item) => item.id === id);
  if (!row) throw new AppError('Challenge not found', 404, 'NOT_FOUND');
  return row;
}

module.exports = {
  listTrophies,
  createTrophy,
  deleteTrophy,
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  listNarrativeTags,
  createNarrativeTag,
  deleteNarrativeTag,
};
