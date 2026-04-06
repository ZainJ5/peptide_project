'use strict';

/**
 * seedReconstitutionImages.js
 *
 * Matches reconstitution image filenames to peptides in the database
 * and sets the reconstitution_image_url column.
 *
 * Usage:  node src/scripts/seedReconstitutionImages.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Peptide } = require('../models');

// Directory containing reconstitution images (webp)
const IMAGES_DIR = path.resolve(__dirname, '../../../frontend/public/images/reconstitution');

// URL path prefix that Apache will serve these from
const URL_PREFIX = '/reconstitution-images';

/**
 * Normalizes a string for fuzzy matching:
 * lowercase, strip non-alphanumeric, collapse whitespace.
 */
function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Manual mappings for image filenames that don't auto-match
 * key = normalizeKey(filename without .webp), value = protocolTitle
 */
const MANUAL_MAP = {
  'bpc157andtb500wolverineblend': null,  // no matching peptide
  'bpc157andtb500wolverinetesamorelin10mg': null,  // no matching peptide
};

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.webp'));
  console.log(`Found ${files.length} reconstitution images`);

  // Load all peptides
  const peptides = await Peptide.findAll({ attributes: ['id', 'name', 'mgAmount', 'protocolTitle'] });
  console.log(`Found ${peptides.length} peptides in database`);

  // Build lookup: normalizedKey -> peptide
  const peptideMap = new Map();
  for (const p of peptides) {
    const key = normalizeKey(p.protocolTitle);
    if (!peptideMap.has(key)) {
      peptideMap.set(key, p);
    }
  }

  let matched = 0;
  let skipped = 0;
  const unmatched = [];

  for (const file of files) {
    const baseName = file.replace('.webp', '');
    const fileKey = normalizeKey(baseName);

    // Check manual mapping first
    if (MANUAL_MAP.hasOwnProperty(fileKey)) {
      if (MANUAL_MAP[fileKey] === null) {
        console.log(`  SKIP (manual): ${file}`);
        skipped++;
        continue;
      }
      const manualPeptide = peptides.find((p) => p.protocolTitle === MANUAL_MAP[fileKey]);
      if (manualPeptide) {
        await manualPeptide.update({ reconstitutionImageUrl: `${URL_PREFIX}/${file}` });
        console.log(`  MATCH (manual): ${file} -> ${manualPeptide.protocolTitle}`);
        matched++;
        continue;
      }
    }

    // Strip trailing "-1" suffix (duplicate image variants like ghk-cu-50mg-1.webp)
    let lookupKey = fileKey;
    const peptide = peptideMap.get(lookupKey)
      || peptideMap.get(fileKey.replace(/1$/, ''));  // try without trailing "1"

    if (peptide) {
      await peptide.update({ reconstitutionImageUrl: `${URL_PREFIX}/${file}` });
      console.log(`  MATCH: ${file} -> ${peptide.protocolTitle}`);
      matched++;
    } else {
      console.log(`  UNMATCHED: ${file} (key: ${fileKey})`);
      unmatched.push(file);
    }
  }

  console.log(`\nDone: ${matched} matched, ${skipped} skipped, ${unmatched.length} unmatched`);
  if (unmatched.length > 0) {
    console.log('Unmatched files:', unmatched);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
