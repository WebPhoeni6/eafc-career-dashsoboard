const { AppError } = require('../../middlewares/error');
const { skillCategoryToEnum, enumToSkillCategory } = require('../../utils/helpers');
const { assertCareerOwnership } = require('../careers/careers.repository');
const repo = require('./skills.repository');

function mapSkillSpend(item) {
  return {
    ...item,
    category: enumToSkillCategory(item.category),
    createdAt: item.createdAt.toISOString(),
  };
}

function mapArchetypeStage(item) {
  if (!item) return null;
  return {
    archetype: item.archetype,
    stage: item.stage,
    currentPerks: item.currentPerks,
    nextUnlock: item.nextUnlock,
    checklist: item.checklist,
  };
}

function mapTrainingLog(item) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

async function listSkillSpends(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.skillSpend.list(careerId);
  return rows.map(mapSkillSpend);
}

async function createSkillSpend(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.skillSpend.create({
    careerId,
    ...input,
    category: skillCategoryToEnum(input.category),
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapSkillSpend(row);
}

async function deleteSkillSpend(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.skillSpend.remove(careerId, id);
  if (!result.count) throw new AppError('Skill spend not found', 404, 'NOT_FOUND');
}

async function listAttributeTargets(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  return repo.attributeTarget.list(careerId);
}

async function createAttributeTarget(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  return repo.attributeTarget.create({ careerId, ...input });
}

async function updateAttributeTarget(userId, careerId, id, input) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.attributeTarget.update(careerId, id, input);
  if (!result.count) throw new AppError('Attribute target not found', 404, 'NOT_FOUND');
  const list = await repo.attributeTarget.list(careerId);
  return list.find((item) => item.id === id);
}

async function deleteAttributeTarget(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.attributeTarget.remove(careerId, id);
  if (!result.count) throw new AppError('Attribute target not found', 404, 'NOT_FOUND');
}

async function getArchetypeStage(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.archetypeStage.get(careerId);
  return mapArchetypeStage(row);
}

async function upsertArchetypeStage(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.archetypeStage.upsert(careerId, input);
  return mapArchetypeStage(row);
}

async function listTrainingLogs(userId, careerId) {
  await assertCareerOwnership(careerId, userId);
  const rows = await repo.trainingLog.list(careerId);
  return rows.map(mapTrainingLog);
}

async function createTrainingLog(userId, careerId, input) {
  await assertCareerOwnership(careerId, userId);
  const row = await repo.trainingLog.create({
    careerId,
    ...input,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
  });
  return mapTrainingLog(row);
}

async function deleteTrainingLog(userId, careerId, id) {
  await assertCareerOwnership(careerId, userId);
  const result = await repo.trainingLog.remove(careerId, id);
  if (!result.count) throw new AppError('Training log not found', 404, 'NOT_FOUND');
}

module.exports = {
  listSkillSpends,
  createSkillSpend,
  deleteSkillSpend,
  listAttributeTargets,
  createAttributeTarget,
  updateAttributeTarget,
  deleteAttributeTarget,
  getArchetypeStage,
  upsertArchetypeStage,
  listTrainingLogs,
  createTrainingLog,
  deleteTrainingLog,
};
