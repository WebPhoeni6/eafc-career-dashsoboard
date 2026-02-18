const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./sync.service');

const importCareer = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const data = await service.importCareer(req.user.id, payload);
  return success(res, data, 'Import complete', 201);
});

const exportCareer = asyncHandler(async (req, res) => {
  const { careerId } = req.params;
  const data = await service.exportCareer(req.user.id, careerId);
  return success(res, data, 'Export ready');
});

module.exports = {
  importCareer,
  exportCareer,
};
