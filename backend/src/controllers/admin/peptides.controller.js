'use strict';

const { Op } = require('sequelize');

const { Peptide, DosingStep, ScheduleItem, CommunityPost, sequelize } = require('../../models');
const { createError } = require('../../middleware/errorHandler');
const { invalidateCategoriesCache } = require('../peptides.controller');
const { slugify, cleanStringArray } = require('../../utils/adminValidators');
const { sortSteps } = require('../../utils/dosingSteps');
const logger = require('../../utils/logger');

/** Peptide columns an admin may write. Anything else in the body is ignored. */
const EDITABLE_FIELDS = [
  'name', 'mgAmount', 'protocolTitle', 'slug', 'type',
  'reconstitutionMl', 'reconstitutionRaw', 'howItWorks',
  'sideEffects', 'benefits', 'healthCategories',
  'injectionFrequencyRaw', 'cycleDurationRaw', 'preparationNotes',
  'sourceUrl', 'imageUrl', 'reconstitutionImageUrl', 'isActive',
];

const NULLABLE_TEXT = [
  'mgAmount', 'reconstitutionRaw', 'howItWorks', 'injectionFrequencyRaw',
  'cycleDurationRaw', 'preparationNotes', 'sourceUrl', 'imageUrl', 'reconstitutionImageUrl',
];

const SORTS = {
  name:    [['name', 'ASC'], ['mgAmount', 'ASC']],
  updated: [['updatedAt', 'DESC']],
  created: [['createdAt', 'DESC']],
};

/** Content-health filters used by the dashboard ("needs attention" links). */
const ISSUE_FILTERS = {
  missingOverview:   '("Peptide".how_it_works IS NULL OR length(trim("Peptide".how_it_works)) = 0)',
  missingDosing:     'NOT EXISTS (SELECT 1 FROM dosing_steps ds WHERE ds.peptide_id = "Peptide".id)',
  missingCategories: 'jsonb_array_length("Peptide".health_categories) = 0',
  missingImage:      '"Peptide".image_url IS NULL',
};

// Matches the format of rows produced by the seed / addMotsC40 scripts so the
// mobile app and the schedule engine's rowData fallback keep working.
const TABLE_HEADERS = ['Week', 'Daily Dose (mcg)', 'Units (per injection) (mL)'];

function pickPeptideFields(body) {
  const data = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  for (const key of NULLABLE_TEXT) {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim() || null;
    }
  }
  if (data.reconstitutionMl === '') data.reconstitutionMl = null;
  if (data.slug === '' || data.slug === null) delete data.slug;
  if (data.sideEffects !== undefined) data.sideEffects = cleanStringArray(data.sideEffects);
  if (data.benefits !== undefined) data.benefits = cleanStringArray(data.benefits);
  if (data.healthCategories !== undefined) {
    data.healthCategories = cleanStringArray(data.healthCategories, { lowercase: true });
  }
  if (typeof data.mgAmount === 'string') data.mgAmount = data.mgAmount.toUpperCase();
  return data;
}

function formatUnits(step) {
  if (step.unitsPerInjection == null) return '';
  const units = `${step.unitsPerInjection} units`;
  return step.volumeMl != null ? `${units} (${step.volumeMl} mL)` : units;
}

/**
 * Turn the editor's flat step list into DosingStep rows. Step order is the
 * position within its variant; variants keep the order they first appear in
 * (the first variant is the one shown on the public detail page).
 */
function buildStepRows(peptideId, steps) {
  const counters = new Map();
  const variantIndex = new Map();
  const base = Date.now();

  return steps.map((step) => {
    const scheduleName = step.scheduleName.trim();
    const order = (counters.get(scheduleName) || 0) + 1;
    counters.set(scheduleName, order);
    if (!variantIndex.has(scheduleName)) variantIndex.set(scheduleName, variantIndex.size);

    const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    const row = {
      peptideId,
      scheduleName,
      stepOrder:         order,
      weekRangeLabel:    step.weekRangeLabel?.trim() || null,
      weekStart:         num(step.weekStart),
      weekEnd:           num(step.weekEnd),
      dailyDoseLabel:    step.dailyDoseLabel?.trim() || null,
      dailyDoseMcg:      num(step.dailyDoseMcg),
      unitsPerInjection: num(step.unitsPerInjection),
      volumeMl:          num(step.volumeMl),
      tableHeaders:      TABLE_HEADERS,
      // createdAt is staggered per variant so reads can restore variant order.
      createdAt:         new Date(base + variantIndex.get(scheduleName)),
      updatedAt:         new Date(base),
    };
    row.rowData = {
      [TABLE_HEADERS[0]]: row.weekRangeLabel || '',
      [TABLE_HEADERS[1]]: row.dailyDoseLabel || (row.dailyDoseMcg != null ? `${row.dailyDoseMcg} mcg` : ''),
      [TABLE_HEADERS[2]]: formatUnits(row),
    };
    return row;
  });
}

