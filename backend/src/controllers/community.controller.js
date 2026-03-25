'use strict';

const { Op } = require('sequelize');

const { CommunityPost, PostUpvote, Peptide, User, sequelize } = require('../models');
const { createError } = require('../middleware/errorHandler');
const config = require('../config');
const { sendPeptideRequestEmail } = require('../services/emailService');

const PEPTIDE_ATTRS = { model: Peptide, as: 'peptide', attributes: ['id', 'name', 'mgAmount'] };
const AUTHOR_ATTRS = { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatarUrl'] };

async function listPosts(req, res, next) {
  try {
    const { peptideId, peptideName, benefit, sideEffect, search, authorId, limit = 20, offset = 0 } = req.query;

    const where = { isVisible: true };
    if (peptideId) where.peptideId = peptideId;
    if (authorId) where.userId = authorId;
    if (benefit) where.benefitsTags = { [Op.contains]: [benefit.toLowerCase()] };
    if (sideEffect) where.sideEffectsTags = { [Op.contains]: [sideEffect.toLowerCase()] };

    if (search) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(
          `to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ${sequelize.escape(search)})`
        ),
      ];
    }

    const peptideInclude = {
      ...PEPTIDE_ATTRS,
      required: Boolean(peptideName),
      ...(peptideName && { where: { name: { [Op.iLike]: `%${peptideName}%` } } }),
    };

    const { count, rows } = await CommunityPost.findAndCountAll({
      where,
      include: [peptideInclude, AUTHOR_ATTRS],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    let postsData = rows.map(post => post.toJSON());
    if (req.user && postsData.length > 0) {
      const postIds = postsData.map(post => post.id);
      const userUpvotes = await PostUpvote.findAll({
        where: {
          userId: req.user.id,
          postId: { [Op.in]: postIds }
        },
        attributes: ['postId']
      });
      const upvotedPostIds = new Set(userUpvotes.map(upvote => upvote.postId));
      
      postsData = postsData.map(post => ({
        ...post,
        hasUpvoted: upvotedPostIds.has(post.id)
      }));
    } else {
      postsData = postsData.map(post => ({
        ...post,
        hasUpvoted: false
      }));
    }

    return res.json({ success: true, total: count, limit, offset, data: postsData });
  } catch (err) {
    next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const post = await CommunityPost.findOne({
      where: { id: req.params.id, isVisible: true },
      include: [PEPTIDE_ATTRS, AUTHOR_ATTRS],
    });

    if (!post) throw createError('Post not found.', 404);

    let hasUpvoted = false;
    if (req.user) {
      const upvote = await PostUpvote.findOne({
        where: { userId: req.user.id, postId: post.id }
      });
      hasUpvoted = !!upvote;
    }

    return res.json({ success: true, data: { ...post.toJSON(), hasUpvoted } });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const { peptideId, title, content, doseUsed, durationUsed, benefitsTags, sideEffectsTags } = req.body;

    const peptide = await Peptide.findByPk(peptideId);
    if (!peptide) throw createError('Peptide not found.', 404);

    const post = await CommunityPost.create({
      userId: req.user.id,
      peptideId,
      title,
      content,
      doseUsed: doseUsed || null,
      durationUsed: durationUsed || null,
      benefitsTags: benefitsTags || [],
      sideEffectsTags: sideEffectsTags || [],
    });

    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const post = await CommunityPost.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!post) throw createError('Post not found or you do not own it.', 404);

    const { title, content, doseUsed, durationUsed, benefitsTags, sideEffectsTags } = req.body;

    await post.update({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(doseUsed !== undefined && { doseUsed }),
      ...(durationUsed !== undefined && { durationUsed }),
      ...(benefitsTags !== undefined && { benefitsTags }),
      ...(sideEffectsTags !== undefined && { sideEffectsTags }),
    });

    return res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.userId = req.user.id;

    const post = await CommunityPost.findOne({ where });
    if (!post) throw createError('Post not found or not authorized.', 404);

    // Destroy dependent upvotes first to avoid FK constraint violations
    await PostUpvote.destroy({ where: { postId: post.id } });
    await post.destroy();

    return res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
}

async function upvotePost(req, res, next) {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    if (!post || !post.isVisible) throw createError('Post not found.', 404);

    const upvote = await PostUpvote.findOne({ where: { userId: req.user.id, postId: post.id } });

    let hasUpvoted = false;
    if (upvote) {
      await upvote.destroy();
      await post.decrement('upvotes');
    } else {
      await PostUpvote.create({ userId: req.user.id, postId: post.id });
      await post.increment('upvotes');
      hasUpvoted = true;
    }

    await post.reload({ attributes: ['upvotes'] });
    return res.json({ success: true, upvotes: post.upvotes, hasUpvoted });
  } catch (err) {
    next(err);
  }
}

async function flagPost(req, res, next) {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    if (!post) throw createError('Post not found.', 404);

    await post.update({ isFlagged: true });
    return res.json({ success: true, message: 'Post flagged for review.' });
  } catch (err) {
    next(err);
  }
}

async function requestPeptide(req, res, next) {
  try {
    if (!config.email.adminTo) {
      throw createError('Admin email is not configured. Please set ADMIN_EMAIL.', 500);
    }

    const { peptideName, goal, details } = req.body;
    const requesterName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'User';

    await sendPeptideRequestEmail({
      requesterName,
      requesterEmail: req.user.email,
      userId: req.user.id,
      peptideName,
      goal,
      details,
    });

    return res.status(201).json({
      success: true,
      message: 'Request sent successfully. Our team will review and respond soon.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  upvotePost,
  flagPost,
  requestPeptide,
};
