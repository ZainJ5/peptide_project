'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_schedules', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'users', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      name: {
        type:         Sequelize.STRING(200),
        allowNull:    false,
        defaultValue: 'My Peptide Schedule',
      },
      start_date: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      duration_weeks: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 8,
      },
      is_generated: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      notes: {
        type:      Sequelize.TEXT,
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

    await queryInterface.addIndex('user_schedules', ['user_id'], { name: 'user_schedules_user_id_idx' });
    await queryInterface.addIndex('user_schedules', ['user_id', 'created_at'], { name: 'user_schedules_user_date_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_schedules');
  },
};
