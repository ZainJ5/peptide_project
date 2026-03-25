'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');

    await queryInterface.createTable('users', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      email: {
        type:      Sequelize.DataTypes.CITEXT,
        allowNull: false,
        unique:    true,
      },
      password_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      avatar_url: {
        type:      Sequelize.STRING(500),
        allowNull: true,
      },
      is_verified: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
      },
      verification_token: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      reset_token: {
        type:      Sequelize.STRING(255),
        allowNull: true,
      },
      reset_token_expires: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      role: {
        type:         Sequelize.ENUM('user', 'admin'),
        allowNull:    false,
        defaultValue: 'user',
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

    await queryInterface.addIndex('users', ['email'],    { unique: true, name: 'users_email_idx' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'users_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
