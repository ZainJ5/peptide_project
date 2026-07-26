'use strict';

const path = require('path');
const fs = require('fs');

const config = require('../config');
const { createError } = require('../middleware/errorHandler');

/**
 * Videos API
 *
 * The video library is a small, curated set served from a single source of
 * truth: src/data/videos.json. The actual media (MP4 files and thumbnails) is
 * served as static files by the web server; this API returns the metadata with
 * absolute HTTPS URLs so both the website and the mobile app can consume it.
 */
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'videos.json');

let manifestCache = null;
function loadManifest() {
  if (!manifestCache) {
    manifestCache = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return manifestCache;
}

function toAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${config.publicSiteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function serializeVideo(video) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    videoUrl: toAbsoluteUrl(video.videoPath),
    thumbnailUrl: toAbsoluteUrl(video.thumbnailPath),
    durationSeconds: video.durationSeconds ?? 0,
    sortOrder: video.sortOrder ?? 100,
  };
}

async function listVideos(req, res, next) {
  try {
    const { category } = req.query;

    const videos = loadManifest()
      .filter((v) => v.isActive !== false)
      .filter((v) => !category || v.category === category)
      .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100))
      .map(serializeVideo);

    return res.json({ success: true, total: videos.length, data: videos });
  } catch (err) {
    next(err);
  }
}

async function getVideoById(req, res, next) {
  try {
    const video = loadManifest().find((v) => v.id === req.params.id && v.isActive !== false);
    if (!video) throw createError('Video not found.', 404);

    return res.json({ success: true, data: serializeVideo(video) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listVideos, getVideoById };
