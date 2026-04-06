'use strict';

/**
 * Cycle / Duration Parser
 *
 * Converts the raw cycle/protocol duration text from the spreadsheet
 * into a structured object describing:
 *   - How many weeks the active injection phase lasts
 *   - How many weeks the rest period lasts before the next cycle
 *   - Whether the peptide uses a consecutive-days-on model
 *
 * Output shape:
 * {
 *   activeWeeks:        number,  // default active phase in weeks
 *   minWeeks:           number,
 *   maxWeeks:           number,  // 0 = indefinite
 *   restWeeks:          number,  // 0 = no rest
 *   isConsecutiveDays:  boolean,
 *   consecutiveDays:    number,  // only used when isConsecutiveDays = true
 *   raw:                string
 * }
 */

/**
 * @param {string} raw  Raw cycle/duration text from spreadsheet
 * @returns {{ activeWeeks: number, minWeeks: number, maxWeeks: number, restWeeks: number, isConsecutiveDays: boolean, consecutiveDays: number, raw: string }}
 */
function parseCycleDuration(raw) {
  if (!raw) return _default(raw);

  const text = raw.toLowerCase().trim();

  // ─── Consecutive days model ───────────────────────────────────────────
  // e.g. "20 consecutive days on, then 4–6 months off"
  const consecutiveMatch = text.match(/(\d+)\s*consecutive\s*days/i);
  if (consecutiveMatch) {
    const days = parseInt(consecutiveMatch[1], 10);
    const restMonthsMatch = text.match(/(\d+)[–\-](\d+)\s*months?\s*off/i);
    const restWeeks = restMonthsMatch
      ? Math.round(parseInt(restMonthsMatch[1], 10) * 4.33)
      : 16; // default ~4 months
    return {
      activeWeeks: Math.ceil(days / 7),
      minWeeks:    Math.ceil(days / 7),
      maxWeeks:    Math.ceil(days / 7),
      restWeeks,
      isConsecutiveDays: true,
      consecutiveDays:   days,
      raw,
    };
  }

  // ─── "X–Y weeks; optional Z-week break" ──────────────────────────────
  // e.g. "8–12 weeks; optional 4-week break between cycles"
  const breakMatch = text.match(/(\d+)[–\-](\d+)\s*weeks?;?\s*(?:optional\s+)?(\d+)[–\-]?(\d+)?\s*[–\-]?\s*week\s*(?:break|off|between)/i);
  if (breakMatch) {
    return {
      activeWeeks: parseInt(breakMatch[1], 10),
      minWeeks:    parseInt(breakMatch[1], 10),
      maxWeeks:    parseInt(breakMatch[2], 10),
      restWeeks:   parseInt(breakMatch[3], 10),
      isConsecutiveDays: false,
      consecutiveDays:   0,
      raw,
    };
  }

  // ─── "X–Y months off" phrasing ────────────────────────────────────────
  // e.g. "8–12 weeks; take 2–4 months off before repeating"
  const monthBreakMatch = text.match(/(\d+)[–\-](\d+)\s*weeks?.*?(\d+)[–\-]?(\d+)?\s*months?\s*off/i);
  if (monthBreakMatch) {
    return {
      activeWeeks: parseInt(monthBreakMatch[1], 10),
      minWeeks:    parseInt(monthBreakMatch[1], 10),
      maxWeeks:    parseInt(monthBreakMatch[2], 10),
      restWeeks:   Math.round(parseInt(monthBreakMatch[3], 10) * 4.33),
      isConsecutiveDays: false,
      consecutiveDays:   0,
      raw,
    };
  }

  // ─── "X–Y weeks; take Z–W weeks off" ─────────────────────────────────
  const weekBreakMatch = text.match(/(\d+)[–\-](\d+)\s*weeks?.*?take\s+(\d+)[–\-](\d+)\s*weeks?\s*off/i);
  if (weekBreakMatch) {
    return {
      activeWeeks: parseInt(weekBreakMatch[1], 10),
      minWeeks:    parseInt(weekBreakMatch[1], 10),
      maxWeeks:    parseInt(weekBreakMatch[2], 10),
      restWeeks:   parseInt(weekBreakMatch[3], 10),
      isConsecutiveDays: false,
      consecutiveDays:   0,
      raw,
    };
  }

  // ─── Simple "X–Y weeks" (no rest mentioned) ───────────────────────────
  // NOTE: This intentionally comes after all patterns that also contain a
  // week range — e.g. "8–12 weeks (or longer)" matches here correctly.
  // The previously separate "weeklyMatch" branch was dead code because this
  // regex already matches any string containing a week range.
  // Default rest = 4 weeks (1 month cycle-off) — standard peptide protocol.
  // The \+? allows "16–20+ weeks" style open-ended ranges.
  const simpleRangeMatch = text.match(/(\d+)[–\-](\d+)\+?\s*weeks?/i);
  if (simpleRangeMatch) {
    return {
      activeWeeks: parseInt(simpleRangeMatch[1], 10),
      minWeeks:    parseInt(simpleRangeMatch[1], 10),
      maxWeeks:    parseInt(simpleRangeMatch[2], 10),
      restWeeks:   4,
      isConsecutiveDays: false,
      consecutiveDays:   0,
      raw,
    };
  }

  // ─── Single week value ─────────────────────────────────────────────────
  // Default rest = 4 weeks (1 month cycle-off) — standard peptide protocol.
  const singleWeekMatch = text.match(/(\d+)\s*weeks?/i);
  if (singleWeekMatch) {
    const w = parseInt(singleWeekMatch[1], 10);
    return {
      activeWeeks: w,
      minWeeks:    w,
      maxWeeks:    w,
      restWeeks:   4,
      isConsecutiveDays: false,
      consecutiveDays:   0,
      raw,
    };
  }

  return _default(raw);
}

function _default(raw) {
  return {
    activeWeeks: 8,
    minWeeks:    8,
    maxWeeks:    12,
    restWeeks:   4,   // 4-week cycle-off — standard peptide protocol
    isConsecutiveDays: false,
    consecutiveDays:   0,
    raw,
  };
}

module.exports = { parseCycleDuration };
