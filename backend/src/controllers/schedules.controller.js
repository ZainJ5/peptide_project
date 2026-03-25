'use strict';

const { Op } = require('sequelize');

const {
  UserSchedule,
  ScheduleItem,
  CalendarEvent,
  Peptide,
  DosingStep,
  sequelize,
} = require('../models');
const { createError } = require('../middleware/errorHandler');
const scheduleEngine = require('../services/scheduleEngine');

async function requireSchedule(scheduleId, userId) {
  const schedule = await UserSchedule.findOne({
    where: { id: scheduleId, userId },
    include: [{
      model: ScheduleItem,
      as: 'items',
      include: [{
        model: Peptide,
        as: 'peptide',
        include: [{ model: DosingStep, as: 'dosingSteps', order: [['step_order', 'ASC']] }],
      }],
    }],
  });

  if (!schedule) throw createError('Schedule not found.', 404);
  return schedule;
}

async function requireScheduleShallow(scheduleId, userId) {
  const schedule = await UserSchedule.findOne({ where: { id: scheduleId, userId } });
  if (!schedule) throw createError('Schedule not found.', 404);
  return schedule;
}

function flattenWithPeptide(value) {
  const json = value && typeof value.toJSON === 'function' ? value.toJSON() : { ...value };
  const { peptide, ...rest } = json;

  return {
    ...rest,
    peptideName: peptide?.name ?? null,
    peptideMgAmount: peptide?.mgAmount ?? null,
  };
}

function serializeSchedule(schedule) {
  const json = schedule && typeof schedule.toJSON === 'function' ? schedule.toJSON() : { ...schedule };
  return { ...json, items: (json.items || []).map(flattenWithPeptide) };
}

async function listSchedules(req, res, next) {
  try {
    const limit = req.query.limit ?? 20;
    const offset = req.query.offset ?? 0;

    const { count, rows } = await UserSchedule.findAndCountAll({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']],
      include: [{ model: ScheduleItem, as: 'items', attributes: ['id', 'scheduleId', 'position', 'peptideId'] }],
      limit,
      offset,
      distinct: true,
    });

    return res.json({ success: true, total: count, limit, offset, data: rows });
  } catch (err) {
    next(err);
  }
}

async function createSchedule(req, res, next) {
  try {
    const { name, startDate, durationWeeks, notes } = req.body;

    const schedule = await UserSchedule.create({
      userId: req.user.id,
      name: name || 'My Peptide Schedule',
      startDate,
      durationWeeks,
      notes: notes || null,
      isGenerated: false,
    });

    return res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
}

async function getScheduleById(req, res, next) {
  try {
    const schedule = await requireSchedule(req.params.id, req.user.id);
    return res.json({ success: true, data: serializeSchedule(schedule) });
  } catch (err) {
    next(err);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const schedule = await requireScheduleShallow(req.params.id, req.user.id);
    const { name, startDate, durationWeeks, notes } = req.body;

    await schedule.update({
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && { startDate }),
      ...(durationWeeks !== undefined && { durationWeeks }),
      ...(notes !== undefined && { notes }),
      isGenerated: false,
    });

    return res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const deleted = await UserSchedule.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) throw createError('Schedule not found.', 404);

    return res.json({ success: true, message: 'Schedule deleted.' });
  } catch (err) {
    next(err);
  }
}

