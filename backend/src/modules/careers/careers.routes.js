const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./careers.controller');
const { createCareerSchema, updateCareerSchema, careerIdSchema } = require('./careers.validation');

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
router.get('/:id', validate(careerIdSchema), controller.getCareer);
router.patch('/:id', validate(updateCareerSchema), controller.updateCareer);
router.delete('/:id', validate(careerIdSchema), controller.deleteCareer);
router.post('/:id/activate', validate(careerIdSchema), controller.activateCareer);

module.exports = router;
