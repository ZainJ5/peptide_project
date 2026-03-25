'use strict';

const dayjs     = require('dayjs');
const isoWeek   = require('dayjs/plugin/isoWeek');
const dayOfYear = require('dayjs/plugin/dayOfYear');
dayjs.extend(isoWeek);
dayjs.extend(dayOfYear);

const { parseFrequency, resolveDaysOfWeek } = require('./frequencyParser');
const { parseCycleDuration }                = require('./cycleParser');
const { buildEscalationTimeline }           = require('./escalationBuilder');

/**
 * Calendar Generator
 *
 * Core orchestration of the schedule engine.
 *
 * Takes a fully assembled ScheduleItem (with its Peptide and DosingSteps
 * loaded) and a schedule start date, and produces an array of CalendarEvent
 * plain objects ready to bulk-insert into the database.
 *
 * Handles:
 *  ✓ Escalation dosing (dose changes per week)
 *  ✓ Frequency patterns (daily, 3×/week, weekly, etc.)
 *  ✓ Preferred days of week (user override or auto-spread)
 *  ✓ Time of day (AM / PM / BOTH)
 *  ✓ Rest periods between cycles
 *  ✓ Flat-dose overrides (bypasses escalation)
 *  ✓ Multiple cycles within a schedule duration
 */

// Day index constants (0 = Sunday, matching JS Date / dayjs)
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Generate all CalendarEvent records for one ScheduleItem.
 *
 * @param {object} params
 * @param {object} params.scheduleItem   ScheduleItem with .peptide and .peptide.dosingSteps loaded
 * @param {string} params.scheduleId     UUID of the parent UserSchedule
 * @param {string} params.startDate      ISO date string "YYYY-MM-DD"
 * @param {number} params.durationWeeks  Total weeks to generate events for
 * @returns {object[]}  CalendarEvent plain objects (not saved — caller bulk-inserts)
 */
function generateEventsForItem({ scheduleItem, scheduleId, startDate, durationWeeks }) {
  const peptide  = scheduleItem.peptide;
  const freqRaw  = (scheduleItem.isOverridden && scheduleItem.overrideFrequency)
    ? String(scheduleItem.overrideFrequency).replace(/[_-]+/g, ' ')
    : (peptide.injectionFrequencyRaw || '');
  const cycleRaw = peptide.cycleDurationRaw      || '';

  const freq  = parseFrequency(freqRaw);
  const cycle = parseCycleDuration(cycleRaw);

  // ─── Resolve active days of week ────────────────────────────────────────
  let activeDayIndices;

  if (scheduleItem.isOverridden && scheduleItem.overrideDaysOfWeek?.length > 0) {
    activeDayIndices = scheduleItem.overrideDaysOfWeek
      .map((d) => DAY_NAMES.indexOf(d.toUpperCase()))
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);
  } else {
    const startDayIdx = dayjs(startDate).day();
    activeDayIndices  = resolveDaysOfWeek(freq, startDayIdx);
  }

  // ─── Build escalation timeline ───────────────────────────────────────────
  const dosingSteps    = peptide.dosingSteps || [];
  const selectedVariant = scheduleItem.selectedScheduleName;
  const relevantSteps  = selectedVariant
    ? dosingSteps.filter((s) => s.scheduleName === selectedVariant)
    : dosingSteps;

  const timeline = buildEscalationTimeline(
    [...relevantSteps].sort((a, b) => a.stepOrder - b.stepOrder)
  );

  // ─── Resolve active / rest week counts ──────────────────────────────────
  const activeWeeks = scheduleItem.isOverridden
    ? durationWeeks
    : Math.min(cycle.activeWeeks || 8, durationWeeks);

  const restWeeks = scheduleItem.isOverridden
    ? (scheduleItem.overrideRestWeeks ?? 0)
    : (cycle.restWeeks ?? 0);

  const totalCycleWeeks = activeWeeks + restWeeks;

  // ─── Flat-dose override ─────────────────────────────────────────────────
  const useOverrideDose = scheduleItem.isOverridden && scheduleItem.overrideDoseUnits != null;
  const flatDoseUnits   = useOverrideDose ? scheduleItem.overrideDoseUnits : null;

  // ─── Time of day ────────────────────────────────────────────────────────
  const timeOfDay = (scheduleItem.isOverridden && scheduleItem.overrideTimeOfDay)
    ? scheduleItem.overrideTimeOfDay
    : 'AM';

  // ─── Generate events day by day ─────────────────────────────────────────
  const events    = [];
  const start     = dayjs(startDate);
  const totalDays = durationWeeks * 7;

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate  = start.add(dayOffset, 'day');
    const dayOfWeekIdx = currentDate.day();

    const overallWeek  = Math.floor(dayOffset / 7) + 1;
    const weekInCycle  = totalCycleWeeks > 0
      ? ((overallWeek - 1) % totalCycleWeeks) + 1
      : overallWeek;

    const isRestWeek = restWeeks > 0 && weekInCycle > activeWeeks;

    if (isRestWeek) {
      // Emit a single rest marker per week on the first injection day of that week
      const anchorDay = activeDayIndices[0] ?? 1;
      if (currentDate.day() === anchorDay) {
        events.push(_buildEvent({
          scheduleId,
          scheduleItemId: scheduleItem.id,
          peptideId:      peptide.id,
          eventDate:      currentDate.format('YYYY-MM-DD'),
          timeOfDay,
          doseUnits:      0,
          doseLabel:      'Rest period',
          escalationStep: null,
          isRestDay:      true,
        }));
      }
      continue;
    }

    if (!activeDayIndices.includes(dayOfWeekIdx)) continue;

    // Consecutive-days model: only inject on the first N days of the active phase.
    // Use activeWeeks (not totalCycleWeeks) as the modulo window — rest weeks are
    // already excluded above via the isRestWeek check, so we only need to count
    // position within the active phase of the current cycle.
    if (freq.pattern === 'consecutive') {
      const dayInActiveCycle = ((dayOffset) % (activeWeeks * 7)) + 1;
      if (dayInActiveCycle > (cycle.consecutiveDays ?? activeWeeks * 7)) continue;
    }

    const escalationEntry = useOverrideDose ? null : timeline.getForWeek(weekInCycle);

    const doseUnits = useOverrideDose
      ? flatDoseUnits
      : (escalationEntry?.units ?? 0);

    const doseLabel = useOverrideDose
      ? `${flatDoseUnits} units (override)`
      : (escalationEntry?.label ?? '');

    const escalationStep = useOverrideDose
      ? null
      : (escalationEntry?.step ?? null);

    const injectionTimes = _resolveInjectionTimes(timeOfDay, freq.timesPerDay);

    for (const tod of injectionTimes) {
      events.push(_buildEvent({
        scheduleId,
        scheduleItemId: scheduleItem.id,
        peptideId:      peptide.id,
        eventDate:      currentDate.format('YYYY-MM-DD'),
        timeOfDay:      tod,
        doseUnits,
        doseLabel,
        escalationStep,
        isRestDay: false,
      }));
    }
  }

  return events;
}