async function replaceDosingSteps(peptideId, steps, variantRenames, transaction) {
  await DosingStep.destroy({ where: { peptideId }, transaction });
  if (steps.length) {
    await DosingStep.bulkCreate(buildStepRows(peptideId, steps), { transaction });
  }

  // Keep users' saved schedules pointing at a variant that still exists.
  for (const { from, to } of variantRenames || []) {
    if (!from || !to || from === to) continue;
    await ScheduleItem.update(
      { selectedScheduleName: to },
      { where: { peptideId, selectedScheduleName: from }, transaction }
    );
  }
}

async function ensureUnique(data, excludeId, transaction) {
  const checks = [];
  if (data.slug) checks.push({ field: 'slug', value: data.slug, label: 'URL slug' });
  if (data.protocolTitle) checks.push({ field: 'protocolTitle', value: data.protocolTitle, label: 'Protocol title' });

  for (const { field, value, label } of checks) {
    const where = { [field]: value };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const clash = await Peptide.findOne({ where, attributes: ['id', 'name', 'mgAmount'], transaction });
    if (clash) {
      throw createError(
        `${label} "${value}" is already used by ${clash.name}${clash.mgAmount ? ` ${clash.mgAmount}` : ''}.`,
        409
      );
    }
  }
}

/** Pick a free slug based on `base`, appending -2, -3… when taken. */
async function availableSlug(base, transaction) {
  const root = base || 'peptide';
  const taken = await Peptide.findAll({
    where: { slug: { [Op.or]: [root, { [Op.like]: `${root}-%` }] } },
    attributes: ['slug'],
    transaction,
  });
  const set = new Set(taken.map((p) => p.slug));
  if (!set.has(root)) return root;
  for (let i = 2; i < 1000; i += 1) {
    if (!set.has(`${root}-${i}`)) return `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

async function loadFull(id, transaction) {
  const peptide = await Peptide.findByPk(id, {
    include: [{ model: DosingStep, as: 'dosingSteps' }],
    transaction,
  });
  if (!peptide) throw createError('Peptide not found.', 404);

  const json = peptide.toJSON();
  json.dosingSteps = sortSteps(json.dosingSteps || []);
  return json;
}

async function listPeptides(req, res, next) {
  try {
    const {
      search, type, category, issue, status = 'all', sort = 'name', limit = 25, offset = 0,
    } = req.query;

    const where = {};
    if (issue && ISSUE_FILTERS[issue]) where[Op.and] = [sequelize.literal(ISSUE_FILTERS[issue])];
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (type) where.type = type;
    if (category) where.healthCategories = { [Op.contains]: [category.toLowerCase()] };
    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: like } },
        { protocolTitle: { [Op.iLike]: like } },
        { slug: { [Op.iLike]: like } },
        { mgAmount: { [Op.iLike]: like } },
      ];
    }

    const { count, rows } = await Peptide.findAndCountAll({
      where,
      limit,
      offset,
      order: SORTS[sort] || SORTS.name,
      attributes: [
        'id', 'name', 'mgAmount', 'protocolTitle', 'slug', 'type', 'isActive',
        'healthCategories', 'imageUrl', 'reconstitutionMl', 'updatedAt', 'createdAt',
        [
          sequelize.literal('(SELECT COUNT(*)::int FROM dosing_steps ds WHERE ds.peptide_id = "Peptide".id)'),
          'dosingStepCount',
        ],
        [
          sequelize.literal('(how_it_works IS NULL OR length(trim(how_it_works)) = 0)'),
          'missingOverview',
        ],
      ],
    });

    return res.json({ success: true, total: count, limit, offset, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getPeptide(req, res, next) {
  try {
    const data = await loadFull(req.params.id);
    const [scheduleItemCount, communityPostCount] = await Promise.all([
      ScheduleItem.count({ where: { peptideId: req.params.id } }),
      CommunityPost.count({ where: { peptideId: req.params.id } }),
    ]);
    return res.json({ success: true, data, usage: { scheduleItemCount, communityPostCount } });
  } catch (err) {
    next(err);
  }
}

async function createPeptide(req, res, next) {
  try {
    const data = pickPeptideFields(req.body);
    const result = await sequelize.transaction(async (transaction) => {
      data.slug = data.slug || await availableSlug(slugify(data.name, data.mgAmount), transaction);
      await ensureUnique(data, null, transaction);

      const peptide = await Peptide.create(data, { transaction });
      if (Array.isArray(req.body.dosingSteps)) {
        await replaceDosingSteps(peptide.id, req.body.dosingSteps, [], transaction);
      }
      return loadFull(peptide.id, transaction);
    });

    invalidateCategoriesCache();
    logger.info('Admin created peptide', { adminId: req.admin.id, peptideId: result.id, slug: result.slug });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function updatePeptide(req, res, next) {
  try {
    const data = pickPeptideFields(req.body);
    const result = await sequelize.transaction(async (transaction) => {
      const peptide = await Peptide.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!peptide) throw createError('Peptide not found.', 404);

      // If the client last saw an older version, refuse rather than overwrite.
      const expected = req.body.expectedUpdatedAt;
      if (expected && new Date(expected).getTime() !== new Date(peptide.updatedAt).getTime()) {
        throw createError('This peptide was changed by someone else since you opened it. Reload to get the latest version.', 409);
      }

      await ensureUnique(data, peptide.id, transaction);
      await peptide.update(data, { transaction });

      if (Array.isArray(req.body.dosingSteps)) {
        await replaceDosingSteps(peptide.id, req.body.dosingSteps, req.body.variantRenames, transaction);
        // Dosing-only edits must still move updatedAt for conflict detection.
        peptide.changed('updatedAt', true);
        await peptide.save({ transaction });
      }
      return loadFull(peptide.id, transaction);
    });

    invalidateCategoriesCache();
    logger.info('Admin updated peptide', {
      adminId: req.admin.id,
      peptideId: result.id,
      fields: Object.keys(data),
      dosingSteps: Array.isArray(req.body.dosingSteps),
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const peptide = await Peptide.findByPk(req.params.id);
    if (!peptide) throw createError('Peptide not found.', 404);
    await peptide.update({ isActive: req.body.isActive });
    invalidateCategoriesCache();
    logger.info('Admin changed peptide status', { adminId: req.admin.id, peptideId: peptide.id, isActive: peptide.isActive });
    return res.json({ success: true, data: { id: peptide.id, slug: peptide.slug, isActive: peptide.isActive, updatedAt: peptide.updatedAt } });
  } catch (err) {
    next(err);
  }
}

/** Copy a peptide (and its dosing table) as a hidden draft. */
async function duplicatePeptide(req, res, next) {
  try {
    const result = await sequelize.transaction(async (transaction) => {
      const source = await loadFull(req.params.id, transaction);
      const fields = {};
      for (const key of EDITABLE_FIELDS) fields[key] = source[key];

      fields.slug = await availableSlug(`${source.slug}-copy`, transaction);
      fields.protocolTitle = `${source.protocolTitle} (Copy)`;
      for (let i = 2; await Peptide.count({ where: { protocolTitle: fields.protocolTitle }, transaction }); i += 1) {
        fields.protocolTitle = `${source.protocolTitle} (Copy ${i})`;
      }
      fields.isActive = false;

      const copy = await Peptide.create(fields, { transaction });
      await replaceDosingSteps(copy.id, source.dosingSteps, [], transaction);
      return loadFull(copy.id, transaction);
    });

    logger.info('Admin duplicated peptide', { adminId: req.admin.id, from: req.params.id, to: result.id });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function deletePeptide(req, res, next) {
  try {
    const peptide = await Peptide.findByPk(req.params.id);
    if (!peptide) throw createError('Peptide not found.', 404);

    const inSchedules = await ScheduleItem.count({ where: { peptideId: peptide.id } });
    if (inSchedules > 0) {
      throw createError(
        `This peptide is used in ${inSchedules} user schedule item(s) and can't be deleted. Hide it instead so it no longer appears on the site.`,
        409
      );
    }

    const { slug } = peptide;
    // Dosing steps and community posts cascade at the database level.
    await peptide.destroy();
    invalidateCategoriesCache();
    logger.warn('Admin deleted peptide', { adminId: req.admin.id, peptideId: req.params.id, slug });
    return res.json({ success: true, data: { id: req.params.id, slug } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPeptides,
  getPeptide,
  createPeptide,
  updatePeptide,
  setStatus,
  duplicatePeptide,
  deletePeptide,
};
