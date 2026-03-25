'use strict';

const { Video, Peptide } = require('../models');
const { createError } = require('../middleware/errorHandler');

function buildEmbedUrl(platform, videoId) {
  if (platform === 'youtube') return `https://www.youtube.com/embed/${videoId}`;
  if (platform === 'vimeo') return `https://player.vimeo.com/video/${videoId}`;
  return null;
}

function buildThumbnailUrl(platform, videoId) {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return null;
}

function serializeVideo(video) {
  const json = typeof video.toJSON === 'function' ? video.toJSON() : { ...video };
  return {
    ...json,
    embedUrl: buildEmbedUrl(video.platform, video.videoId),
    thumbnailUrl: video.thumbnailUrl || buildThumbnailUrl(video.platform, video.videoId),
  };
}

const PEPTIDE_ATTRS = { model: Peptide, as: 'peptide', attributes: ['id', 'name'], required: false };

async function listVideos(req, res, next) {
  try {
    const where = { isActive: true };
    if (req.query.category) where.category = req.query.category;
    if (req.query.peptideId) where.peptideId = req.query.peptideId;

    const videos = await Video.findAll({
      where,
      include: [PEPTIDE_ATTRS],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    });

    return res.json({ success: true, data: videos.map(serializeVideo) });
  } catch (err) {
    next(err);
  }
}

async function getVideoById(req, res, next) {
  try {
    const video = await Video.findOne({ where: { id: req.params.id, isActive: true }, include: [PEPTIDE_ATTRS] });
    if (!video) throw createError('Video not found.', 404);

    return res.json({ success: true, data: serializeVideo(video) });
  } catch (err) {
    next(err);
  }
}

async function createVideo(req, res, next) {
  try {
    const { title, videoId, platform, category, peptideId, description, durationSeconds, sortOrder } = req.body;

    const video = await Video.create({
      title,
      videoId,
      ...(platform !== undefined && { platform }),
      ...(category !== undefined && { category }),
      ...(peptideId !== undefined && { peptideId }),
      ...(description !== undefined && { description }),
      ...(durationSeconds !== undefined && { durationSeconds }),
      ...(sortOrder !== undefined && { sortOrder }),
    });

    return res.status(201).json({ success: true, data: serializeVideo(video) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVideos,
  getVideoById,
  createVideo,
};
