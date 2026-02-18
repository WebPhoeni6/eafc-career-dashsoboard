const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./users.controller');
const { updateMeSchema } = require('./users.validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account endpoints
 */

router.use(requireAuth);
router.get('/me', controller.getMe);
router.patch('/me', validate(updateMeSchema), controller.updateMe);
router.delete('/me', controller.deleteMe);

module.exports = router;