/**
 * Generate all CalendarEvent records for an entire UserSchedule.
 *
 * @param {object} params
 * @param {object} params.userSchedule  UserSchedule instance with .items loaded
 * @returns {object[]}  Flat, date-sorted array of CalendarEvent plain objects
 */
function generateSchedule({ userSchedule }) {
  const allEvents = [];

  for (const item of userSchedule.items || []) {
    allEvents.push(...generateEventsForItem({
      scheduleItem:  item,
      scheduleId:    userSchedule.id,
      startDate:     userSchedule.startDate,
      durationWeeks: userSchedule.durationWeeks,
    }));
  }

  allEvents.sort((a, b) => (a.eventDate < b.eventDate ? -1 : a.eventDate > b.eventDate ? 1 : 0));

  return allEvents;
}

/**
 * Group a flat array of CalendarEvent objects into a nested month → day structure
 * suitable for the Flutter calendar widget.
 *
 * @param {object[]} events  CalendarEvent plain objects with an eventDate field
 * @returns {object}  { "2026-03": { "2026-03-01": [...events], ... }, ... }
 */
function groupEventsByMonth(events) {
  const grouped = {};

  for (const evt of events) {
    const month = evt.eventDate.slice(0, 7); // "YYYY-MM"
    if (!grouped[month])          grouped[month] = {};
    if (!grouped[month][evt.eventDate]) grouped[month][evt.eventDate] = [];
    grouped[month][evt.eventDate].push(evt);
  }

  return grouped;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _buildEvent({
  scheduleId, scheduleItemId, peptideId, eventDate,
  timeOfDay, doseUnits, doseLabel, escalationStep, isRestDay,
}) {
  return {
    scheduleId,
    scheduleItemId,
    peptideId,
    eventDate,
    timeOfDay,
    doseUnits,
    doseLabel,
    escalationStep,
    isRestDay,
    isCompleted: false,
    completedAt: null,
  };
}

function _resolveInjectionTimes(timeOfDay, timesPerDay) {
  if (timesPerDay >= 3)      return ['AM', 'MIDDAY', 'PM'];
  if (timesPerDay === 2)     return ['AM', 'PM'];
  if (timeOfDay === 'BOTH')  return ['AM', 'PM'];
  return [timeOfDay || 'AM'];
}

module.exports = { generateSchedule, generateEventsForItem, groupEventsByMonth };
