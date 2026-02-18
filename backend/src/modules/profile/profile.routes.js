const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./profile.controller');
const {
  byCareerSchema,
  byCareerAndIdSchema,
  createInjurySchema,
  updateInjurySchema,
  createSuspensionSchema,
  createPressNoteSchema,
  unlockAchievementSchema,
  updateAchievementSchema,
} = require('./profile.validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Player profile records
 */

router.use(requireAuth);

router.get('/injuries', validate(byCareerSchema), controller.listInjuries);
router.post('/injuries', validate(createInjurySchema), controller.createInjury);
router.patch('/injuries/:id', validate(updateInjurySchema), controller.updateInjury);
router.delete('/injuries/:id', validate(byCareerAndIdSchema), controller.deleteInjury);

router.get('/suspensions', validate(byCareerSchema), controller.listSuspensions);
router.post('/suspensions', validate(createSuspensionSchema), controller.createSuspension);
router.delete('/suspensions/:id', validate(byCareerAndIdSchema), controller.deleteSuspension);

router.get('/press-notes', validate(byCareerSchema), controller.listPressNotes);
router.post('/press-notes', validate(createPressNoteSchema), controller.createPressNote);
router.delete('/press-notes/:id', validate(byCareerAndIdSchema), controller.deletePressNote);

router.get('/achievements', validate(byCareerSchema), controller.listAchievements);
router.post('/achievements', validate(unlockAchievementSchema), controller.unlockAchievement);
router.patch('/achievements/:id', validate(updateAchievementSchema), controller.updateAchievement);

module.exports = router;
