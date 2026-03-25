'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedule_items', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      schedule_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'user_schedules', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      peptide_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'peptides', key: 'id' },
        onDelete:   'RESTRICT',
        onUpdate:   'CASCADE',
      },
      position: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      selected_schedule_name: {
        type:      Sequelize.STRING(300),
        allowNull: true,
      },
      is_overridden: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      override_time_of_day: {
        type:      Sequelize.ENUM('AM', 'PM', 'BOTH'),
        allowNull: true,
      },
      override_days_of_week: {
        type:      Sequelize.JSONB,
        allowNull: true,
      },
      override_dose_units: {
        type:      Sequelize.FLOAT,
        allowNull: true,
      },
      override_frequency: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      override_rest_weeks: {
        type:      Sequelize.INTEGER,
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

    await queryInterface.addIndex('schedule_items', ['schedule_id'], { name: 'schedule_items_schedule_id_idx' });
    // Enforce one peptide per schedule
    await queryInterface.addIndex('schedule_items', ['schedule_id', 'peptide_id'], {
      unique: true,
      name:   'schedule_items_unique_peptide_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('schedule_items');
  },
};
