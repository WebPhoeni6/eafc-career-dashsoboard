const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./matches.service');

const listMatches = asyncHandler(async (req, res) => {
  const { careerId } = req.params;
  const { items, meta } = await service.listMatches(req.user.id, careerId, req.query);
  return success(res, items, 'Matches loaded', 200, meta);
});

const createMatch = asyncHandler(async (req, res) => {
  const { careerId } = req.params;
  const payload = req.validated?.body || req.body;
  const data = await service.createMatch(req.user.id, careerId, payload);
  return success(res, data, 'Match created', 201);
});

const getMatch = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  const data = await service.getMatch(req.user.id, careerId, id);
  return success(res, data, 'Match loaded');
});

const updateMatch = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  const payload = req.validated?.body || req.body;
  const data = await service.updateMatch(req.user.id, careerId, id, payload);
  return success(res, data, 'Match updated');
});

const deleteMatch = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  await service.deleteMatch(req.user.id, careerId, id);
  return res.status(204).send();
});

const pinMatch = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  const data = await service.togglePin(req.user.id, careerId, id);
  return success(res, data, 'Match pin toggled');
});

const uploadPerformanceImage = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  const data = await service.uploadPerformanceImage(req.user.id, careerId, id, req.file?.path);
  return success(res, data, 'Performance image uploaded');
});

const deletePerformanceImage = asyncHandler(async (req, res) => {
  const { careerId, id } = req.params;
  const data = await service.deletePerformanceImage(req.user.id, careerId, id);
  return success(res, data, 'Performance image deleted');
});

const analyzePerformance = asyncHandler(async (req, res) => {
  const { careerId } = req.params;
  const files = Array.isArray(req.files) ? req.files : [];
  const data = await service.analyzePerformance(req.user.id, careerId, files);
  return success(res, data, 'Performance image(s) analyzed');
});

module.exports = {
  listMatches,
  createMatch,
  getMatch,
  updateMatch,
  deleteMatch,
  pinMatch,
  uploadPerformanceImage,
  deletePerformanceImage,
  analyzePerformance,
};
