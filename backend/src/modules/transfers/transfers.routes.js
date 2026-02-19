const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./transfers.controller');
const {
  byCareerSchema,
  byCareerAndIdSchema,
  createOfferSchema,
  updateOfferSchema,
  createContractSchema,
  updateContractSchema,
  createAgentNoteSchema,
} = require('./transfers.validation');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Transfers
 *   description: Transfer and contract tracking
 */

router.use(requireAuth);

router.get('/offers', validate(byCareerSchema), controller.listOffers);
router.post('/offers', validate(createOfferSchema), controller.createOffer);
router.patch('/offers/:id', validate(updateOfferSchema), controller.updateOffer);
router.delete('/offers/:id', validate(byCareerAndIdSchema), controller.deleteOffer);

router.get('/contracts', validate(byCareerSchema), controller.listContracts);
router.post('/contracts', validate(createContractSchema), controller.createContract);
router.patch('/contracts/:id', validate(updateContractSchema), controller.updateContract);
router.delete('/contracts/:id', validate(byCareerAndIdSchema), controller.deleteContract);

router.get('/agent-notes', validate(byCareerSchema), controller.listAgentNotes);
router.post('/agent-notes', validate(createAgentNoteSchema), controller.createAgentNote);
router.delete('/agent-notes/:id', validate(byCareerAndIdSchema), controller.deleteAgentNote);

module.exports = router;
