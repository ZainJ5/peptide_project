'use strict';

const { Op, QueryTypes } = require('sequelize');

const {
  Peptide, User, UserSchedule, CommunityPost, sequelize,
} = require('../../models');
const { createError } = require('../../middleware/errorHandler');
const { invalidateCategoriesCache } = require('../peptides.controller');
const logger = require('../../utils/logger');

async function getStats(req, res, next) {
  try {
    const [[peptideCounts], users, schedules, posts, recent] = await Promise.all([
      sequelize.query(`
        SELECT
          COUNT(*)::int                                                         AS total,
          COUNT(*) FILTER (WHERE is_active)::int                                AS active,
          COUNT(*) FILTER (WHERE NOT is_active)::int                            AS hidden,
          COUNT(*) FILTER (WHERE type = 'single')::int                          AS singles,
          COUNT(*) FILTER (WHERE type = 'blend')::int                           AS blends,
          COUNT(*) FILTER (WHERE how_it_works IS NULL OR length(trim(how_it_works)) = 0)::int AS "missingOverview",
          COUNT(*) FILTER (WHERE image_url IS NULL)::int                        AS "missingImage",
          COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM dosing_steps ds WHERE ds.peptide_id = peptides.id
          ))::int                                                               AS "missingDosing",
          COUNT(*) FILTER (WHERE jsonb_array_length(health_categories) = 0)::int AS "missingCategories"
        FROM peptides
      `, { type: QueryTypes.SELECT }),
      User.count(),
      UserSchedule.count(),
      CommunityPost.count(),
      Peptide.findAll({
        attributes: ['id', 'name', 'mgAmount', 'slug', 'type', 'isActive', 'updatedAt'],
        order: [['updatedAt', 'DESC']],
        limit: 6,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        peptides: peptideCounts,
        users,
        schedules,
        communityPosts: posts,
        recentlyUpdated: recent,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Every category in use (including on hidden peptides) with peptide counts. */
async function listCategories(req, res, next) {
  try {
    const rows = await sequelize.query(`
      SELECT c.category,
             COUNT(*)::int                          AS total,
             COUNT(*) FILTER (WHERE p.is_active)::int AS active
      FROM peptides p
      CROSS JOIN LATERAL jsonb_array_elements_text(p.health_categories) AS c(category)
      GROUP BY c.category
      ORDER BY c.category
    `, { type: QueryTypes.SELECT });

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Rewrite one category across every peptide. With `to` it renames (merging
 * into an existing category without creating duplicates); without `to` it
 * removes the category. Element order is preserved.
 */
async function rewriteCategory(from, to) {
  const [, meta] = await sequelize.query(`
    UPDATE peptides p
    SET health_categories = (
          SELECT COALESCE(jsonb_agg(s.v ORDER BY s.o), '[]'::jsonb)
          FROM (
            SELECT CASE WHEN t.e = :from THEN CAST(:to AS text) ELSE t.e END AS v, MIN(t.o) AS o
            FROM jsonb_array_elements_text(p.health_categories) WITH ORDINALITY AS t(e, o)
            GROUP BY 1
          ) s
          WHERE s.v IS NOT NULL
        ),
        updated_at = NOW()
    WHERE p.health_categories ? :from
  `, { replacements: { from, to: to ?? null } });

  invalidateCategoriesCache();
  return meta?.rowCount ?? 0;
}

async function renameCategory(req, res, next) {
  try {
    const from = req.body.from.trim().toLowerCase();
    const to = req.body.to.replace(/\s+/g, ' ').trim().toLowerCase();
    if (from === to) throw createError('The new name is the same as the current one.', 400);

    const updated = await rewriteCategory(from, to);
    if (!updated) throw createError(`No peptides use the category "${from}".`, 404);

    logger.info('Admin renamed category', { adminId: req.admin.id, from, to, updated });
    return res.json({ success: true, data: { from, to, updated } });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const name = req.body.name.trim().toLowerCase();
    const updated = await rewriteCategory(name, null);
    if (!updated) throw createError(`No peptides use the category "${name}".`, 404);

    logger.info('Admin removed category', { adminId: req.admin.id, name, updated });
    return res.json({ success: true, data: { name, updated } });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { search, status = 'all', limit = 25, offset = 0 } = req.query;

    const where = {};
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { email: { [Op.iLike]: like } },
        { firstName: { [Op.iLike]: like } },
        { lastName: { [Op.iLike]: like } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'isActive', 'createdAt',
        [sequelize.literal('(SELECT COUNT(*)::int FROM user_schedules us WHERE us.user_id = "User".id)'), 'scheduleCount'],
      ],
    });

    return res.json({ success: true, total: count, limit, offset, data: rows });
  } catch (err) {
    next(err);
  }
}

async function setUserStatus(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw createError('User not found.', 404);
    await user.update({ isActive: req.body.isActive });

    logger.info('Admin changed user status', { adminId: req.admin.id, userId: user.id, isActive: user.isActive });
    return res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  listCategories,
  renameCategory,
  deleteCategory,
  listUsers,
  setUserStatus,
};
