/**
 * Compress all PNG images in public/ to WebP format.
 * Keeps originals as fallback, creates .webp versions side-by-side.
 * Also creates optimized .png replacements (lossy compressed).
 *
 * Usage: node scripts/compress-images.mjs
 */
import sharp from "sharp";
import { readdir, stat, rename } from "fs/promises";
import { join, extname, basename, dirname } from "path";

const PUBLIC_DIR = new URL("../public", import.meta.url).pathname.replace(
  /^\//,
  ""
);
const MAX_HEADER_WIDTH = 1920;
const MAX_THUMBNAIL_WIDTH = 800;
const LOGO_MAX_WIDTH = 200;
const QUALITY_WEBP = 80;
const QUALITY_PNG = 80;

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllImages(fullPath)));
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getMaxWidth(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("logo")) return LOGO_MAX_WIDTH;
  if (lower.includes("thumbnail")) return MAX_THUMBNAIL_WIDTH;
  if (lower.includes("header")) return MAX_HEADER_WIDTH;
  return MAX_HEADER_WIDTH;
}

async function compressImage(filePath) {
  const maxWidth = getMaxWidth(filePath);
  const info = await sharp(filePath).metadata();
  const needsResize = info.width > maxWidth;

  const pipeline = sharp(filePath);
  if (needsResize) {
    pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }

  // Create WebP version
  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  await pipeline.clone().webp({ quality: QUALITY_WEBP }).toFile(webpPath);
  const webpStat = await stat(webpPath);

  // Overwrite original with compressed PNG
  const tmpPath = filePath + ".tmp";
  await pipeline
    .clone()
    .png({ quality: QUALITY_PNG, compressionLevel: 9, palette: true })
    .toFile(tmpPath);
  const pngStat = await stat(tmpPath);
  const origStat = await stat(filePath);

  // Only replace if smaller
  if (pngStat.size < origStat.size) {
    await rename(tmpPath, filePath);
  } else {
    const { unlink } = await import("fs/promises");
    await unlink(tmpPath);
  }

  const savedPct = ((1 - webpStat.size / origStat.size) * 100).toFixed(1);
  console.log(
    `✓ ${basename(filePath)}: ${(origStat.size / 1024).toFixed(0)}KB → WebP ${(webpStat.size / 1024).toFixed(0)}KB (${savedPct}% saved)${needsResize ? ` [resized to ${maxWidth}px]` : ""}`
  );
}

async function main() {
  console.log(`Scanning ${PUBLIC_DIR}...\n`);
  const images = await getAllImages(PUBLIC_DIR);
  console.log(`Found ${images.length} images to compress\n`);

  for (const img of images) {
    try {
      await compressImage(img);
    } catch (err) {
      console.error(`✗ ${basename(img)}: ${err.message}`);
    }
  }
  console.log("\nDone! WebP versions created alongside originals.");
}

main();
