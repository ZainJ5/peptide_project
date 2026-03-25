'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dosing_steps', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      peptide_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'peptides', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      schedule_name: {
        type:      Sequelize.STRING(300),
        allowNull: false,
      },
      step_order: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      week_range_label: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      week_start: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      week_end: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      daily_dose_label: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      daily_dose_mcg: {
        type:      Sequelize.FLOAT,
        allowNull: true,
      },
      units_per_injection: {
        type:      Sequelize.FLOAT,
        allowNull: true,
      },
      volume_ml: {
        type:      Sequelize.FLOAT,
        allowNull: true,
      },
      table_headers: {
        type:      Sequelize.JSONB,
        allowNull: true,
      },
      row_data: {
        type:      Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex('dosing_steps', ['peptide_id'], { name: 'dosing_steps_peptide_id_idx' });
    await queryInterface.addIndex('dosing_steps',
      ['peptide_id', 'schedule_name', 'step_order'],
      { unique: true, name: 'dosing_steps_unique_idx' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dosing_steps');
  },
};
