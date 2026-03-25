'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('peptides', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      name: {
        type:      Sequelize.STRING(200),
        allowNull: false,
      },
      mg_amount: {
        type:      Sequelize.STRING(50),
        allowNull: true,
      },
      protocol_title: {
        type:      Sequelize.STRING(500),
        allowNull: false,
        unique:    true,
      },
      type: {
        type:         Sequelize.ENUM('single', 'blend'),
        allowNull:    false,
        defaultValue: 'single',
      },
      reconstitution_ml: {
        type:      Sequelize.FLOAT,
        allowNull: true,
      },
      reconstitution_raw: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      how_it_works: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      side_effects: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },
      benefits: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },
      injection_frequency_raw: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      cycle_duration_raw: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      preparation_notes: {
        type:      Sequelize.TEXT,
        allowNull: true,
      },
      health_categories: {
        type:         Sequelize.JSONB,
        allowNull:    false,
        defaultValue: [],
      },
      source_url: {
        type:      Sequelize.STRING(1000),
        allowNull: true,
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

    await queryInterface.addIndex('peptides', ['name'],      { name: 'peptides_name_idx' });
    await queryInterface.addIndex('peptides', ['type'],      { name: 'peptides_type_idx' });
    await queryInterface.addIndex('peptides', ['is_active'], { name: 'peptides_is_active_idx' });
    await queryInterface.addIndex('peptides', ['protocol_title'], { unique: true, name: 'peptides_protocol_title_idx' });

    // GIN indexes for JSONB array containment queries (healthCategories, benefits, sideEffects)
    await queryInterface.sequelize.query(`
      CREATE INDEX peptides_health_categories_gin_idx ON peptides USING gin (health_categories);
      CREATE INDEX peptides_side_effects_gin_idx      ON peptides USING gin (side_effects);
      CREATE INDEX peptides_benefits_gin_idx          ON peptides USING gin (benefits);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('peptides');
  },
};
