const { AppError } = require('../../middlewares/error');
const { assertCareerOwnership } = require('../careers/careers.repository');
const repo = require('./profile.repository');

function mapCreatedAt(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

function mapUpdated(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapAchievement(item) {
  return {
    ...item,
    unlockedAt: item.unlockedAt ? item.unlockedAt.toISOString() : undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function listInjuries(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.injury.list(careerId);
  return rows.map(mapUpdated);
}

async function createInjury(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.injury.create({
    careerId,
    ...input,
    returnDate: input.returnDate || null,
  });
  return mapUpdated(row);
}

async function updateInjury(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.injury.update(careerId, id, input);
  if (!result.count) throw new AppError('Injury not found', 404, 'NOT_FOUND');
  const rows = await repo.injury.list(careerId);
  return mapUpdated(rows.find((row) => row.id === id));
}

async function deleteInjury(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.injury.remove(careerId, id);
  if (!result.count) throw new AppError('Injury not found', 404, 'NOT_FOUND');
}

async function listSuspensions(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.suspension.list(careerId);
  return rows.map(mapCreatedAt);
}

async function createSuspension(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.suspension.create({
    careerId,
    ...input,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapCreatedAt(row);
}

async function deleteSuspension(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.suspension.remove(careerId, id);
  if (!result.count) throw new AppError('Suspension not found', 404, 'NOT_FOUND');
}

async function listPressNotes(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.pressNote.list(careerId);
  return rows.map(mapCreatedAt);
}

async function createPressNote(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.pressNote.create({
    careerId,
    ...input,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapCreatedAt(row);
}

async function deletePressNote(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.pressNote.remove(careerId, id);
  if (!result.count) throw new AppError('Press note not found', 404, 'NOT_FOUND');
}

async function listAchievements(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.achievement.list(careerId);
  return rows.map(mapAchievement);
}

async function unlockAchievement(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const existing = await repo.achievement.findByKey(careerId, input.key);
  if (existing) {
    const updatedCount = await repo.achievement.update(careerId, existing.id, {
      label: input.label,
      description: input.description,
      icon: input.icon,
      unlockedAt: input.unlockedAt ? new Date(input.unlockedAt) : new Date(),
    });
    if (!updatedCount.count) throw new AppError('Achievement not found', 404, 'NOT_FOUND');
    const rows = await repo.achievement.list(careerId);
    return mapAchievement(rows.find((row) => row.id === existing.id));
  }

  const row = await repo.achievement.create({
    careerId,
    key: input.key,
    label: input.label,
    description: input.description,
    icon: input.icon,
    unlockedAt: input.unlockedAt ? new Date(input.unlockedAt) : new Date(),
  });
  return mapAchievement(row);
}

async function updateAchievement(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const payload = { ...input };
  if (payload.unlockedAt) payload.unlockedAt = new Date(payload.unlockedAt);
  const result = await repo.achievement.update(careerId, id, payload);
  if (!result.count) throw new AppError('Achievement not found', 404, 'NOT_FOUND');
  const rows = await repo.achievement.list(careerId);
  return mapAchievement(rows.find((row) => row.id === id));
}

module.exports = {
  listInjuries,
  createInjury,
  updateInjury,
  deleteInjury,
  listSuspensions,
  createSuspension,
  deleteSuspension,
  listPressNotes,
  createPressNote,
  deletePressNote,
  listAchievements,
  unlockAchievement,
  updateAchievement,
};
