const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./careers.controller');
const {
  createCareerSchema,
  updateCareerSchema,
  careerIdSchema,
  careerInsightsSchema,
  careerInsightsQuestionSchema,
  careerDirectorReportSchema,
  careerDirectorChatSchema,
  careerDirectorHistorySchema,
} = require('./careers.validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Careers
 *   description: Career save slot management
 */

router.use(requireAuth);
router.get('/', controller.listCareers);
router.post('/', validate(createCareerSchema), controller.createCareer);
router.get('/:id/performance-insights', validate(careerInsightsSchema), controller.getPerformanceInsights);
router.post('/:id/performance-insights/ask', validate(careerInsightsQuestionSchema), controller.askPerformanceInsightsQuestion);
router.post('/:id/ai/career-director/report', validate(careerDirectorReportSchema), controller.generateCareerDirectorReport);
router.post('/:id/ai/career-director/chat', validate(careerDirectorChatSchema), controller.chatCareerDirector);
router.get('/:id/ai/career-director/history', validate(careerDirectorHistorySchema), controller.getCareerDirectorHistory);
router.get('/:id', validate(careerIdSchema), controller.getCareer);
router.patch('/:id', validate(updateCareerSchema), controller.updateCareer);
router.delete('/:id', validate(careerIdSchema), controller.deleteCareer);
router.post('/:id/activate', validate(careerIdSchema), controller.activateCareer);

module.exports = router;
