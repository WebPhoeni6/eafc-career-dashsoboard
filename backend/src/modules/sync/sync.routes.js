const express = require('express');
const { requireAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const controller = require('./sync.controller');
const { importSchema, exportSchema } = require('./sync.validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: Import/export compatibility endpoints
 */

router.use(requireAuth);
router.post('/import', validate(importSchema), controller.importCareer);
router.get('/export/:careerId', validate(exportSchema), controller.exportCareer);

module.exports = router;
