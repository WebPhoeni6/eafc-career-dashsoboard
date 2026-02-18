const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { matchImageUpload, matchAnalysisUpload } = require('../../middlewares/upload');
const controller = require('./matches.controller');
const {
  listMatchesSchema,
  createMatchSchema,
  updateMatchSchema,
  matchIdSchema,
  analyzePerformanceSchema,
} = require('./matches.validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Matches
 *   description: Match log endpoints
 */

router.use(requireAuth);
router.get('/', validate(listMatchesSchema), controller.listMatches);
router.post('/', validate(createMatchSchema), controller.createMatch);
router.post('/analyze-performance', validate(analyzePerformanceSchema), matchAnalysisUpload.array('images', 4), controller.analyzePerformance);
router.get('/:id', validate(matchIdSchema), controller.getMatch);
router.patch('/:id', validate(updateMatchSchema), controller.updateMatch);
router.delete('/:id', validate(matchIdSchema), controller.deleteMatch);
router.post('/:id/pin', validate(matchIdSchema), controller.pinMatch);
router.post('/:id/performance-image', validate(matchIdSchema), matchImageUpload.single('image'), controller.uploadPerformanceImage);
router.delete('/:id/performance-image', validate(matchIdSchema), controller.deletePerformanceImage);

module.exports = router;
