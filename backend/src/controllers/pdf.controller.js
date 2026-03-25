'use strict';

const { UserSchedule, ScheduleItem, CalendarEvent, Peptide } = require('../models');
const { createError } = require('../middleware/errorHandler');
const { generateCalendarPdf } = require('../services/pdfGenerator');
const scheduleEngine = require('../services/scheduleEngine');
const logger = require('../utils/logger');

async function getSchedulePdf(req, res, next) {
  try {
    req.extendTimeout?.(120_000);

    const schedule = await UserSchedule.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{
        model: ScheduleItem,
        as: 'items',
        include: [{ model: Peptide, as: 'peptide', attributes: ['id', 'name', 'mgAmount'] }],
      }],
    });

    if (!schedule) throw createError('Schedule not found.', 404);

    if (!schedule.isGenerated) {
      throw createError('Schedule must be generated before downloading PDF. Call POST /schedules/:id/generate first.', 409);
    }

    const events = await CalendarEvent.findAll({
      where: { scheduleId: schedule.id },
      include: [{ model: Peptide, as: 'peptide', attributes: ['id', 'name', 'mgAmount'] }],
      order: [['event_date', 'ASC']],
    });

    const groupedEvents = scheduleEngine.groupEventsByMonth(events.map((event) => event.toJSON()));

    const months = req.query.months
      ? req.query.months.split(',').map((month) => month.trim())
      : undefined;

    const userName = `${req.user.firstName} ${req.user.lastName || ''}`.trim();

    const doc = generateCalendarPdf({
      groupedEvents,
      scheduleName: schedule.name,
      userName,
      months,
    });

    doc.on('error', (err) => {
      logger.error('PDF stream error', {
        requestId: req.requestId,
        scheduleId: req.params.id,
        message: err.message,
      });
      if (!res.headersSent) {
        next(createError('Failed to generate PDF.', 500));
      }
    });

    const filename = `peptide-schedule-${schedule.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getSchedulePdf };
