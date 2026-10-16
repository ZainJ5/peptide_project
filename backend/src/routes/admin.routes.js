'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');

const config = require('../config');
const validate = require('../middleware/validate');
const { authenticateAdmin } = require('../middleware/adminAuth');
const {
  assertStrongPassword, SLUG_RE, isSafeImagePath,
} = require('../utils/adminValidators');
const auth = require('../controllers/admin/auth.controller');
const peptides = require('../controllers/admin/peptides.controller');
const site = require('../controllers/admin/site.controller');
const uploads = require('../controllers/admin/uploads.controller');

const router = express.Router();

// Admin responses are always private and never cached by proxies/browsers.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Generous ceiling for an editor clicking around; login has a stricter one below.
router.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down and try again shortly.' },
}));

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.admin.loginRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
});

/* ── Auth ───────────────────────────────────────────────────────────── */

router.post('/auth/login', loginLimiter, [
  body('username').isString().trim().notEmpty().withMessage('Username is required')
    .isLength({ max: 100 }).withMessage('Username is too long'),
  body('password').isString().notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password is too long'),
  validate,
], auth.login);

router.use(authenticateAdmin);

router.get('/auth/me', auth.me);
router.post('/auth/logout', auth.logout);
router.patch('/auth/password', [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().custom(assertStrongPassword),
  validate,
], auth.changePassword);

/* ── Dashboard ──────────────────────────────────────────────────────── */

router.get('/stats', site.getStats);

/* ── Peptides ───────────────────────────────────────────────────────── */

const optionalText = (field, max) =>
  body(field).optional({ values: 'null' }).isString().withMessage(`${field} must be text`)
    .isLength({ max }).withMessage(`${field} must be at most ${max} characters`);

const stringArray = (field, { maxItems = 50, maxLength = 500 } = {}) => [
  body(field).optional().isArray({ max: maxItems }).withMessage(`${field} must be a list of at most ${maxItems} items`),
  body(`${field}.*`).optional().isString().withMessage(`Each ${field} entry must be text`)
    .isLength({ max: maxLength }).withMessage(`Each ${field} entry must be at most ${maxLength} characters`),
];

const imagePath = (field) =>
  body(field).optional({ values: 'falsy' }).isString().isLength({ max: 500 })
    .custom((value) => {
      if (!isSafeImagePath(value)) throw new Error('Use a site path like /images/singles/file.webp or an https:// URL');
      return true;
    });

const optionalNumber = (field, { min = 0, max = 1_000_000, int = false } = {}) => {
  const chain = body(field).optional({ values: 'null' });
  return int
    ? chain.isInt({ min, max }).withMessage(`${field} must be a whole number between ${min} and ${max}`).toInt()
    : chain.isFloat({ min, max }).withMessage(`${field} must be a number between ${min} and ${max}`).toFloat();
};

