'use strict';

/**
 * Database Seed Script
 *
 * Reads all peptide data from the Excel master workbook and
 * upserts it into PostgreSQL.
 *
 * Run:  node src/scripts/seedDatabase.js
 *   or: npm run seed
 *
 * Safe to re-run — uses upsert (INSERT OR UPDATE) on protocolTitle.
 *
 * Source sheets consumed:
 *   1. "Single Peptides"   — 93 rows
 *   2. "Peptide Blends"    —  9 rows
 *   3. "Dosing Schedules"  — 423 rows (escalation steps + sourceUrl)
 */

require('dotenv').config();

const path    = require('path');
const ExcelJS = require('exceljs');
const { sequelize } = require('../config/database');
const { parseWeekRange, parseDoseValue, parseDoseMcg } = require('../services/scheduleEngine/escalationBuilder');
const logger = require('../utils/logger');

let Peptide, DosingStep;

const DATA_DIR = path.resolve(__dirname, '../../data');
const MASTER_PATH_CANDIDATES = [
  path.join(DATA_DIR, 'peptide_dosage_master_updated_1_replaced.xlsx'),
  path.join(DATA_DIR, 'peptide dosage master.xlsx'),
  path.resolve(__dirname, '../../..', 'peptide dosage master.xlsx'),
];
const HEALTH_OBJECTIVE_PATH = path.join(DATA_DIR, 'Peptide by health objective.xlsx');

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    if (require('fs').existsSync(candidate)) return candidate;
  }
  return null;
}

const MASTER_PATH = resolveExistingPath(MASTER_PATH_CANDIDATES);

async function main() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected.');

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');
    logger.info('citext extension ready.');

    const models = require('../models');
    Peptide    = models.Peptide;
    DosingStep = models.DosingStep;

    await sequelize.sync({ alter: true });
    logger.info('Tables synced.');

    if (!MASTER_PATH) {
      throw new Error(`Master workbook not found. Checked: ${MASTER_PATH_CANDIDATES.join(', ')}`);
    }

    logger.info(`Reading Excel: ${MASTER_PATH}`);

    // ExcelJS reads the workbook asynchronously — no CVEs, actively maintained.
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(MASTER_PATH);

    const healthObjectiveMap = await loadHealthObjectiveMap();

    await resetPeptideData();

    await seedPeptides(workbook, healthObjectiveMap);
    await enrichSourceUrls(workbook);
    await seedDosingSteps(workbook);

    logger.info('Seed complete.');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

async function resetPeptideData() {
  await sequelize.query('TRUNCATE TABLE peptides RESTART IDENTITY CASCADE;');
  logger.info('Existing peptide-related data truncated (peptides + dependent rows).');
}