async function addScheduleItem(req, res, next) {
  try {
    const schedule = await requireScheduleShallow(req.params.id, req.user.id);

    const {
      peptideId,
      position,
      selectedScheduleName,
      isOverridden,
      overrideConfirmed,
      overrideTimeOfDay,
      overrideDaysOfWeek,
      overrideDoseUnits,
      overrideFrequency,
      overrideRestWeeks,
    } = req.body;

    if (isOverridden && !overrideConfirmed) {
      throw createError('You must confirm (overrideConfirmed: true) that overriding disables the escalation dosing schedule.', 400);
    }

    const peptide = await Peptide.findByPk(peptideId);
    if (!peptide) throw createError('Peptide not found.', 404);

    const item = await sequelize.transaction(async (transaction) => {
      const newItem = await ScheduleItem.create({
        scheduleId: schedule.id,
        peptideId,
        position,
        selectedScheduleName: selectedScheduleName || null,
        isOverridden: isOverridden || false,
        overrideTimeOfDay: isOverridden ? overrideTimeOfDay || null : null,
        overrideDaysOfWeek: isOverridden ? overrideDaysOfWeek || null : null,
        overrideDoseUnits: isOverridden ? (overrideDoseUnits ?? null) : null,
        overrideFrequency: isOverridden ? overrideFrequency || null : null,
        overrideRestWeeks: overrideRestWeeks ?? null,
      }, { transaction });

      await schedule.update({ isGenerated: false }, { transaction });
      return newItem;
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function updateScheduleItem(req, res, next) {
  try {
    const schedule = await requireScheduleShallow(req.params.id, req.user.id);

    const item = await ScheduleItem.findOne({ where: { id: req.params.itemId, scheduleId: schedule.id } });
    if (!item) throw createError('Schedule item not found.', 404);

    const { isOverridden, overrideConfirmed } = req.body;

    if (isOverridden && !overrideConfirmed) {
      throw createError('Confirm override acknowledgement (overrideConfirmed: true).', 400);
    }

    const allowedFields = [
      'selectedScheduleName',
      'overrideTimeOfDay',
      'overrideDaysOfWeek',
      'overrideDoseUnits',
      'overrideFrequency',
      'overrideRestWeeks',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (isOverridden !== undefined) updates.isOverridden = isOverridden;

    await sequelize.transaction(async (transaction) => {
      await item.update(updates, { transaction });
      await schedule.update({ isGenerated: false }, { transaction });
    });

    return res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function deleteScheduleItem(req, res, next) {
  try {
    const schedule = await requireScheduleShallow(req.params.id, req.user.id);

    await sequelize.transaction(async (transaction) => {
      const deleted = await ScheduleItem.destroy({
        where: { id: req.params.itemId, scheduleId: schedule.id },
        transaction,
      });

      if (!deleted) throw createError('Item not found.', 404);
      await schedule.update({ isGenerated: false }, { transaction });
    });

    return res.json({ success: true, message: 'Item removed.' });
  } catch (err) {
    next(err);
  }
}

async function generateSchedule(req, res, next) {
  try {
    req.extendTimeout?.(120_000);

    const schedule = await requireSchedule(req.params.id, req.user.id);

    if (!schedule.items || schedule.items.length === 0) {
      throw createError('Add at least one peptide to the schedule before generating.', 400);
    }

    const count = await scheduleEngine.buildAndSave(schedule, sequelize);

    return res.json({
      success: true,
      message: `Schedule generated. ${count} injection events created.`,
      eventCount: count,
    });
  } catch (err) {
    next(err);
  }
}

async function previewSchedule(req, res, next) {
  try {
    const schedule = await requireSchedule(req.params.id, req.user.id);
    const { grouped } = scheduleEngine.preview(schedule);

    return res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
}

async function getScheduleCalendar(req, res, next) {
  try {
    const schedule = await requireScheduleShallow(req.params.id, req.user.id);

    if (!schedule.isGenerated) {
      throw createError('Schedule has not been generated yet. Call POST /generate first.', 409);
    }

    const where = { scheduleId: schedule.id };
    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      where.eventDate = {
        [Op.between]: [
          `${req.query.month}-01`,
          `${req.query.month}-${String(lastDay).padStart(2, '0')}`,
        ],
      };
    }

    const events = await CalendarEvent.findAll({
      where,
      include: [{ model: Peptide, as: 'peptide', attributes: ['id', 'name', 'mgAmount'] }],
      order: [['event_date', 'ASC']],
    });

    const grouped = scheduleEngine.groupEventsByMonth(events.map((event) => flattenWithPeptide(event)));

    return res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
}

async function completeScheduleEvent(req, res, next) {
  try {
    const event = await CalendarEvent.findOne({
      where: { id: req.params.eventId, scheduleId: req.params.id },
      include: [{ model: UserSchedule, as: 'schedule', where: { userId: req.user.id } }],
    });

    if (!event) throw createError('Event not found.', 404);

    const completed = req.body.completed ?? true;
    await event.update({
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    });

    return res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
