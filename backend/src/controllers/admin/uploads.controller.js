'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const config = require('../../config');
const logger = require('../../utils/logger');
const { createError } = require('../../middleware/errorHandler');

/**
 * Detect the image type from its first bytes. The browser-supplied
 * Content-Type and file name are never trusted.
 */
function detectImageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return { ext: 'png', mime: 'image/png' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (buf.toString('ascii', 4, 12) === 'ftypavif') return { ext: 'avif', mime: 'image/avif' };
  return null;
}

const KINDS = { protocol: 'protocol', reconstitution: 'reconstitution' };

/**
 * POST /api/admin/uploads?kind=protocol|reconstitution&slug=bpc-157-10mg
 * Body: the raw image bytes (Content-Type: image/*).
 *
 * Saves under a unique, unguessable name (so files can be cached forever) and
 * returns the site-relative URL to store on the peptide.
 */
async function uploadImage(req, res, next) {
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      throw createError('No image received. Send the file as the request body with an image Content-Type.', 400);
    }

    const type = detectImageType(buf);
    if (!type) throw createError('Unsupported file. Upload a PNG, JPG, WebP or AVIF image.', 415);

    const kind = KINDS[req.query.kind] || 'protocol';
    const base = String(req.query.slug || 'peptide').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'peptide';
    const fileName = `${base}-${kind}-${crypto.randomBytes(6).toString('hex')}.${type.ext}`;

    await fs.mkdir(config.uploads.dir, { recursive: true });
    const finalPath = path.join(config.uploads.dir, fileName);
    const tmpPath = `${finalPath}.tmp`;
    // Write then rename, so a half-written file is never served.
    await fs.writeFile(tmpPath, buf, { mode: 0o644 });
    await fs.rename(tmpPath, finalPath);

    const url = `${config.uploads.urlPrefix}/${fileName}`;
    logger.info('Admin uploaded image', { adminId: req.admin.id, url, bytes: buf.length, type: type.mime });
    return res.status(201).json({ success: true, data: { url, bytes: buf.length, type: type.mime } });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage, detectImageType };
