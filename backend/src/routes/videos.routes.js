'use strict';

const express = require('express');
const { param, query } = require('express-validator');

const validate = require('../middleware/validate');
const { listVideos, getVideoById } = require('../controllers/videos.controller');

const router = express.Router();

// GET /api/videos?category=peptide_guide  → full video library (single source of truth)
router.get('/', [
  query('category').optional().isString().trim(),
  validate,
], listVideos);

// GET /api/videos/:id  → one video by its slug id (e.g. "mots-c")
router.get('/:id', [
  param('id').isString().trim().notEmpty(),
  validate,
], getVideoById);

module.exports = router;
