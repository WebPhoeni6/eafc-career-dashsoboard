const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./users.service');

const getMe = asyncHandler(async (req, res) => {
  const user = await service.getMe(req.user.id);
  return success(res, user, 'User loaded');
});

const updateMe = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const user = await service.updateMe(req.user.id, payload);
  return success(res, user, 'User updated');
});

const deleteMe = asyncHandler(async (req, res) => {
  await service.deleteMe(req.user.id);
  return res.status(204).send();
});

module.exports = {
  getMe,
  updateMe,
  deleteMe,
};
