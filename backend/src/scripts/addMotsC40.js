'use strict';

/**
 * Add / update the MOTS-C 40 mg vial peptide protocol.
 *
 * Mirrors the existing MOTS-C 20 mg record, adjusted for the 40 mg vial
 * (3.0 mL BAC water → ~13.33 mg/mL) using the published titration table from
 * peptidedosages.com. Safe to re-run — idempotent by slug ("mots-c-40mg").
 *
 * Run:  node src/scripts/addMotsC40.js
 */

require('dotenv').config();

const { sequelize, Peptide, DosingStep } = require('../models');

const SLUG = 'mots-c-40mg';
const SCHEDULE_NAME = 'Standard / Gradual Approach (3 mL = ~13.33 mg/mL)';

const PEPTIDE = {
  name: 'MOTS-C',
  mgAmount: '40MG',
  protocolTitle: 'MOTS-C 40MG',
  slug: SLUG,
  type: 'single',
  reconstitutionMl: 3,
  reconstitutionRaw: '3.0 mL BAC water',
  howItWorks:
    "For the 40 mg vial, MOTS-C is described using the same core 'exercise-mimetic' framework: it functions as a metabolic stress signal that activates AMPK and pushes metabolism toward greater fuel utilization and less storage. The protocol explains AMPK activation through folate-cycle inhibition leading to AICAR accumulation, then describes downstream effects including enhanced glucose uptake, increased fatty-acid oxidation, and improved mitochondrial respiration, with reduced gluconeogenesis and fat storage. It also notes that MOTS-C can translocate to the nucleus in stress states and upregulate antioxidant and stress-response genes (mitochondria-to-nucleus retrograde signaling). The page links these mechanisms to preclinical findings across obesity, insulin resistance, menopausal metabolic decline models, and age-related frailty, and it cites broader interest in mTOR/inflammatory modulation for healthspan research. The protocol emphasizes that human clinical evidence is limited; a modified analog is noted as tolerable in early-phase testing, but MOTS-C itself remains investigational.",
  sideEffects: [
    'No specific adverse effects reported in preclinical studies (per page)',
    'Human tolerability unknown (MOTS-C itself)',
    'Injection-site reactions are possible with subcutaneous administration',
  ],
  benefits: [
    'Improved insulin sensitivity and prevention of diet-induced insulin resistance in mice',
    'Reduced obesity/visceral fat via higher energy expenditure and fat oxidation',
    'Improved exercise capacity and reduced frailty signals in older animals',
    'Organ-protection signals (liver fat reduction; improved cardiac function)',
    'Bone and immune-aging modulation signals in preclinical models',
  ],
  injectionFrequencyRaw: 'Inject once daily',
  cycleDurationRaw: '8–12 weeks; optional extension to 16 weeks',
  preparationNotes:
    '• Use aseptic technique: wipe vial stopper with alcohol; use new sterile syringe/needle\n• Add diluent slowly down the vial wall to minimize foaming\n• Gently swirl/roll until fully dissolved (do not shake)\n• Label vial with reconstitution date and concentration; protect from light\n• Refrigerate after reconstitution (commonly 2–8 °C) unless protocol states otherwise\n• Avoid repeated freeze–thaw cycles\n• Bacteriostatic Water for Injection contains benzyl alcohol preservative (multi-dose); follow protocol for beyond-use (many peptide protocols use ~28 days after mixing)\n• Avoid benzyl-alcohol-containing diluents in neonates/infants (safety warning for benzyl alcohol)',
  healthCategories: ['weight management', 'energy, vitality, and anit-oxidation'],
  sourceUrl: 'https://peptidedosages.com/single-peptide-dosages/mots-c-40-mg-vial-dosage-protocol/',
  imageUrl: null,
  reconstitutionImageUrl: null,
  isActive: true,
};

// 40 mg vial @ ~13.33 mg/mL — units per injection are half of the 20 mg vial for the same mcg dose.
const STEPS = [
  { weekLabel: 'Weeks 1–2',   weekStart: 1, weekEnd: 2,    mcg: 200,  doseLabel: '200 mcg (0.2 mg)',   units: 1.5, mlText: '0.015 mL', volumeMl: 0.015 },
  { weekLabel: 'Weeks 3–4',   weekStart: 3, weekEnd: 4,    mcg: 400,  doseLabel: '400 mcg (0.4 mg)',   units: 3,   mlText: '0.03 mL',  volumeMl: 0.03 },
  { weekLabel: 'Weeks 5–6',   weekStart: 5, weekEnd: 6,    mcg: 600,  doseLabel: '600 mcg (0.6 mg)',   units: 4.5, mlText: '0.045 mL', volumeMl: 0.045 },
  { weekLabel: 'Weeks 7–8',   weekStart: 7, weekEnd: 8,    mcg: 800,  doseLabel: '800 mcg (0.8 mg)',   units: 6,   mlText: '0.06 mL',  volumeMl: 0.06 },
  { weekLabel: 'Weeks 9–10+', weekStart: 9, weekEnd: null, mcg: 1000, doseLabel: '1,000 mcg (1.0 mg)', units: 7.5, mlText: '0.075 mL', volumeMl: 0.075 },
];

const TABLE_HEADERS = ['Week', 'Daily Dose (mcg)', 'Units (per injection) (mL)'];

async function run() {
  const t = await sequelize.transaction();
  try {
    let peptide = await Peptide.findOne({ where: { slug: SLUG }, transaction: t });

    if (peptide) {
      await peptide.update(PEPTIDE, { transaction: t });
      // Replace any existing dosing steps so re-runs stay clean
      await DosingStep.destroy({ where: { peptideId: peptide.id }, transaction: t });
      console.log(`Updated existing peptide ${SLUG} (${peptide.id}).`);
    } else {
      peptide = await Peptide.create(PEPTIDE, { transaction: t });
      console.log(`Created peptide ${SLUG} (${peptide.id}).`);
    }

    for (let i = 0; i < STEPS.length; i += 1) {
      const s = STEPS[i];
      await DosingStep.create(
        {
          peptideId: peptide.id,
          scheduleName: SCHEDULE_NAME,
          stepOrder: i + 1,
          weekRangeLabel: s.weekLabel,
          weekStart: s.weekStart,
          weekEnd: s.weekEnd,
          dailyDoseLabel: s.doseLabel,
          dailyDoseMcg: s.mcg,
          unitsPerInjection: s.units,
          volumeMl: s.volumeMl,
          tableHeaders: TABLE_HEADERS,
          rowData: {
            Week: s.weekLabel,
            'Daily Dose (mcg)': s.doseLabel,
            'Units (per injection) (mL)': `${s.units} units (${s.mlText})`,
          },
        },
        { transaction: t }
      );
    }

    await t.commit();
    console.log(`Inserted ${STEPS.length} dosing steps for "${SCHEDULE_NAME}".`);
    console.log('MOTS-C 40MG is live.');
  } catch (err) {
    await t.rollback();
    throw err;
  } finally {
    await sequelize.close();
  }
}

run().catch((err) => {
  console.error('Failed to add MOTS-C 40MG:', err);
  process.exit(1);
});
