const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./seasons.controller');
const {
  byCareerSchema,
  byCareerAndIdSchema,
  createTrophySchema,
  createChallengeSchema,
  updateChallengeSchema,
  createNarrativeTagSchema,
} = require('./seasons.validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Seasons
 *   description: Season-related resources
 */

router.use(requireAuth);

router.get('/trophies', validate(byCareerSchema), controller.listTrophies);
router.post('/trophies', validate(createTrophySchema), controller.createTrophy);
router.delete('/trophies/:id', validate(byCareerAndIdSchema), controller.deleteTrophy);

router.get('/challenges', validate(byCareerSchema), controller.listChallenges);
router.post('/challenges', validate(createChallengeSchema), controller.createChallenge);
router.patch('/challenges/:id', validate(updateChallengeSchema), controller.updateChallenge);
router.delete('/challenges/:id', validate(byCareerAndIdSchema), controller.deleteChallenge);

router.get('/narrative-tags', validate(byCareerSchema), controller.listNarrativeTags);
router.post('/narrative-tags', validate(createNarrativeTagSchema), controller.createNarrativeTag);
router.delete('/narrative-tags/:id', validate(byCareerAndIdSchema), controller.deleteNarrativeTag);

module.exports = router;
