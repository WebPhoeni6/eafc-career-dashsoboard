const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./skills.service');

const listSkillSpends = asyncHandler(async (req, res) => {
  const data = await service.listSkillSpends(req.user.id, req.params.careerId);
  return success(res, data, 'Skill spends loaded');
});

const createSkillSpend = asyncHandler(async (req, res) => {
  const data = await service.createSkillSpend(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Skill spend created', 201);
});

const deleteSkillSpend = asyncHandler(async (req, res) => {
  await service.deleteSkillSpend(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listAttributeTargets = asyncHandler(async (req, res) => {
  const data = await service.listAttributeTargets(req.user.id, req.params.careerId);
  return success(res, data, 'Attribute targets loaded');
});

const createAttributeTarget = asyncHandler(async (req, res) => {
  const data = await service.createAttributeTarget(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Attribute target created', 201);
});

const updateAttributeTarget = asyncHandler(async (req, res) => {
  const data = await service.updateAttributeTarget(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Attribute target updated');
});

const deleteAttributeTarget = asyncHandler(async (req, res) => {
  await service.deleteAttributeTarget(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const getArchetypeStage = asyncHandler(async (req, res) => {
  const data = await service.getArchetypeStage(req.user.id, req.params.careerId);
  return success(res, data, 'Archetype stage loaded');
});

const putArchetypeStage = asyncHandler(async (req, res) => {
  const data = await service.upsertArchetypeStage(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Archetype stage saved');
});

const listTrainingLogs = asyncHandler(async (req, res) => {
  const data = await service.listTrainingLogs(req.user.id, req.params.careerId);
  return success(res, data, 'Training logs loaded');
});

const createTrainingLog = asyncHandler(async (req, res) => {
  const data = await service.createTrainingLog(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Training log created', 201);
});

const deleteTrainingLog = asyncHandler(async (req, res) => {
  await service.deleteTrainingLog(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

module.exports = {
  listSkillSpends,
  createSkillSpend,
  deleteSkillSpend,
  listAttributeTargets,
  createAttributeTarget,
  updateAttributeTarget,
  deleteAttributeTarget,
  getArchetypeStage,
  putArchetypeStage,
  listTrainingLogs,
  createTrainingLog,
  deleteTrainingLog,
};
