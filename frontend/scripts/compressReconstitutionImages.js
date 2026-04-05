/**
 * Compress reconstitution images from PNG to WebP with slug-based filenames.
 *
 * Input:  public/Images for reconsitution/*.png
 * Output: public/images/reconstitution/{slug}.webp
 *
 * Slug is derived by stripping the "How to Reconstitute " prefix,
 * lowercasing, and replacing non-alphanumeric chars (except hyphens) with hyphens.
 *
 * Usage: node scripts/compressReconstitutionImages.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "..", "public", "Images for reconsitution");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "reconstitution");

function toSlug(filename) {
  return filename
    .replace(/\.\w+$/, "")                     // strip extension
    .replace(/^how\s+to\s+reconstitute\s+/i, "") // strip prefix
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")              // non-alphanumeric → hyphen
    .replace(/-+/g, "-")                        // collapse consecutive hyphens
    .replace(/^-|-$/g, "");                     // trim leading/trailing hyphens
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`Input directory not found: ${INPUT_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter((f) => /\.png$/i.test(f));
  console.log(`Found ${files.length} PNG files to compress.\n`);

  let totalInputBytes = 0;
  let totalOutputBytes = 0;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const slug = toSlug(file);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.webp`);

    const inputSize = fs.statSync(inputPath).size;
    totalInputBytes += inputSize;

    try {
      await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const outputSize = fs.statSync(outputPath).size;
      totalOutputBytes += outputSize;

      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
      console.log(
        `✓ ${file} → ${slug}.webp  (${(inputSize / 1024).toFixed(0)}KB → ${(outputSize / 1024).toFixed(0)}KB, -${reduction}%)`
      );
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }

  console.log(
    `\nDone! ${files.length} images compressed.` +
    `\n  Before: ${(totalInputBytes / 1024 / 1024).toFixed(1)} MB` +
    `\n  After:  ${(totalOutputBytes / 1024 / 1024).toFixed(1)} MB` +
    `\n  Saved:  ${((1 - totalOutputBytes / totalInputBytes) * 100).toFixed(1)}%`
  );
}

main();
