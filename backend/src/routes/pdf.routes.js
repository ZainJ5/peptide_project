'use strict';

const express = require('express');
const { param, query } = require('express-validator');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getSchedulePdf } = require('../controllers/pdf.controller');

const router = express.Router();

router.use(authenticate);

router.get('/schedules/:id', [
  param('id').isUUID(),
  query('months').optional(),
  validate,
], getSchedulePdf);

module.exports = router;
