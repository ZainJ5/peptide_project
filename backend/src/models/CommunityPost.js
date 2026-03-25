'use strict';

const { DataTypes } = require('sequelize');

/**
 * CommunityPost Model
 *
 * User-submitted experience reports for a specific peptide.
 * Searchable by peptide name, benefit tags, and side-effect tags.
 *
 * Moderation: posts are visible immediately on creation but can be
 * flagged by any authenticated user and hidden by admins via
 * the isFlagged / isVisible fields.
 */
module.exports = (sequelize) => {
  const CommunityPost = sequelize.define(
    'CommunityPost',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // null when user has deleted their account (SET NULL on delete)
      userId: {
        type:       DataTypes.UUID,
        allowNull:  true,
        field:      'user_id',
        references: { model: 'users', key: 'id' },
        onDelete:   'SET NULL',
      },

      peptideId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        field:      'peptide_id',
        references: { model: 'peptides', key: 'id' },
        onDelete:   'CASCADE',
      },

      title: {
        type:      DataTypes.STRING(300),
        allowNull: false,
        validate:  { len: [5, 300] },
      },

      content: {
        type:      DataTypes.TEXT,
        allowNull: false,
        validate:  { len: [10, 10000] },
      },

      // What dose the user was taking, e.g. "250 mcg / 8 units"
      doseUsed: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'dose_used',
      },

      // How long they used it, e.g. "6 weeks", "3 months"
      durationUsed: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'duration_used',
      },

      // e.g. ["weight loss", "fat oxidation"]
      benefitsTags: {
        type:         DataTypes.JSONB,
        allowNull:    false,
        defaultValue: [],
        field:        'benefits_tags',
      },

      // e.g. ["injection site redness", "headache"]
      sideEffectsTags: {
        type:         DataTypes.JSONB,
        allowNull:    false,
        defaultValue: [],
        field:        'side_effects_tags',
      },

      upvotes: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },

      isVisible: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
        field:        'is_visible',
      },

      isFlagged: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        field:        'is_flagged',
      },
    },
    {
      tableName:   'community_posts',
      underscored: true,
      indexes: [
        { fields: ['peptide_id'] },
        { fields: ['user_id'] },
        // Primary list query: visible posts newest-first
        { fields: ['is_visible', 'created_at'] },
        // JSONB tag containment
        { fields: ['benefits_tags'],     using: 'gin' },
        { fields: ['side_effects_tags'], using: 'gin' },
        // Full-text search across title + content
        {
          fields: [sequelize.literal("to_tsvector('english', title || ' ' || content)")],
          using:  'gin',
          name:   'community_posts_fts_idx',
        },
      ],
    }
  );

  CommunityPost.associate = (models) => {
    CommunityPost.belongsTo(models.User, {
      foreignKey: 'user_id',
      as:         'author',
    });

    CommunityPost.belongsTo(models.Peptide, {
      foreignKey: 'peptide_id',
      as:         'peptide',
    });
  };

  return CommunityPost;
};
