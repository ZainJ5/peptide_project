'use strict';

/**
 * Order a peptide's dosing steps deterministically: variants in the order they
 * were created (the first variant is the one the site shows), then by step
 * order within each variant. Ties keep their original order (stable sort).
 *
 * @param {object[]} steps  DosingStep instances or plain objects
 * @returns {object[]}
 */
function sortSteps(steps) {
  const firstSeen = new Map();
  const byCreated = [...steps].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  byCreated.forEach((s) => {
    if (!firstSeen.has(s.scheduleName)) firstSeen.set(s.scheduleName, firstSeen.size);
  });
  return byCreated.sort((a, b) =>
    firstSeen.get(a.scheduleName) - firstSeen.get(b.scheduleName) || a.stepOrder - b.stepOrder
  );
}

module.exports = { sortSteps };
