'use strict';

/**
 * Frequency Parser
 *
 * Converts the raw injection frequency text from the spreadsheet
 * (e.g. "Inject three times per week") into a structured object
 * the calendar generator works with.
 *
 * Output shape:
 * {
 *   timesPerDay:            number,           // injections per active day (1, 2, or 3)
 *   daysPerWeek:            number,           // how many days per week to inject
 *   pattern:                FrequencyPattern,
 *   requiresNonConsecutive: boolean,          // e.g. Mon/Wed/Fri spacing
 *   raw:                    string            // original text preserved
 * }
 *
 * FrequencyPattern values:
 *   'daily'           → every day
 *   'five_per_week'   → 5 days on, 2 off
 *   'three_per_week'  → 3×/week, non-consecutive
 *   'twice_per_week'  → 2×/week, non-consecutive
 *   'once_per_week'   → 1×/week, fixed day
 *   'twice_daily'     → twice per day, every day
 *   'three_daily'     → three times per day, every day
 *   'consecutive'     → N consecutive days per cycle
 *   'unknown'         → could not parse (falls back to once daily)
 */

/** @typedef {'daily'|'five_per_week'|'three_per_week'|'twice_per_week'|'once_per_week'|'twice_daily'|'three_daily'|'consecutive'|'unknown'} FrequencyPattern */

/**
 * @param {string} raw  Raw frequency text from spreadsheet
 * @returns {{ timesPerDay: number, daysPerWeek: number, pattern: FrequencyPattern, requiresNonConsecutive: boolean, raw: string }}
 */
function parseFrequency(raw) {
  if (!raw) return _unknown(raw);

  const text = raw.toLowerCase().trim();
  const compact = text.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

  if (['daily', 'every day'].includes(compact)) {
    return { timesPerDay: 1, daysPerWeek: 7, pattern: 'daily', requiresNonConsecutive: false, raw };
  }

  if (['weekly', 'once weekly', 'once per week'].includes(compact)) {
    return { timesPerDay: 1, daysPerWeek: 1, pattern: 'once_per_week', requiresNonConsecutive: false, raw };
  }

  if (['twice weekly', 'twice per week', '2x weekly', '2 times per week'].includes(compact)) {
    return { timesPerDay: 1, daysPerWeek: 2, pattern: 'twice_per_week', requiresNonConsecutive: true, raw };
  }

  if (['three times weekly', 'three times per week', '3x weekly', '3 times per week'].includes(compact)) {
    return { timesPerDay: 1, daysPerWeek: 3, pattern: 'three_per_week', requiresNonConsecutive: true, raw };
  }

  // Three times daily
  if (/three times (per day|daily)|3\s*times?\s*(per day|daily)/i.test(text)) {
    return { timesPerDay: 3, daysPerWeek: 7, pattern: 'three_daily', requiresNonConsecutive: false, raw };
  }

  // Once or twice daily → default once (user can override via schedule item)
  if (/once or twice daily|1[–-]2\s*times? (per day|daily)/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 7, pattern: 'daily', requiresNonConsecutive: false, raw };
  }

  // Twice daily
  if (/twice (per day|daily)|2\s*times? (per day|daily)/i.test(text)) {
    return { timesPerDay: 2, daysPerWeek: 7, pattern: 'twice_daily', requiresNonConsecutive: false, raw };
  }

  // Five days per week
  if (/5\s*days?\s*(per|a)\s*week|five\s*days?\s*(per|a)\s*week/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 5, pattern: 'five_per_week', requiresNonConsecutive: false, raw };
  }

  // N consecutive days per cycle
  const consecutiveMatch = text.match(/(\d+)\s*consecutive\s*days?\s*(per\s*cycle)?/i);
  if (consecutiveMatch) {
    return {
      timesPerDay:            1,
      daysPerWeek:            parseInt(consecutiveMatch[1], 10),
      pattern:                'consecutive',
      requiresNonConsecutive: false,
      raw,
    };
  }

  // 2–3 times per week
  if (/2[–\-]3\s*times?\s*(per|a)\s*week/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 3, pattern: 'three_per_week', requiresNonConsecutive: true, raw };
  }

  // Three times per week
  if (/three\s*times?\s*(per|a)\s*week|3\s*times?\s*(per|a|weekly?\b)\s*week?/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 3, pattern: 'three_per_week', requiresNonConsecutive: true, raw };
  }

  // Twice per week
  if (/twice\s*(per|a)?\s*week|2\s*times?\s*(per|a)\s*week/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 2, pattern: 'twice_per_week', requiresNonConsecutive: true, raw };
  }

  // Once per week
  if (/once\s*(per|a)?\s*week|weekly|once weekly/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 1, pattern: 'once_per_week', requiresNonConsecutive: false, raw };
  }

  // Once daily (most common — check last to avoid false positives above)
  if (/once\s*(per day|daily)|inject\s*once\s*daily|once\s*daily|daily/i.test(text)) {
    return { timesPerDay: 1, daysPerWeek: 7, pattern: 'daily', requiresNonConsecutive: false, raw };
  }

  return _unknown(raw);
}

function _unknown(raw) {
  // Graceful fallback — assume once daily so the calendar always generates
  return { timesPerDay: 1, daysPerWeek: 7, pattern: 'unknown', requiresNonConsecutive: false, raw };
}

/**
 * Given a frequency object and a user-chosen start day index (0=Sun…6=Sat),
 * return the sorted array of day-of-week indices on which injections occur.
 *
 * @param {{ daysPerWeek: number, pattern: string }} freq
 * @param {number} [startDayIndex=1]  0=Sun, 1=Mon, …, 6=Sat
 * @returns {number[]}  Sorted array of day indices 0–6
 */
function resolveDaysOfWeek(freq, startDayIndex = 1) {
  const { daysPerWeek } = freq;

  switch (daysPerWeek) {
    case 7: // every day
      return [0, 1, 2, 3, 4, 5, 6];

    case 5: // weekdays Mon–Fri
      return [1, 2, 3, 4, 5];

    case 3: { // Mon / Wed / Fri spread
      const d0 = startDayIndex % 7;
      const d1 = (startDayIndex + 2) % 7;
      const d2 = (startDayIndex + 4) % 7;
      return [d0, d1, d2].sort((a, b) => a - b);
    }

    case 2: { // Mon / Thu spread (3-day gap)
      const d0 = startDayIndex % 7;
      const d1 = (startDayIndex + 3) % 7;
      return [d0, d1].sort((a, b) => a - b);
    }

    case 1: // once a week on the start day
    default:
      return [startDayIndex % 7];
  }
}

module.exports = { parseFrequency, resolveDaysOfWeek };
