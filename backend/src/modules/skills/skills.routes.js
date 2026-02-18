const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./skills.controller');
const {
  byCareerSchema,
  byCareerAndIdSchema,
  createSkillSpendSchema,
  createAttributeTargetSchema,
  updateAttributeTargetSchema,
  upsertArchetypeStageSchema,
  createTrainingLogSchema,
} = require('./skills.validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Skill progression resources
 */

router.use(requireAuth);

router.get('/skill-spends', validate(byCareerSchema), controller.listSkillSpends);
router.post('/skill-spends', validate(createSkillSpendSchema), controller.createSkillSpend);
router.delete('/skill-spends/:id', validate(byCareerAndIdSchema), controller.deleteSkillSpend);

router.get('/attribute-targets', validate(byCareerSchema), controller.listAttributeTargets);
router.post('/attribute-targets', validate(createAttributeTargetSchema), controller.createAttributeTarget);
router.patch('/attribute-targets/:id', validate(updateAttributeTargetSchema), controller.updateAttributeTarget);
router.delete('/attribute-targets/:id', validate(byCareerAndIdSchema), controller.deleteAttributeTarget);

router.get('/archetype-stage', validate(byCareerSchema), controller.getArchetypeStage);
router.put('/archetype-stage', validate(upsertArchetypeStageSchema), controller.putArchetypeStage);

router.get('/training-logs', validate(byCareerSchema), controller.listTrainingLogs);
router.post('/training-logs', validate(createTrainingLogSchema), controller.createTrainingLog);
router.delete('/training-logs/:id', validate(byCareerAndIdSchema), controller.deleteTrainingLog);

module.exports = router;
