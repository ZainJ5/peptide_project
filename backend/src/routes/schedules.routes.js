'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  listSchedules,
  createSchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  generateSchedule,
  previewSchedule,
  getScheduleCalendar,
  completeScheduleEvent,
} = require('../controllers/schedules.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validate,
], listSchedules);

router.post('/', [
  body('name').trim().optional().isLength({ max: 200 }),
  body('startDate').isISO8601().toDate().withMessage('startDate must be a valid date'),
  body('durationWeeks').isInt({ min: 1, max: 52 }).toInt(),
  body('notes').optional().trim(),
  validate,
], createSchedule);

router.get('/:id', [param('id').isUUID(), validate], getScheduleById);

router.patch('/:id', [
  param('id').isUUID(),
  body('name').optional().trim().isLength({ max: 200 }),
  body('startDate').optional().isISO8601().toDate(),
  body('durationWeeks').optional().isInt({ min: 1, max: 52 }).toInt(),
  body('notes').optional().trim(),
  validate,
], updateSchedule);

router.delete('/:id', [param('id').isUUID(), validate], deleteSchedule);

router.post('/:id/items', [
  param('id').isUUID(),
  body('peptideId').isUUID().withMessage('Valid peptideId required'),
  body('position').isInt({ min: 1, max: 10 }).toInt().withMessage('Position must be 1–10'),
  body('selectedScheduleName').optional().trim(),
  body('isOverridden').optional().isBoolean().toBoolean(),
  body('overrideConfirmed').optional().isBoolean().toBoolean(),
  body('overrideTimeOfDay').optional().isIn(['AM', 'PM', 'BOTH']),
  body('overrideDaysOfWeek').optional().isArray(),
  body('overrideDoseUnits').optional().isFloat({ min: 0 }),
  body('overrideFrequency').optional().trim(),
  body('overrideRestWeeks').optional().isInt({ min: 0 }),
  validate,
], addScheduleItem);

router.patch('/:id/items/:itemId', [
  param('id').isUUID(),
  param('itemId').isUUID(),
  body('isOverridden').optional().isBoolean().toBoolean(),
  body('overrideConfirmed').optional().isBoolean().toBoolean(),
  body('overrideTimeOfDay').optional().isIn(['AM', 'PM', 'BOTH']),
  body('overrideDaysOfWeek').optional().isArray(),
  body('overrideDoseUnits').optional().isFloat({ min: 0 }),
  body('overrideFrequency').optional().trim(),
  body('overrideRestWeeks').optional().isInt({ min: 0 }),
  body('selectedScheduleName').optional().trim(),
  validate,
], updateScheduleItem);

router.delete('/:id/items/:itemId', [
  param('id').isUUID(),
  param('itemId').isUUID(),
  validate,
], deleteScheduleItem);

router.post('/:id/generate', [param('id').isUUID(), validate], generateSchedule);
router.get('/:id/preview', [param('id').isUUID(), validate], previewSchedule);

router.get('/:id/calendar', [
  param('id').isUUID(),
  query('month').optional().matches(/^\d{4}-\d{2}$/),
  validate,
], getScheduleCalendar);

router.patch('/:id/calendar/:eventId/complete', [
  param('id').isUUID(),
  param('eventId').isUUID(),
  body('completed').optional().isBoolean().toBoolean(),
  validate,
], completeScheduleEvent);

module.exports = router;
