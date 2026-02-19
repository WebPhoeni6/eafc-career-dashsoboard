const { success } = require('../../utils/response');
const { asyncHandler } = require('../../middlewares/error');
const service = require('./careers.service');

const listCareers = asyncHandler(async (req, res) => {
  const data = await service.listCareers(req.user.id);
  return success(res, data, 'Careers loaded');
});

const createCareer = asyncHandler(async (req, res) => {
  const payload = req.validated?.body || req.body;
  const data = await service.createCareer(req.user.id, payload);
  return success(res, data, 'Career created', 201);
});

const getCareer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await service.getCareer(req.user.id, id);
  return success(res, data, 'Career loaded');
});

const updateCareer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.validated?.body || req.body;
  const data = await service.updateCareer(req.user.id, id, payload);
  return success(res, data, 'Career updated');
});

const deleteCareer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await service.deleteCareer(req.user.id, id);
  return res.status(204).send();
});

const activateCareer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await service.activateCareer(req.user.id, id);
  return success(res, null, 'Career activated');
});

const getPerformanceInsights = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = req.validated?.query || req.query || {};
  const data = await service.getPerformanceInsights(req.user.id, id, {
    recentMatches: query.recentMatches,
  });
  return success(res, data, 'Performance insights generated');
});

const askPerformanceInsightsQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.validated?.body || req.body || {};
  const data = await service.askPerformanceInsightsQuestion(req.user.id, id, {
    question: body.question,
    recentMatches: body.recentMatches,
  });
  return success(res, data, 'Performance insights question answered');
});

module.exports = {
  listCareers,
  createCareer,
  getCareer,
  updateCareer,
  deleteCareer,
  activateCareer,
  getPerformanceInsights,
  askPerformanceInsightsQuestion,
};
