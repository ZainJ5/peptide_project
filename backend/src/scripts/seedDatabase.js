'use strict';

/**
 * Database Seed Script
 *
 * Reads peptide metadata from the master workbook and dosing schedules
 * from the new per-sheet dosage tables workbook, then upserts into PostgreSQL.
 *
 * Run:  node src/scripts/seedDatabase.js
 *   or: npm run seed
 *
 * Safe to re-run — truncates peptide data and re-seeds.
 *
 * Data sources:
 *   1. Master workbook  — peptide metadata (howItWorks, sideEffects, benefits, etc.)
 *   2. Dosage tables workbook — Index sheet + individual per-peptide dosing sheets
 *   3. Health objective workbook — category mapping
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
const DOSAGE_TABLES_PATH = path.join(DATA_DIR, 'Peptide_dosaing_tables_replaced_completed (1).xlsx');
const DOSAGE_TABLES_JSON_PATH = path.join(DATA_DIR, 'dosage_tables.json');
const HEALTH_OBJECTIVE_PATH = path.join(DATA_DIR, 'Peptide by health objective.xlsx');

// Old coded names → real names used in the new dosage tables file
const NAME_REMAP = {
  'GLP-1S':              'Semaglutide',
  'GLP-2T':              'Trizepatide',
  'GLP-3R':              'Retatrutide',
  'Cagrilintide + GLP-1S': 'Cagrilintide + Semaglutide',
};

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

    logger.info(`Reading master metadata Excel: ${MASTER_PATH}`);
    const masterWorkbook = new ExcelJS.Workbook();
    await masterWorkbook.xlsx.readFile(MASTER_PATH);

    const fs = require('fs');
    let dosageData = null;
    if (fs.existsSync(DOSAGE_TABLES_JSON_PATH)) {
      logger.info(`Reading dosage tables JSON: ${DOSAGE_TABLES_JSON_PATH}`);
      dosageData = JSON.parse(fs.readFileSync(DOSAGE_TABLES_JSON_PATH, 'utf-8'));
    } else if (fs.existsSync(DOSAGE_TABLES_PATH)) {
      logger.info(`JSON not found, converting Excel to JSON first...`);
      logger.warn(`Run: python3 src/scripts/convertExcelToJson.py`);
      logger.warn(`Falling back to old dosing schedule format from master workbook.`);
    } else {
      logger.warn(`Dosage tables not found (neither JSON nor Excel)`);
    }

    const healthObjectiveMap = await loadHealthObjectiveMap();

    await resetPeptideData();

    await seedPeptides(masterWorkbook, healthObjectiveMap);

    // Enrich source URLs + frequency/cycle from new dosage tables
    if (dosageData) {
      await enrichFromDosageIndex(dosageData);
      await seedDosingStepsFromSheets(dosageData);
    } else {
      // Fallback to old format if new file not available
      await enrichSourceUrls(masterWorkbook);
      await seedDosingSteps(masterWorkbook);
    }

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
      let protocolTitle = String(row['Peptide / Blend (Protocol Title)'] || '').trim();
      if (!protocolTitle) continue;

      // Remap old coded names to real drug names
      protocolTitle = remapProtocolTitle(protocolTitle);

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

/**
 * Remap old coded protocol titles (e.g. "GLP-1S 10MG") to real drug names.
 */