function peptideRules({ creating }) {
  const required = (field, label, max) => {
    const chain = body(field);
    return (creating ? chain : chain.optional())
      .isString().withMessage(`${label} must be text`)
      .trim().notEmpty().withMessage(`${label} is required`)
      .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);
  };

  return [
    required('name', 'Name', 200),
    required('protocolTitle', 'Protocol title', 300),
    body('slug').optional({ values: 'falsy' }).isString().trim().toLowerCase()
      .isLength({ max: 300 }).withMessage('Slug must be at most 300 characters')
      .matches(SLUG_RE).withMessage('Slug may only contain lowercase letters, numbers and single hyphens'),
    body('type').optional().isIn(['single', 'blend']).withMessage('Type must be single or blend'),
    optionalText('mgAmount', 50),
    body('reconstitutionMl').optional({ values: 'falsy' })
      .isFloat({ gt: 0, max: 100 }).withMessage('BAC water must be between 0 and 100 mL').toFloat(),
    optionalText('reconstitutionRaw', 200),
    optionalText('howItWorks', 20_000),
    optionalText('injectionFrequencyRaw', 300),
    optionalText('cycleDurationRaw', 500),
    optionalText('preparationNotes', 20_000),
    body('sourceUrl').optional({ values: 'falsy' }).isString().isLength({ max: 500 })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Source URL must be a full http(s) URL'),
    imagePath('imageUrl'),
    imagePath('reconstitutionImageUrl'),
    body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be true or false'),
    ...stringArray('sideEffects'),
    ...stringArray('benefits'),
    ...stringArray('healthCategories', { maxItems: 20, maxLength: 100 }),

    body('dosingSteps').optional().isArray({ max: 200 }).withMessage('dosingSteps must be a list of at most 200 rows'),
    body('dosingSteps.*.scheduleName').if(body('dosingSteps').exists())
      .isString().trim().notEmpty().withMessage('Every dosing row needs a variant name')
      .isLength({ max: 300 }).withMessage('Variant name must be at most 300 characters'),
    body('dosingSteps.*.weekRangeLabel').optional({ values: 'null' }).isString().isLength({ max: 50 })
      .withMessage('Week label must be at most 50 characters'),
    body('dosingSteps.*.dailyDoseLabel').optional({ values: 'null' }).isString().isLength({ max: 100 })
      .withMessage('Dose label must be at most 100 characters'),
    optionalNumber('dosingSteps.*.weekStart', { min: 0, max: 520, int: true }),
    optionalNumber('dosingSteps.*.weekEnd', { min: 0, max: 520, int: true }),
    optionalNumber('dosingSteps.*.dailyDoseMcg', { max: 10_000_000 }),
    optionalNumber('dosingSteps.*.unitsPerInjection', { max: 1000 }),
    optionalNumber('dosingSteps.*.volumeMl', { max: 100 }),
    body('dosingSteps').optional().custom((steps) => {
      steps.forEach((s, i) => {
        if (s.weekStart != null && s.weekEnd != null && Number(s.weekEnd) < Number(s.weekStart)) {
          throw new Error(`Dosing row ${i + 1}: end week can't be before start week`);
        }
      });
      return true;
    }),
    body('variantRenames').optional().isArray({ max: 50 }),
    body('variantRenames.*.from').optional().isString().isLength({ max: 300 }),
    body('variantRenames.*.to').optional().isString().isLength({ max: 300 }),
    body('expectedUpdatedAt').optional({ values: 'falsy' }).isISO8601().withMessage('expectedUpdatedAt must be a timestamp'),
  ];
}

const idParam = param('id').isUUID().withMessage('Invalid id');

router.get('/peptides', [
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('type').optional({ values: 'falsy' }).isIn(['single', 'blend']),
  query('status').optional({ values: 'falsy' }).isIn(['all', 'active', 'inactive']),
  query('category').optional().isString().trim().isLength({ max: 100 }),
  query('sort').optional({ values: 'falsy' }).isIn(['name', 'updated', 'created']),
  query('issue').optional({ values: 'falsy' }).isIn(['missingOverview', 'missingDosing', 'missingCategories', 'missingImage']),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
], peptides.listPeptides);

router.post('/peptides', [...peptideRules({ creating: true }), validate], peptides.createPeptide);
router.get('/peptides/:id', [idParam, validate], peptides.getPeptide);
router.patch('/peptides/:id', [idParam, ...peptideRules({ creating: false }), validate], peptides.updatePeptide);
router.patch('/peptides/:id/status', [
  idParam,
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be true or false'),
  validate,
], peptides.setStatus);
router.post('/peptides/:id/duplicate', [idParam, validate], peptides.duplicatePeptide);
router.delete('/peptides/:id', [idParam, validate], peptides.deletePeptide);

/* ── Image uploads ──────────────────────────────────────────────────── */

const rawImage = express.raw({ type: ['image/*', 'application/octet-stream'], limit: config.uploads.maxBytes });
router.post('/uploads', [
  query('kind').optional().isIn(['protocol', 'reconstitution']).withMessage('kind must be protocol or reconstitution'),
  query('slug').optional().isString().isLength({ max: 300 }),
  validate,
], (req, res, next) => rawImage(req, res, (err) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: `Image is too large. The limit is ${Math.round(config.uploads.maxBytes / 1048576)} MB.` });
  }
  return next(err);
}), uploads.uploadImage);

/* ── Categories ─────────────────────────────────────────────────────── */

const categoryName = (field) =>
  body(field).isString().trim().notEmpty().withMessage('Category name is required')
    .isLength({ max: 100 }).withMessage('Category name must be at most 100 characters');

router.get('/categories', site.listCategories);
router.post('/categories/rename', [categoryName('from'), categoryName('to'), validate], site.renameCategory);
router.post('/categories/delete', [categoryName('name'), validate], site.deleteCategory);

/* ── Users ──────────────────────────────────────────────────────────── */

router.get('/users', [
  query('search').optional().isString().trim().isLength({ max: 100 }),
  query('status').optional({ values: 'falsy' }).isIn(['all', 'active', 'inactive']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
], site.listUsers);

router.patch('/users/:id/status', [
  idParam,
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be true or false'),
  validate,
], site.setUserStatus);

module.exports = router;
