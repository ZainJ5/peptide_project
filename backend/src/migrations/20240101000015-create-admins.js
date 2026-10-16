'use strict';

/**
 * Admin panel accounts.
 *
 * Kept separate from `users` on purpose: admin credentials are a username (not
 * an email), use their own JWT secret, and support lockout after repeated
 * failed logins. Create / reset the account with:
 *   npm run admin:create
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');

    await queryInterface.createTable('admins', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey:   true,
        allowNull:    false,
      },
      username: {
        type:      Sequelize.DataTypes.CITEXT,
        allowNull: false,
        unique:    true,
      },
      password_hash: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      display_name: {
        type:      Sequelize.STRING(100),
        allowNull: true,
      },
      // Bumped on logout / password change to revoke every issued token.
      token_version: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      failed_login_attempts: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      locked_until: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      last_login_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      last_login_ip: {
        type:      Sequelize.STRING(64),
        allowNull: true,
      },
      password_changed_at: {
        type:      Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
      },
      created_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admins');
  },
};
