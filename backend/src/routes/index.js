'use strict';

const express = require('express');

const { getHealth, getReadiness } = require('../controllers/health.controller');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const peptidesRoutes = require('./peptides.routes');
const schedulesRoutes = require('./schedules.routes');
const communityRoutes = require('./community.routes');
const videosRoutes = require('./videos.routes');
const pdfRoutes = require('./pdf.routes');
const newsletterRoutes = require('./newsletter.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/peptides', peptidesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/community', communityRoutes);
router.use('/videos', videosRoutes);
router.use('/pdf', pdfRoutes);
router.use('/newsletter', newsletterRoutes);

router.get('/health', getHealth);
router.get('/health/ready', getReadiness);

module.exports = router;
