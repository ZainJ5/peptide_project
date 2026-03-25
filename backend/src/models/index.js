'use strict';

const { sequelize } = require('../config/database');

const PeptideFactory       = require('./Peptide');
const DosingStepFactory    = require('./DosingStep');
const UserFactory          = require('./User');
const PendingUserFactory   = require('./PendingUser');
const UserScheduleFactory  = require('./UserSchedule');
const ScheduleItemFactory  = require('./ScheduleItem');
const CalendarEventFactory = require('./CalendarEvent');
const CommunityPostFactory = require('./CommunityPost');
const PostUpvoteFactory    = require('./PostUpvote');
const VideoFactory         = require('./Video');

// Instantiate every model against the shared sequelize instance
const Peptide       = PeptideFactory(sequelize);
const DosingStep    = DosingStepFactory(sequelize);
const User          = UserFactory(sequelize);
const PendingUser   = PendingUserFactory(sequelize);
const UserSchedule  = UserScheduleFactory(sequelize);
const ScheduleItem  = ScheduleItemFactory(sequelize);
const CalendarEvent = CalendarEventFactory(sequelize);
const CommunityPost = CommunityPostFactory(sequelize);
const PostUpvote    = PostUpvoteFactory(sequelize);
const Video         = VideoFactory(sequelize);

const models = {
  Peptide,
  DosingStep,
  User,
  PendingUser,
  UserSchedule,
  ScheduleItem,
  CalendarEvent,
  CommunityPost,
  PostUpvote,
  Video,
  sequelize,
};

// Run all association definitions in a second pass so every model is
// registered before any foreign-key reference is resolved.
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') model.associate(models);
});

module.exports = models;
