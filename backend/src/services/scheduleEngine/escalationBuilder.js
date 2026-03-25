'use strict';

/**
 * Escalation Builder
 *
 * Converts a peptide's ordered DosingStep rows into a per-week lookup
 * table the calendar generator queries by week number.
 *
 * Example input: "Week 1–2 = 6 units, Week 3–4 = 12 units, Week 5+ = 18 units"
 * Example output: getForWeek(1) → { units: 6, ... }, getForWeek(5) → { units: 18, ... }
 *
 * Also exports the individual dose/week parsers used by the seed script.
 */

const DOSE_UNITS_REGEX = /(\d+(?:\.\d+)?)\s*units?/i;
// Captures the LOWER bound of ranges like "0.075–0.09 mL" and plain "3.0 mL"
const VOLUME_ML_REGEX  = /(\d+(?:\.\d+)?)(?:[–\-][\d.]+)?\s*mL\b/i;
const MCG_REGEX        = /(\d+(?:\.\d+)?)\s*(?:mcg|µg|ug)\b/i;
const MG_REGEX         = /(\d+(?:\.\d+)?)\s*mg\b/i;

/**
 * Parse a week range label into { weekStart, weekEnd }.
 * weekEnd is null when the label is open-ended (e.g. "Weeks 5–8+", "Week 10+").
 *
 * @param {string} label  e.g. "Weeks 1–2", "Weeks 5–8+", "Week 20"
 * @returns {{ weekStart: number, weekEnd: number|null }}
 */
function parseWeekRange(label) {
  if (!label) return { weekStart: 1, weekEnd: null };

  const str = label.trim();

  // Range with optional open-ended plus: "Weeks 5–8+" or "Weeks 5-8"
  const rangeMatch = str.match(/(\d+)[–\-](\d+)\+?/);
  if (rangeMatch) {
    const weekStart  = parseInt(rangeMatch[1], 10);
    const weekEnd    = parseInt(rangeMatch[2], 10);
    const isOpenEnded = str.includes('+');
    return { weekStart, weekEnd: isOpenEnded ? null : weekEnd };
  }

  // Single week with optional open-ended plus: "Week 20+" or "Week 3"
  const singleMatch = str.match(/week\s*(\d+)(\+)?/i);
  if (singleMatch) {
    const weekStart = parseInt(singleMatch[1], 10);
    return { weekStart, weekEnd: singleMatch[2] ? null : weekStart };
  }

  return { weekStart: 1, weekEnd: null };
}

/**
 * Parse dose units and volume from a cell value.
 *
 * @param {string} value  e.g. "6 units (0.06 mL)"
 * @returns {{ units: number|null, volumeMl: number|null }}
 */
function parseDoseValue(value) {
  if (!value) return { units: null, volumeMl: null };

  const str         = String(value);
  const unitsMatch  = str.match(DOSE_UNITS_REGEX);
  const volumeMatch = str.match(VOLUME_ML_REGEX);

  return {
    units:    unitsMatch  ? parseFloat(unitsMatch[1])  : null,
    volumeMl: volumeMatch ? parseFloat(volumeMatch[1]) : null,
  };
}

/**
 * Parse a daily dose label into mcg + raw label string.
 *
 * @param {string} value  e.g. "200 mcg (0.2 mg)"
 * @returns {{ mcg: number|null, label: string }}
 */
function parseDoseMcg(value) {
  if (!value) return { mcg: null, label: '' };

  const str      = String(value);
  const mcgMatch = str.match(MCG_REGEX);
  if (mcgMatch) return { mcg: parseFloat(mcgMatch[1]), label: str.trim() };

  // Fall back to mg — convert milligrams → micrograms (× 1000)
  const mgMatch = str.match(MG_REGEX);
  if (mgMatch) return { mcg: parseFloat(mgMatch[1]) * 1000, label: str.trim() };

  return { mcg: null, label: str.trim() };
}

/**
 * Build an escalation timeline from an array of ordered DosingStep instances.
 *
 * Returns an object with a getForWeek(n) method that maps a 1-based week
 * number to the correct EscalationEntry. The last open-ended step covers
 * all weeks beyond the last explicitly defined range.
 *
 * @param {object[]} steps  DosingStep instances, sorted by step_order ASC
 * @returns {EscalationTimeline}
 *
 * @typedef {{ units: number, volumeMl: number|null, mcg: number|null, label: string, step: number }} EscalationEntry
 * @typedef {{ getForWeek: (week: number) => EscalationEntry, steps: EscalationEntry[], maxDefinedWeek: number }} EscalationTimeline
 */
function buildEscalationTimeline(steps) {
  if (!steps || steps.length === 0) return _defaultTimeline();

  const entries = steps.map((step) => {
    let weekStart = step.weekStart;
    let weekEnd   = step.weekEnd;
    let units     = step.unitsPerInjection;
    let volumeMl  = step.volumeMl;
    let mcg       = step.dailyDoseMcg;
    let label     = step.dailyDoseLabel || '';

    // Live-parse from rowData JSONB when pre-parsed DB columns are absent
    if (weekStart == null && step.rowData) {
      const weekKey = Object.keys(step.rowData).find((k) => /week/i.test(k));
      if (weekKey) {
        const parsed = parseWeekRange(step.rowData[weekKey]);
        weekStart = parsed.weekStart;
        weekEnd   = parsed.weekEnd;
      }
    }

    if (units == null && step.rowData) {
      const unitsKey = Object.keys(step.rowData).find((k) => /unit/i.test(k));
      if (unitsKey) {
        const parsed = parseDoseValue(step.rowData[unitsKey]);
        units    = parsed.units;
        volumeMl = parsed.volumeMl;
      }
    }

    if (mcg == null && step.rowData) {
      const mcgKey = Object.keys(step.rowData).find((k) => /dose|mcg/i.test(k));
      if (mcgKey) {
        const parsed = parseDoseMcg(step.rowData[mcgKey]);
        mcg   = parsed.mcg;
        label = parsed.label || label;
      }
    }

    return {
      weekStart: weekStart ?? step.stepOrder,
      weekEnd,
      units:    units    ?? 0,
      volumeMl: volumeMl ?? null,
      mcg:      mcg      ?? null,
      label,
      step: step.stepOrder,
    };
  });

  entries.sort((a, b) => a.weekStart - b.weekStart);

  const maxDefinedWeek = entries.reduce((max, e) => {
    return e.weekEnd != null ? Math.max(max, e.weekEnd) : max;
  }, entries[entries.length - 1].weekStart);

  /**
   * Get the escalation entry for a 1-based week number.
   * Falls back to the last step for weeks beyond the defined range.
   *
   * @param {number} week
   * @returns {EscalationEntry}
   */
  function getForWeek(week) {
    for (const entry of entries) {
      if (entry.weekEnd == null) {
        if (week >= entry.weekStart) return entry;
      } else {
        if (week >= entry.weekStart && week <= entry.weekEnd) return entry;
      }
    }
    return entries[entries.length - 1];
  }

  return { getForWeek, steps: entries, maxDefinedWeek };
}

function _defaultTimeline() {
  const fallback = {
    weekStart: 1, weekEnd: null, units: 10, volumeMl: 0.1,
    mcg: null, label: 'Standard dose', step: 1,
  };
  return {
    getForWeek:      () => fallback,
    steps:           [fallback],
    maxDefinedWeek:  8,
  };
}

module.exports = { buildEscalationTimeline, parseWeekRange, parseDoseValue, parseDoseMcg };
