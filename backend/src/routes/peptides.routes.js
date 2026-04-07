'use strict';

const express = require('express');
const { query, param } = require('express-validator');

const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  listPeptides,
  listCategories,
  findByName,
  getPeptideById,
} = require('../controllers/peptides.controller');

const router = express.Router();

router.get('/', optionalAuth, [
  query('search').optional().trim(),
  query('type').optional().isIn(['single', 'blend']),
  query('category').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
], listPeptides);

router.get('/categories', listCategories);

router.get('/by-name/:name', [
  param('name').trim().notEmpty(),
  validate,
], findByName);

router.get('/:idOrSlug', optionalAuth, [
  param('idOrSlug').trim().notEmpty(),
  validate,
], getPeptideById);

module.exports = router;
