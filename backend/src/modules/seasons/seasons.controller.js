const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./seasons.service');

const listTrophies = asyncHandler(async (req, res) => {
  const data = await service.listTrophies(req.user.id, req.params.careerId);
  return success(res, data, 'Trophies loaded');
});

const createTrophy = asyncHandler(async (req, res) => {
  const data = await service.createTrophy(req.user.id, req.params.careerId, req.validated?.body || req.body);
  return success(res, data, 'Trophy created', 201);
});

const deleteTrophy = asyncHandler(async (req, res) => {
  await service.deleteTrophy(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listChallenges = asyncHandler(async (req, res) => {
  const data = await service.listChallenges(req.user.id, req.params.careerId);
  return success(res, data, 'Challenges loaded');
});

const createChallenge = asyncHandler(async (req, res) => {
  const data = await service.createChallenge(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Challenge created', 201);
});

const updateChallenge = asyncHandler(async (req, res) => {
  const data = await service.updateChallenge(
    req.user.id,
    req.params.careerId,
    req.params.id,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Challenge updated');
});

const deleteChallenge = asyncHandler(async (req, res) => {
  await service.deleteChallenge(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

const listNarrativeTags = asyncHandler(async (req, res) => {
  const data = await service.listNarrativeTags(req.user.id, req.params.careerId);
  return success(res, data, 'Narrative tags loaded');
});

const createNarrativeTag = asyncHandler(async (req, res) => {
  const data = await service.createNarrativeTag(
    req.user.id,
    req.params.careerId,
    req.validated?.body || req.body,
  );
  return success(res, data, 'Narrative tag created', 201);
});

const deleteNarrativeTag = asyncHandler(async (req, res) => {
  await service.deleteNarrativeTag(req.user.id, req.params.careerId, req.params.id);
  return res.status(204).send();
});

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
