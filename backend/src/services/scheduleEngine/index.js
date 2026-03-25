'use strict';

/**
 * Schedule Engine — Public API
 *
 * Single entry point for all schedule generation.
 * Import this in route handlers; do not import sub-modules directly.
 *
 * Usage:
 *   const scheduleEngine = require('../services/scheduleEngine');
 *
 *   // Generate and persist all calendar events for a schedule (transactional)
 *   await scheduleEngine.buildAndSave(userSchedule, sequelize);
 *
 *   // Preview events without saving (dry-run / preview endpoint)
 *   const { grouped } = scheduleEngine.preview(userSchedule);
 */

const { generateSchedule, groupEventsByMonth } = require('./calendarGenerator');
const { parseFrequency }                       = require('./frequencyParser');
const { parseCycleDuration }                   = require('./cycleParser');
const { buildEscalationTimeline, parseWeekRange } = require('./escalationBuilder');
const { CalendarEvent, UserSchedule }          = require('../../models');

// Maximum rows per bulk insert to avoid hitting PostgreSQL's parameter limit.
const BULK_INSERT_CHUNK_SIZE = 500;

/**
 * Build calendar events and bulk-insert them inside a single database transaction.
 *
 * The delete + insert + flag-update are atomic: if any step fails the entire
 * operation is rolled back, leaving the schedule in its previous valid state.
 * Callers do not need to handle partial-write cleanup.
 *
 * @param {object}    userSchedule  UserSchedule instance — must include:
 *   - userSchedule.items[]              (ScheduleItem instances)
 *   - each item.peptide                 (Peptide instance)
 *   - each item.peptide.dosingSteps[]   (DosingStep instances)
 * @param {object}    sequelize     Sequelize instance (from models/index.js)
 * @returns {Promise<number>}  Number of events created
 */
async function buildAndSave(userSchedule, sequelize) {
  const events = generateSchedule({ userSchedule });

  await sequelize.transaction(async (t) => {
    // Remove previous generation — inside transaction so if re-insert fails
    // the old events are restored by rollback.
    await CalendarEvent.destroy({
      where:       { scheduleId: userSchedule.id },
      transaction: t,
    });

    // Bulk-insert in chunks to stay within PostgreSQL's 65,535 parameter limit.
    for (let i = 0; i < events.length; i += BULK_INSERT_CHUNK_SIZE) {
      await CalendarEvent.bulkCreate(
        events.slice(i, i + BULK_INSERT_CHUNK_SIZE),
        { transaction: t }
      );
    }

    await UserSchedule.update(
      { isGenerated: true },
      { where: { id: userSchedule.id }, transaction: t }
    );
  });

  return events.length;
}

/**
 * Generate a preview of events without persisting to the database.
 *
 * @param {object} userSchedule  Same shape requirements as buildAndSave
 * @returns {{ events: object[], grouped: object }}
 */
function preview(userSchedule) {
  const events  = generateSchedule({ userSchedule });
  const grouped = groupEventsByMonth(events);
  return { events, grouped };
}

/**
 * Utility: get the escalation summary for a single peptide.
 * Used by the peptide detail screen to show the dosing table.
 *
 * @param {object[]} dosingSteps   Array of DosingStep instances
 * @param {string}   [scheduleName]  Optional filter by variant name
 * @returns {{ steps: object[], maxDefinedWeek: number }}
 */
function getEscalationSummary(dosingSteps, scheduleName) {
  const filtered = scheduleName
    ? dosingSteps.filter((s) => s.scheduleName === scheduleName)
    : dosingSteps;

  const ordered  = [...filtered].sort((a, b) => a.stepOrder - b.stepOrder);
  const timeline = buildEscalationTimeline(ordered);

  return { steps: timeline.steps, maxDefinedWeek: timeline.maxDefinedWeek };
}

module.exports = {
  buildAndSave,
  preview,
  getEscalationSummary,
  // Export parsers for seed script and tests
  parseFrequency,
  parseCycleDuration,
  parseWeekRange,
  buildEscalationTimeline,
  groupEventsByMonth,
};