function remapProtocolTitle(title) {
  for (const [oldName, newName] of Object.entries(NAME_REMAP)) {
    // Match "GLP-1S" at start (possibly followed by space + mg), case-insensitive
    const pattern = new RegExp(`^${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(title)) {
      return title.replace(pattern, newName);
    }
  }
  return title;
}

// ── New dosage tables file parsing (reads from JSON) ───────────────────────

/**
 * Enrich peptides with source URLs, frequency, and cycle duration from the
 * dosage tables JSON index array.
 */
async function enrichFromDosageIndex(dosageData) {
  const indexRows = dosageData.index;
  if (!indexRows || indexRows.length === 0) {
    logger.warn('No index data in dosage tables JSON — skipping enrichment');
    return;
  }

  logger.info(`Enriching from dosage tables Index (${indexRows.length} rows)`);

  const allPeptides = await Peptide.findAll({
    attributes: ['id', 'protocolTitle', 'sourceUrl', 'injectionFrequencyRaw', 'cycleDurationRaw'],
    raw: true,
  });

  const peptidesByKey = {};
  for (const p of allPeptides) {
    peptidesByKey[makeMatchKey(p.protocolTitle)] = p;
  }

  let updated = 0;

  for (const row of indexRows) {
    const rawTitle = String(row['Protocol Title (Column A)'] || '').trim();
    const url      = String(row['URL'] || '').trim();
    const freq     = String(row['Frequency'] || '').trim();
    const cycle    = String(row['Cycle/Duration'] || '').trim();
    if (!rawTitle) continue;

    const key = makeMatchKey(rawTitle);
    const peptide = peptidesByKey[key];
    if (!peptide) {
      logger.warn(`  Index row not matched to DB peptide: "${rawTitle}" (key: ${key})`);
      continue;
    }

    const updates = {};
    if (url && url !== peptide.sourceUrl) updates.sourceUrl = url;
    if (freq && !peptide.injectionFrequencyRaw) updates.injectionFrequencyRaw = freq;
    if (cycle && !peptide.cycleDurationRaw) updates.cycleDurationRaw = cycle;

    if (Object.keys(updates).length > 0) {
      await Peptide.update(updates, { where: { id: peptide.id } });
      updated++;
    }
  }

  logger.info(`Index enrichment — updated: ${updated} peptides`);
}

/**
 * Parse dosing steps from individual per-peptide sheets stored in
 * the dosageData.sheets JSON object.
 */
async function seedDosingStepsFromSheets(dosageData) {
  const allPeptides = await Peptide.findAll({ attributes: ['id', 'protocolTitle'], raw: true });
  const peptidesByKey = {};
  for (const p of allPeptides) {
    peptidesByKey[makeMatchKey(p.protocolTitle)] = p;
  }

  // Build sheet name → protocol title mapping from Index
  const sheetToTitle = {};
  for (const row of (dosageData.index || [])) {
    const sheetName = String(row['Sheet Name'] || '').trim();
    const title     = String(row['Protocol Title (Column A)'] || '').trim();
    if (sheetName && title) sheetToTitle[sheetName] = title;
  }

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const [sheetName, allRows] of Object.entries(dosageData.sheets || {})) {
    // Get protocol title from row 0, col 0
    let protocolTitle = (allRows[0] && allRows[0][0]) ? String(allRows[0][0]).trim() : '';

    // Fallback to Index lookup
    if (!protocolTitle) {
      protocolTitle = sheetToTitle[sheetName] || '';
    }
    if (!protocolTitle) {
      logger.warn(`  Sheet "${sheetName}" — no protocol title found, skipping`);
      totalSkipped++;
      continue;
    }

    const key = makeMatchKey(protocolTitle);
    const peptide = peptidesByKey[key];
    if (!peptide) {
      logger.warn(`  No DB peptide match for sheet "${sheetName}" / "${protocolTitle}" (key: ${key})`);
      totalSkipped++;
      continue;
    }

    const schedules = parseSchedulesFromRows(allRows);

    if (schedules.length === 0) {
      logger.warn(`  Sheet "${sheetName}" — no dosing schedules detected`);
      totalSkipped++;
      continue;
    }

    for (const schedule of schedules) {
      for (let i = 0; i < schedule.steps.length; i++) {
        const step = schedule.steps[i];
        const stepOrder = i + 1;
        const tableHeaders = schedule.headers;
        const rowData = {};
        tableHeaders.forEach((h, idx) => {
          if (h) rowData[h] = step[idx] || '';
        });

        const rowDataKeys = Object.keys(rowData);

        let weekStart = null, weekEnd = null;
        const weekKey = rowDataKeys.find((k) => /week|phase|day/i.test(k));
        if (weekKey) {
          const parsed = parseWeekRange(String(rowData[weekKey]));
          weekStart = parsed.weekStart;
          weekEnd   = parsed.weekEnd;
        }

        let doseLabel = null, doseMcg = null;
        const doseKey = rowDataKeys.find((k) => /dose|mcg/i.test(k));
        if (doseKey) {
          const parsed = parseDoseMcg(String(rowData[doseKey]));
          doseLabel = parsed.label;
          doseMcg   = parsed.mcg;
        }

        let doseUnits = null, volumeMl = null;
        const unitsKey = rowDataKeys.find((k) => /unit|ml|vol/i.test(k));
        if (unitsKey) {
          const parsed = parseDoseValue(String(rowData[unitsKey]));
          doseUnits = parsed.units;
          volumeMl  = parsed.volumeMl;
        }

        try {
          await DosingStep.upsert(
            {
              peptideId: peptide.id,
              scheduleName: schedule.name,
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
          totalCreated++;
        } catch (err) {
          logger.warn(`  Failed to upsert step for "${protocolTitle}" schedule "${schedule.name}" step ${stepOrder}: ${err.message}`);
          totalSkipped++;
        }
      }
    }
  }

  logger.info(`Dosing steps (from sheets) — upserted: ${totalCreated}, skipped: ${totalSkipped}`);
}

/**
 * Parse dosing schedule tables from a sheet's raw row arrays.
 * Returns an array of { name, headers, steps } objects.
 *
 * Structure detection:
 *   - Metadata rows (rows 0-4): title, URL, frequency, cycle, parent tab
 *   - Blank row
 *   - Schedule name row (single non-empty cell in col A)
 *   - Header row (multiple non-empty cells — column labels)
 *   - Data rows (until blank row or end)
 */
function parseSchedulesFromRows(allRows) {
  const schedules = [];
  let i = 5; // Skip metadata rows (0-4)

  while (i < allRows.length) {
    // Skip blank rows
    if (isBlankRow(allRows[i])) { i++; continue; }

    // Look for a schedule name row — typically single value or a descriptive label
    const row = allRows[i];
    const nonEmpty = row.filter((v) => v != null && String(v).trim() !== '');

    // Schedule name is usually a single cell (or first cell of a row where
    // subsequent cells are empty), containing keywords like "Protocol", "Approach", "Standard", etc.
    if (nonEmpty.length <= 1 || (nonEmpty.length >= 1 && isScheduleNameRow(row))) {
      const scheduleName = String(row[0] || '').trim();
      if (!scheduleName) { i++; continue; }

      i++;
      if (i >= allRows.length) break;

      // Next row should be headers
      const headers = allRows[i].map((v) => String(v || '').trim());
      const validHeaders = headers.filter(Boolean);
      if (validHeaders.length < 2) { continue; }

      i++;

      // Collect data rows until blank row or end
      const steps = [];
      while (i < allRows.length && !isBlankRow(allRows[i])) {
        steps.push(allRows[i]);
        i++;
      }

      if (steps.length > 0) {
        schedules.push({ name: scheduleName, headers, steps });
      }
    } else {
      i++;
    }
  }

  return schedules;
}

function isBlankRow(row) {
  if (!row) return true;
  return row.every((v) => v == null || String(v).trim() === '');
}

function isScheduleNameRow(row) {
  // A schedule name row has content in the first cell and empty or null in the rest
  const first = String(row[0] || '').trim();
  if (!first) return false;
  const rest = row.slice(1);
  return rest.every((v) => v == null || String(v).trim() === '');
}

main();
