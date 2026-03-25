'use strict';

const { DataTypes } = require('sequelize');

/**
 * PostUpvote Model
 *
 * Junction table that enforces one upvote per user per post.
 * The composite primary key (userId, postId) makes duplicate upvotes
 * a database-level constraint violation, not just application logic.
 *
 * When a user upvotes a post:
 *   1. INSERT into post_upvotes (userId, postId) — fails silently if duplicate
 *   2. If insert succeeded, INCREMENT community_posts.upvotes atomically
 *
 * This guarantees the upvote counter accurately reflects unique voters.
 */
module.exports = (sequelize) => {
  const PostUpvote = sequelize.define(
    'PostUpvote',
    {
      userId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        primaryKey: true,
        field:      'user_id',
        references: { model: 'users', key: 'id' },
        onDelete:   'CASCADE',
      },

      postId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        primaryKey: true,
        field:      'post_id',
        references: { model: 'community_posts', key: 'id' },
        onDelete:   'CASCADE',
      },
    },
    {
      tableName:   'post_upvotes',
      underscored: true,
      timestamps:  true,      // createdAt only — tracks when each user upvoted
      updatedAt:   false,
      indexes: [
        // Covered index for "which posts did this user upvote?" queries
        { fields: ['user_id', 'post_id'], unique: true },
        // Covered index for "how many unique upvoters does this post have?" queries
        { fields: ['post_id'] },
      ],
    }
  );

  PostUpvote.associate = (models) => {
    PostUpvote.belongsTo(models.User, {
      foreignKey: 'user_id',
      as:         'voter',
    });

    PostUpvote.belongsTo(models.CommunityPost, {
      foreignKey: 'post_id',
      as:         'post',
    });
  };

  return PostUpvote;
};
