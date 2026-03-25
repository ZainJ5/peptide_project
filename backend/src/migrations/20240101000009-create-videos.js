'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('videos', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      title: {
        type:      Sequelize.STRING(300),
        allowNull: false,
      },
      description: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      video_id: {
        type:      Sequelize.STRING(200),
        allowNull: false,
        comment:   'Platform-specific video ID (e.g. YouTube videoId)',
      },
      platform: {
        type:         Sequelize.ENUM('youtube', 'vimeo'),
        allowNull:    false,
        defaultValue: 'youtube',
      },
      thumbnail_url: {
        type:      Sequelize.STRING(1000),
        allowNull: true,
        comment:   'Optional override; auto-derived for YouTube if null',
      },
      duration_seconds: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      category: {
        type:         Sequelize.ENUM('reconstitution', 'injection', 'peptide_specific', 'general'),
        allowNull:    false,
        defaultValue: 'general',
      },
      peptide_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'peptides', key: 'id' },
        onDelete:   'SET NULL',
        onUpdate:   'CASCADE',
      },
      sort_order: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
      },
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('videos', ['is_active', 'sort_order'], { name: 'videos_active_order_idx' });
    await queryInterface.addIndex('videos', ['peptide_id'],              { name: 'videos_peptide_id_idx' });
    await queryInterface.addIndex('videos', ['category'],                { name: 'videos_category_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('videos');
  },
};
