'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('community_posts', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  true,    // SET NULL when user deletes account
        references: { model: 'users', key: 'id' },
        onDelete:   'SET NULL',
        onUpdate:   'CASCADE',
      },
      peptide_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'peptides', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      title: {
        type:      Sequelize.STRING(300),
        allowNull: false,
      },
      content: {
        type:      Sequelize.TEXT,
        allowNull: false,
      },
      dose_used: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      duration_used: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      benefits_tags: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },
      side_effects_tags: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },
      upvotes: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      is_visible: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
      },
      is_flagged: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
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

    await queryInterface.addIndex('community_posts', ['peptide_id'],              { name: 'community_posts_peptide_id_idx' });
    await queryInterface.addIndex('community_posts', ['user_id'],                 { name: 'community_posts_user_id_idx' });
    await queryInterface.addIndex('community_posts', ['is_visible', 'created_at'], { name: 'community_posts_visible_date_idx' });
    // Composite for peptide+visible filter (the most common list query)
    await queryInterface.addIndex('community_posts', ['peptide_id', 'is_visible', 'created_at'], { name: 'community_posts_peptide_visible_idx' });

    // JSONB GIN indexes for tag containment queries
    await queryInterface.sequelize.query(`
      CREATE INDEX community_posts_benefits_gin_idx     ON community_posts USING gin (benefits_tags);
      CREATE INDEX community_posts_side_effects_gin_idx ON community_posts USING gin (side_effects_tags);
    `);

    // GIN full-text search index on title + content
    await queryInterface.sequelize.query(`
      CREATE INDEX community_posts_fts_idx
        ON community_posts
        USING gin (to_tsvector('english', title || ' ' || content));
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('community_posts');
  },
};
