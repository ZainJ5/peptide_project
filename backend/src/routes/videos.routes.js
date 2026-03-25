'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');

const { optionalAuth, authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  listVideos,
  getVideoById,
  createVideo,
} = require('../controllers/videos.controller');

const router = express.Router();

router.get('/', optionalAuth, [
  query('category').optional().isIn(['reconstitution', 'injection', 'peptide_specific', 'general']),
  query('peptideId').optional().isUUID(),
  validate,
], listVideos);

router.get('/:id', [param('id').isUUID(), validate], getVideoById);

router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty(),
  body('videoId').trim().notEmpty(),
  body('platform').optional().isIn(['youtube', 'vimeo']),
  body('category').optional().isIn(['reconstitution', 'injection', 'peptide_specific', 'general']),
  body('peptideId').optional().isUUID(),
  body('description').optional().trim(),
  body('durationSeconds').optional().isInt({ min: 0 }),
  body('sortOrder').optional().isInt({ min: 0 }),
  validate,
], createVideo);

module.exports = router;
