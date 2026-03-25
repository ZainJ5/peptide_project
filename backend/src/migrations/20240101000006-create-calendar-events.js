'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_events', {
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
      schedule_item_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'schedule_items', key: 'id' },
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
      event_date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      time_of_day: {
        type:      Sequelize.ENUM('AM', 'PM', 'BOTH', 'MIDDAY'),
        allowNull: false,
      },
      dose_units: {
        type:         Sequelize.FLOAT,
        allowNull:    false,
        defaultValue: 0,
      },
      dose_label: {
        type:      Sequelize.STRING(200),
        allowNull: true,
      },
      escalation_step: {
        type:      Sequelize.INTEGER,
        allowNull: true,
      },
      is_rest_day: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      is_completed: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      completed_at: {
        type:      Sequelize.DATE,
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

    // Primary calendar query: all events for a schedule ordered by date
    await queryInterface.addIndex('calendar_events', ['schedule_id', 'event_date'], { name: 'calendar_events_schedule_date_idx' });
    // Completion tracking query
    await queryInterface.addIndex('calendar_events', ['schedule_id', 'is_completed', 'event_date'], { name: 'calendar_events_completion_idx' });
    await queryInterface.addIndex('calendar_events', ['schedule_item_id'], { name: 'calendar_events_item_id_idx' });
    await queryInterface.addIndex('calendar_events', ['peptide_id'],       { name: 'calendar_events_peptide_id_idx' });
    await queryInterface.addIndex('calendar_events', ['event_date'],       { name: 'calendar_events_event_date_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calendar_events');
  },
};
