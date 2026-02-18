const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./profile.service');

const listInjuries = asyncHandler(async (req, res) => {
  const data = await service.listInjuries(req.user.id, req.params.careerId);
  return success(res, data, 'Injuries loaded');
});

const createInjury = asyncHandler(async (req, res) => {
  const data = await service.createInjury(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Injury created', 201);
});

const updateInjury = asyncHandler(async (req, res) => {
  const data = await service.updateInjury(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Injury updated');
});

const deleteInjury = asyncHandler(async (req, res) => {
  await service.deleteInjury(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listSuspensions = asyncHandler(async (req, res) => {
  const data = await service.listSuspensions(req.user.id, req.params.careerId);
  return success(res, data, 'Suspensions loaded');
});

const createSuspension = asyncHandler(async (req, res) => {
  const data = await service.createSuspension(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Suspension created', 201);
});

const deleteSuspension = asyncHandler(async (req, res) => {
  await service.deleteSuspension(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listPressNotes = asyncHandler(async (req, res) => {
  const data = await service.listPressNotes(req.user.id, req.params.careerId);
  return success(res, data, 'Press notes loaded');
});

const createPressNote = asyncHandler(async (req, res) => {
  const data = await service.createPressNote(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Press note created', 201);
});

const deletePressNote = asyncHandler(async (req, res) => {
  await service.deletePressNote(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listAchievements = asyncHandler(async (req, res) => {
  const data = await service.listAchievements(req.user.id, req.params.careerId);
  return success(res, data, 'Achievements loaded');
});

const unlockAchievement = asyncHandler(async (req, res) => {
  const data = await service.unlockAchievement(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Achievement unlocked', 201);
});

const updateAchievement = asyncHandler(async (req, res) => {
  const data = await service.updateAchievement(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Achievement updated');
});

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
