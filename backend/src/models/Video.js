'use strict';

const { DataTypes } = require('sequelize');

/**
 * Video Model
 *
 * Educational how-to videos displayed in the Watch section of the app.
 * Managed by admins; optionally linked to a specific peptide.
 *
 * Embed and thumbnail URLs are derived from platform + videoId at query time
 * (see serializeVideo in routes/videos.js) and are never stored.
 */
module.exports = (sequelize) => {
  const Video = sequelize.define(
    'Video',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      title: {
        type:      DataTypes.STRING(300),
        allowNull: false,
      },

      description: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },

      // YouTube / Vimeo video ID — not the full URL
      videoId: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        field:     'video_id',
      },

      // "youtube" | "vimeo"
      platform: {
        type:         DataTypes.ENUM('youtube', 'vimeo'),
        allowNull:    false,
        defaultValue: 'youtube',
      },

      // Optional custom thumbnail; auto-derived from platform+videoId if null
      thumbnailUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'thumbnail_url',
      },

      durationSeconds: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'duration_seconds',
      },

      // "reconstitution" | "injection" | "peptide_specific" | "general"
      category: {
        type:         DataTypes.ENUM('reconstitution', 'injection', 'peptide_specific', 'general'),
        allowNull:    false,
        defaultValue: 'general',
      },

      // Optional link to a specific peptide
      peptideId: {
        type:       DataTypes.UUID,
        allowNull:  true,
        field:      'peptide_id',
        references: { model: 'peptides', key: 'id' },
        onDelete:   'SET NULL',
      },

      // Display order — lower values shown first
      sortOrder: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 100,
        field:        'sort_order',
      },

      isActive: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
        field:        'is_active',
      },
    },
    {
      tableName:   'videos',
      underscored: true,
      indexes: [
        { fields: ['category'] },
        { fields: ['peptide_id'] },
        { fields: ['sort_order'] },
        { fields: ['is_active', 'sort_order'] }, // supports primary list query
      ],
    }
  );

  Video.associate = (models) => {
    Video.belongsTo(models.Peptide, {
      foreignKey: 'peptide_id',
      as:         'peptide',
    });
  };

  return Video;
};
