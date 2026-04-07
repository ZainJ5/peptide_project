'use strict';

const { Op } = require('sequelize');

const { Peptide, DosingStep } = require('../models');
const config = require('../config');
const { sequelize } = require('../config/database');
const scheduleEngine = require('../services/scheduleEngine');
const { createError } = require('../middleware/errorHandler');

function normalizeLooseSearch(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildLooseSearchClause(search) {
  const normalized = normalizeLooseSearch(search);
  if (!normalized) return null;

  const likeValue = sequelize.escape(`%${normalized}%`);
  return sequelize.literal(`(
    regexp_replace(lower(name), '[^a-z0-9]+', '', 'g') LIKE ${likeValue}
    OR regexp_replace(lower(protocol_title), '[^a-z0-9]+', '', 'g') LIKE ${likeValue}
    OR regexp_replace(lower(coalesce(mg_amount, '')), '[^a-z0-9]+', '', 'g') LIKE ${likeValue}
  )`);
}

/**
 * Attach an absolute imageUrl to a peptide JSON object.
 * Converts the stored relative path (e.g. "/images/singles/file.webp")
 * into a full URL (e.g. "http://139.59.34.214/images/singles/file.webp").
 */
function attachImageUrl(peptideJson) {
  if (peptideJson && peptideJson.imageUrl) {
    peptideJson.imageUrl = `${config.baseUrl}${peptideJson.imageUrl}`;
  }
  if (peptideJson && peptideJson.reconstitutionImageUrl) {
    peptideJson.reconstitutionImageUrl = `${config.baseUrl}${peptideJson.reconstitutionImageUrl}`;
  }
  return peptideJson;
}

let categoriesCache = null;
let categoriesCachedAt = 0;
const CATEGORIES_TTL_MS = 5 * 60 * 1000;

async function listPeptides(req, res, next) {
  try {
    const { search, type, category, limit = 20, offset = 0 } = req.query;

    const where = { isActive: true };
    if (type) where.type = type;
    if (search) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        buildLooseSearchClause(search),
      ].filter(Boolean);
    }
    if (category) where.healthCategories = { [Op.contains]: [category.toLowerCase()] };

    const { count, rows } = await Peptide.findAndCountAll({
      where,
      limit,
      offset,
      order: [['name', 'ASC']],
      attributes: { exclude: ['preparationNotes', 'howItWorks'] },
    });

    const data = rows.map((r) => attachImageUrl(r.toJSON()));
    return res.json({ success: true, total: count, limit, offset, data });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const now = Date.now();
    if (categoriesCache && now - categoriesCachedAt < CATEGORIES_TTL_MS) {
      return res.json({ success: true, categories: categoriesCache });
    }

    const [rows] = await sequelize.query(`
      SELECT DISTINCT jsonb_array_elements_text(health_categories) AS category
      FROM peptides
      WHERE is_active = true
      ORDER BY category
    `);

    const categories = rows.map((row) => row.category);
    categoriesCache = categories;
    categoriesCachedAt = now;

    return res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

async function findByName(req, res, next) {
  try {
    const looseSearch = buildLooseSearchClause(req.params.name);
    const peptides = await Peptide.findAll({
      where: {
        isActive: true,
        ...(looseSearch ? { [Op.and]: [looseSearch] } : {}),
      },
      order: [['name', 'ASC']],
      limit: 20,
    });

    const data = peptides.map((p) => attachImageUrl(p.toJSON()));
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getPeptideById(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug || req.params.id;
    const isUUID = UUID_RE.test(idOrSlug);

    const where = { isActive: true };
    if (isUUID) {
      where.id = idOrSlug;
    } else {
      where.slug = idOrSlug;
    }
    const peptide = await Peptide.findOne({
      where,
      include: [{ model: DosingStep, as: 'dosingSteps', order: [['step_order', 'ASC']] }],
    });

    if (!peptide) throw createError('Peptide not found.', 404);

    const scheduleVariants = {};
    for (const step of peptide.dosingSteps || []) {
      if (!scheduleVariants[step.scheduleName]) {
        scheduleVariants[step.scheduleName] = {
          name: step.scheduleName,
          steps: [],
          summary: scheduleEngine.getEscalationSummary(peptide.dosingSteps, step.scheduleName),
        };
      }
      scheduleVariants[step.scheduleName].steps.push(step);
    }

    const peptideData = attachImageUrl(peptide.toJSON());
    return res.json({
      success: true,
      data: {
        ...peptideData,
        scheduleVariants: Object.values(scheduleVariants),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPeptides,
  listCategories,
  findByName,
  getPeptideById,
};
