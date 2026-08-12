'use strict';

/**
 * Update NAD+ reconstitution from 3 mL to 4 mL BAC water (client request).
 *
 * Changing the diluent volume changes the concentration, so the per-injection
 * units/volumes in the dosing table are recomputed while the mg doses stay the
 * same. Also swaps the reconstitution image and fixes stray "3 mL / 10 mL"
 * references in the description.
 *
 *   NAD+ 1000 mg + 4 mL -> 250 mg/mL   (50mg=20u/0.2mL, 75mg=30u/0.3mL, 100mg=40u/0.4mL)
 *   NAD+ 500 mg  + 4 mL -> 125 mg/mL   (50mg=40u/0.4mL, 75mg=60u/0.6mL, 100mg=80u/0.8mL)
 *
 * Idempotent — safe to re-run.  Run: node src/scripts/updateNadReconstitution.js
 */

require('dotenv').config();

const { sequelize, Peptide, DosingStep } = require('../models');

const UPDATES = {
  'nad-1000mg': {
    concentration: '250 mg/mL',
    image: '/reconstitution-images/nad-1000mg-4ml.webp',
    // by step_order (1-based): units per injection + volume in mL
    steps: [
      { units: 20, ml: 0.2 },
      { units: 30, ml: 0.3 },
      { units: 40, ml: 0.4 },
      { units: 40, ml: 0.4 },
      { units: 40, ml: 0.4 },
    ],
  },
  'nad-500mg': {
    concentration: '125 mg/mL',
    image: '/reconstitution-images/nad-500mg-4ml.webp',
    steps: [
      { units: 40, ml: 0.4 },
      { units: 60, ml: 0.6 },
      { units: 80, ml: 0.8 },
      { units: 80, ml: 0.8 },
      { units: 80, ml: 0.8 },
    ],
  },
};

async function run() {
  const t = await sequelize.transaction();
  try {
    for (const [slug, cfg] of Object.entries(UPDATES)) {
      const peptide = await Peptide.findOne({ where: { slug }, transaction: t });
      if (!peptide) {
        console.log(`  SKIP: ${slug} not found`);
        continue;
      }

      // Fix any "3 mL" / "10 mL" reconstitution references in the description.
      const howItWorks = (peptide.howItWorks || '')
        .replace(/\b(?:3|10)\s*mL\b/g, '4 mL')
        .replace(/\b3\.0\s*mL\b/g, '4.0 mL');

      await peptide.update(
        {
          reconstitutionMl: 4,
          reconstitutionRaw: '4.0 mL BAC water',
          reconstitutionImageUrl: cfg.image,
          howItWorks,
        },
        { transaction: t }
      );

      const scheduleName = `Standard / Gradual Titration Approach (4 mL = ${cfg.concentration})`;

      const steps = await DosingStep.findAll({
        where: { peptideId: peptide.id },
        order: [['stepOrder', 'ASC']],
        transaction: t,
      });

      for (const step of steps) {
        const s = cfg.steps[step.stepOrder - 1];
        if (!s) continue;
        await step.update(
          {
            scheduleName,
            unitsPerInjection: s.units,
            volumeMl: s.ml,
          },
          { transaction: t }
        );
      }

      console.log(`  Updated ${slug}: 4 mL (${cfg.concentration}), ${steps.length} dosing steps, image ${cfg.image}`);
    }

    await t.commit();
    console.log('NAD+ reconstitution updated to 4 mL BAC water.');
  } catch (err) {
    await t.rollback();
    throw err;
  } finally {
    await sequelize.close();
  }
}

run().catch((err) => {
  console.error('Failed to update NAD+ reconstitution:', err);
  process.exit(1);
});
