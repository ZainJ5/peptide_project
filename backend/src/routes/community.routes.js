'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');

const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  upvotePost,
  flagPost,
  requestPeptide,
} = require('../controllers/community.controller');

const router = express.Router();

router.get('/', optionalAuth, [
  query('peptideId').optional().isUUID(),
  query('peptideName').optional().trim(),
  query('authorId').optional().isUUID(),
  query('benefit').optional().trim(),
  query('sideEffect').optional().trim(),
  query('search').optional().trim().isLength({ max: 200 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
], listPosts);

router.post('/request-peptide', authenticate, [
  body('peptideName').trim().isLength({ min: 2, max: 120 }).withMessage('Peptide name: 2–120 characters'),
  body('goal').trim().isLength({ min: 5, max: 300 }).withMessage('Goal: 5–300 characters'),
  body('details').trim().isLength({ min: 10, max: 5000 }).withMessage('Details: 10–5000 characters'),
  validate,
], requestPeptide);

router.post('/', authenticate, [
  body('peptideId').isUUID().withMessage('Valid peptideId required'),
  body('title').trim().isLength({ min: 5, max: 300 }).withMessage('Title: 5–300 characters'),
  body('content').trim().isLength({ min: 10, max: 10000 }).withMessage('Content: 10–10,000 characters'),
  body('doseUsed').optional().trim().isLength({ max: 100 }),
  body('durationUsed').optional().trim().isLength({ max: 100 }),
  body('benefitsTags').optional().isArray(),
  body('benefitsTags.*').optional().trim().toLowerCase(),
  body('sideEffectsTags').optional().isArray(),
  body('sideEffectsTags.*').optional().trim().toLowerCase(),
  validate,
], createPost);

router.patch('/:id', authenticate, [
  param('id').isUUID(),
  body('title').optional().trim().isLength({ min: 5, max: 300 }),
  body('content').optional().trim().isLength({ min: 10, max: 10000 }),
  body('doseUsed').optional().trim(),
  body('durationUsed').optional().trim(),
  body('benefitsTags').optional().isArray(),
  body('sideEffectsTags').optional().isArray(),
  validate,
], updatePost);

router.get('/:id', optionalAuth, [param('id').isUUID(), validate], getPostById);

router.delete('/:id', authenticate, [param('id').isUUID(), validate], deletePost);
router.post('/:id/upvote', authenticate, [param('id').isUUID(), validate], upvotePost);
router.post('/:id/flag', authenticate, [param('id').isUUID(), validate], flagPost);

module.exports = router;
