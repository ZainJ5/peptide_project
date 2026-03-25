'use strict';

/**
 * Image Assignment Script
 *
 * Scans the images/singles/ and images/blends/ directories,
 * matches each image filename to a peptide's protocolTitle,
 * and updates the image_url column in the database.
 *
 * Run:  node src/scripts/assignImages.js
 *   or: npm run assign-images
 *
 * Safe to re-run — idempotent updates.
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const IMAGES_BASE = path.resolve(__dirname, '../../images');

/**
 * Build a normalised match key from a string by stripping noise words,
 * punctuation, and collapsing whitespace. Must produce identical keys
 * for both the DB protocolTitle and the filename-derived title.
 */
function makeMatchKey(str) {
  return String(str)
    .toLowerCase()
    .replace(/\bdosage\s+protocol\b/g, '')
    .replace(/\bvial\b|\bblend\b/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*mg\b/g, '$1')
    .replace(/(\d+(?:\.\d+)?)\s*iu\b/g, '$1')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Convert an image filename into a human-readable title suitable for
 * matching against protocolTitle.
 *
 * Example:
 *   "BPC-157_5_mg_Vial_Dosage_Protocol.webp"
 *   → "BPC-157 5 mg Vial Dosage Protocol"
 */
function filenameToTitle(filename) {
  return filename
    .replace(/\.\w+$/, '')       // strip extension
    .replace(/_/g, ' ');         // underscores → spaces
}

/**
 * Scan a directory for .webp files and return an array of
 * { relativePath, matchKey } objects.
 */
function scanImageDir(subDir) {
  const fullDir = path.join(IMAGES_BASE, subDir);
  if (!fs.existsSync(fullDir)) {
    logger.warn(`Image directory not found: ${fullDir}`);
    return [];
  }

  return fs.readdirSync(fullDir)
    .filter((f) => f.endsWith('.webp'))
    .map((filename) => {
      const title = filenameToTitle(filename);
      return {
        filename,
        relativePath: `/images/${subDir}/${filename}`,
        matchKey: makeMatchKey(title),
      };
    });
}

async function main() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected.');

    // Load all peptides
    const [peptides] = await sequelize.query(
      'SELECT id, protocol_title, image_url FROM peptides ORDER BY name',
    );

    logger.info(`Found ${peptides.length} peptides in database.`);

    // Build image lookup: matchKey → relativePath
    const singles = scanImageDir('singles');
    const blends  = scanImageDir('blends');
    const allImages = [...singles, ...blends];

    logger.info(`Found ${singles.length} single images, ${blends.length} blend images.`);

    const imageMap = {};
    for (const img of allImages) {
      if (!imageMap[img.matchKey]) {
        imageMap[img.matchKey] = img.relativePath;
      }
    }

    let matched   = 0;
    let unmatched = 0;
    let skipped   = 0;

    for (const peptide of peptides) {
      const key = makeMatchKey(peptide.protocol_title);
      const imagePath = imageMap[key];

      if (!imagePath) {
        logger.warn(`  No image match for: "${peptide.protocol_title}" (key: ${key})`);
        unmatched++;
        continue;
      }

      if (peptide.image_url === imagePath) {
        skipped++;
        continue;
      }

      await sequelize.query(
        'UPDATE peptides SET image_url = :imageUrl, updated_at = NOW() WHERE id = :id',
        { replacements: { imageUrl: imagePath, id: peptide.id } },
      );
      matched++;
      logger.info(`  ✓ ${peptide.protocol_title} → ${imagePath}`);
    }

    logger.info(`\nResults: matched=${matched}, already-set=${skipped}, unmatched=${unmatched}`);
    process.exit(0);
  } catch (err) {
    logger.error('Image assignment failed', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

main();