async function loadHealthObjectiveMap() {
  const fs = require('fs');
  if (!fs.existsSync(HEALTH_OBJECTIVE_PATH)) {
    logger.warn(`Health objective workbook not found: ${HEALTH_OBJECTIVE_PATH}`);
    return {};
  }

  logger.info(`Reading health objective map: ${HEALTH_OBJECTIVE_PATH}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(HEALTH_OBJECTIVE_PATH);

  const ws = workbook.getWorksheet('Peptide Protocols') || workbook.worksheets[0];
  if (!ws) {
    logger.warn('No worksheet found in health objective workbook.');
    return {};
  }

  const peptideToCategories = {};

  ws.eachRow((row) => {
    const rawCells = row.values
      .slice(1)
      .map((v) => extractCellValue(v))
      .map((v) => String(v || '').trim())
      .filter(Boolean);

    if (rawCells.length < 2) return;

    const category = normalizeHealthCategory(rawCells[0]);
    if (!category) return;

    for (const peptideName of rawCells.slice(1)) {
      const key = makeMatchKey(peptideName);
      if (!key) continue;
      if (!peptideToCategories[key]) peptideToCategories[key] = new Set();
      peptideToCategories[key].add(category);
    }
  });

  const flattened = Object.fromEntries(
    Object.entries(peptideToCategories).map(([key, set]) => [key, Array.from(set)])
  );

  logger.info(`Health objective map loaded for ${Object.keys(flattened).length} peptides.`);
  return flattened;
}

function normalizeHealthCategory(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helpers: ExcelJS sheet → array of row objects

/**
 * Convert an ExcelJS worksheet into an array of plain objects, using the
 * first row as column headers (equivalent to XLSX.utils.sheet_to_json).
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @returns {object[]}
 */
function worksheetToJson(worksheet) {
  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1); // ExcelJS row.values[0] is always null

    if (rowNumber === 1) {
      // First row = headers
      headers = values.map((v) => (v != null ? String(v).trim() : ''));
      return;
    }

    // Skip completely empty rows
    if (values.every((v) => v == null || v === '')) return;

    const obj = {};
    headers.forEach((header, i) => {
      if (!header) return;
      const cell = values[i];
      obj[header] = extractCellValue(cell);
    });

    rows.push(obj);
  });

  return rows;
}

function extractCellValue(cell) {
  if (cell && typeof cell === 'object') {
    if (cell.text !== undefined) return cell.text;       // RichText
    if (cell.hyperlink) return cell.hyperlink;           // Hyperlink
    if (cell instanceof Date) return cell;
    return String(cell);
  }
  return cell != null ? cell : '';
}

// Seed functions

async function seedPeptides(workbook, healthObjectiveMap = {}) {
  const sheetsToSeed = [
    { name: 'Single Peptides', type: 'single' },
    { name: 'Peptide Blends',  type: 'blend'  },
  ];

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const { name: sheetName, type } of sheetsToSeed) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) {
      logger.warn(`Sheet not found: "${sheetName}" — skipping`);
      continue;
    }

    const rows = worksheetToJson(ws);
    logger.info(`Processing sheet: "${sheetName}" (${rows.length} rows)`);

    for (const row of rows) {
      const protocolTitle = String(row['Peptide / Blend (Protocol Title)'] || '').trim();
      if (!protocolTitle) continue;

      const { baseName, mgAmount } = parsePeptideTitle(protocolTitle);

      const sideEffects = parseBullets(row['Top side effects (≤6 bullets)'] || row['Top side effects'] || '');
      const benefits    = parseBullets(row['Benefits (bullets)'] || row['Benefits'] || '');

      const reconRaw = String(row['Reconstitution (BAC water amount)'] || '').trim();
      const reconMl  = parseFloat(reconRaw) || null;
      const healthCategories = getHealthCategoriesForPeptide(protocolTitle, baseName, healthObjectiveMap);

      const peptideData = {
        name:                  baseName,
        mgAmount,
        protocolTitle,
        type,
        reconstitutionMl:      reconMl,
        reconstitutionRaw:     reconRaw,
        howItWorks:            String(row['How this works (paraphrased, 100–200 words)'] || '').trim() || null,
        sideEffects,
        benefits,
        injectionFrequencyRaw: String(row['Injection frequency (from protocol)'] || '').trim() || null,
        cycleDurationRaw:      String(row['Cycle / protocol duration (from protocol)'] || '').trim() || null,
        preparationNotes:      String(row['Preparation Notes (typical reconstitution)'] || '').trim() || null,
        healthCategories,
        isActive:              true,
      };

      const [, created] = await Peptide.upsert(peptideData, {
        conflictFields: ['protocol_title'],
      });

      if (created) totalCreated++;
      else          totalUpdated++;
    }
  }

  logger.info(`Peptides — created: ${totalCreated}, updated: ${totalUpdated}`);
}

function getHealthCategoriesForPeptide(protocolTitle, baseName, healthObjectiveMap) {
  const keys = [
    makeMatchKey(protocolTitle),
    makeMatchKey(baseName),
    makeMatchKey(String(baseName).replace(/\s*\([^)]*\)/g, '').trim()),
  ].filter(Boolean);

  const categories = new Set();
  for (const key of keys) {
    for (const category of healthObjectiveMap[key] || []) {
      categories.add(category);
    }
  }
  return Array.from(categories);
}

async function enrichSourceUrls(workbook) {
  const ws = workbook.getWorksheet('Dosing Schedules');
  if (!ws) {
    logger.warn('Sheet "Dosing Schedules" not found — skipping source URL enrichment');
    return;
  }

  const rows = worksheetToJson(ws);

  // Build normalised title → URL map (first occurrence per title wins)
  const urlMap = {};
  for (const row of rows) {
    const rawTitle = String(row['Protocol Title'] || '').trim();
    const url      = String(row['URL'] || '').trim();
    if (!rawTitle || !url) continue;
    const key = makeMatchKey(rawTitle);
    if (!urlMap[key]) urlMap[key] = url;
  }

  const allPeptides = await Peptide.findAll({ attributes: ['id', 'protocolTitle', 'sourceUrl'], raw: true });
  let updated = 0;
  let missing = 0;

  for (const p of allPeptides) {
    const url = urlMap[makeMatchKey(p.protocolTitle)];
    if (url && url !== p.sourceUrl) {
      await Peptide.update({ sourceUrl: url }, { where: { id: p.id } });
      updated++;
    } else if (!url) {
      logger.warn(`  No sourceUrl found for: "${p.protocolTitle}"`);
      missing++;
    }
  }

  logger.info(`Source URLs — updated: ${updated}, already set / not found: ${missing}`);
}

async function seedDosingSteps(workbook) {
  const ws = workbook.getWorksheet('Dosing Schedules');
  if (!ws) {
    logger.warn('Sheet "Dosing Schedules" not found — skipping dosing step seed');
    return;
  }

  const rows = worksheetToJson(ws);
  logger.info(`Processing sheet: "Dosing Schedules" (${rows.length} rows)`);

  const allPeptides = await Peptide.findAll({ attributes: ['id', 'protocolTitle'], raw: true });
  const nameToId    = {};
  for (const p of allPeptides) {
    nameToId[makeMatchKey(p.protocolTitle)] = p.id;
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const rawTitle     = String(row['Protocol Title'] || '').trim();
    const scheduleName = String(row['Schedule Name'] || '').trim();
    const stepOrder    = parseInt(row['Step Order'], 10);

    if (!rawTitle || !scheduleName || isNaN(stepOrder)) { skipped++; continue; }
    if (scheduleName === '(no dosing table detected)')   { skipped++; continue; }

    const peptideId = nameToId[makeMatchKey(rawTitle)];
    if (!peptideId) {
      logger.warn(`  No peptide match for: "${rawTitle}" (key: ${makeMatchKey(rawTitle)})`);
      skipped++;
      continue;
    }

    let tableHeaders = null;
    let rowData      = null;
    try { tableHeaders = JSON.parse(row['Table Headers (JSON)'] || 'null'); } catch (_) {}
    try { rowData      = JSON.parse(row['Row Data (JSON)']      || 'null'); } catch (_) {}

    let weekStart = null, weekEnd = null, doseLabel = null, doseMcg = null;
    let doseUnits = null, volumeMl = null;

    if (rowData) {
      const keys = Object.keys(rowData);

      const weekKey = keys.find((k) => /week/i.test(k));
      if (weekKey) {
        const wr = parseWeekRange(String(rowData[weekKey]));
        weekStart = wr.weekStart;
        weekEnd   = wr.weekEnd;
      }

      const mcgKey = keys.find((k) => /mcg/i.test(k)) || keys.find((k) => /dose/i.test(k));
      if (mcgKey) {
        const dp = parseDoseMcg(String(rowData[mcgKey]));
        doseLabel = dp.label;
        doseMcg   = dp.mcg;
      }

      const unitsKey = keys.find((k) => /unit/i.test(k));
      if (unitsKey) {
        const dp = parseDoseValue(String(rowData[unitsKey]));
        doseUnits = dp.units;
        volumeMl  = dp.volumeMl;
      }

      if (volumeMl === null) {
        const volKey = keys.find((k) => /\bvol|\bml/i.test(k) && !/unit/i.test(k));
        if (volKey) {
          const val      = String(rowData[volKey]);
          const volMatch = val.match(/(\d+(?:\.\d+)?)(?:[–\-][\d.]+)?\s*mL\b/i);
          if (volMatch) volumeMl = parseFloat(volMatch[1]);

          if (doseUnits === null) {
            const uMatch = val.match(/(\d+(?:\.\d+)?)\s*units?/i);
            if (uMatch) doseUnits = parseFloat(uMatch[1]);
          }
        }
      }

      if (volumeMl === null && doseUnits !== null) {
        const uk = keys.find((k) => /unit/i.test(k));
        if (uk) {
          const rMatch = String(rowData[uk]).match(/(\d+(?:\.\d+)?)(?:[–\-][\d.]+)?\s*mL\b/i);
          if (rMatch) volumeMl = parseFloat(rMatch[1]);
        }
      }
    }

    try {
      await DosingStep.upsert(
        {
          peptideId,
          scheduleName,
          stepOrder,
          weekRangeLabel: weekStart != null ? `Weeks ${weekStart}${weekEnd ? '–' + weekEnd : '+'}` : null,
          weekStart,
          weekEnd,
          dailyDoseLabel:    doseLabel,
          dailyDoseMcg:      doseMcg,
          unitsPerInjection: doseUnits,
          volumeMl,
          tableHeaders,
          rowData,
        },
        { conflictFields: ['peptide_id', 'schedule_name', 'step_order'] }
      );
      created++;
    } catch (err) {
      logger.warn(`  Failed to upsert step (peptide=${peptideId}, step=${stepOrder}): ${err.message}`);
      skipped++;
    }
  }

  logger.info(`Dosing steps — upserted: ${created}, skipped: ${skipped}`);
}

// Helpers
/**
 * Extract the base peptide name and mg amount from a protocol title.
 * "BPC-157 (10 mg Vial) Dosage Protocol" → { baseName: "BPC-157", mgAmount: "10MG" }
 * "Adipotide 10MG"                        → { baseName: "Adipotide", mgAmount: "10MG" }
 */
function parsePeptideTitle(title) {
  const vialsMatch = title.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*mg\s*(?:Vial|Blend)\)/i);
  if (vialsMatch) return { baseName: vialsMatch[1].trim(), mgAmount: `${vialsMatch[2]}MG` };

  const mgMatch = title.match(/^(.+?)\s+(\d+(?:\.\d+)?MG)\b/i);
  if (mgMatch) return { baseName: mgMatch[1].trim(), mgAmount: mgMatch[2].toUpperCase() };

  const iuMatch = title.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*IU\s*(?:Vial|Blend)\)/i);
  if (iuMatch) return { baseName: iuMatch[1].trim(), mgAmount: `${iuMatch[2]}IU` };

  return { baseName: title, mgAmount: null };
}

/**
 * Parse a multi-line bullet string into an array of clean strings.
 */
function parseBullets(text) {
  if (!text) return [];
  return String(text)
    .split('\n')
    .map((line) => line.replace(/^[\s\-•*·]+/, '').trim())
    .filter(Boolean);
}

/**
 * Build a normalised match key from any protocol title string.
 */
function makeMatchKey(title) {
  return String(title)
    .toLowerCase()
    .replace(/\bdosage\s+protocol\b/g, '')
    .replace(/\bvial\b|\bblend\b/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*mg\b/g, '$1')
    .replace(/(\d+(?:\.\d+)?)\s*iu\b/g, '$1')
    .replace(/[^a-z0-9\-+]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

main();
