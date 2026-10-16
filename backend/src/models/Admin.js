'use strict';

const { DataTypes } = require('sequelize');

/**
 * Admin Model
 *
 * Accounts for the admin panel (/admin on the website). Separate from User:
 * username-based login, dedicated JWT secret, and lockout after repeated
 * failed attempts.
 *
 * Default scope hides the password hash. Use Admin.scope('withPassword')
 * only where the hash is compared.
 */
module.exports = (sequelize) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // CITEXT: login is case-insensitive
      username: {
        type:      DataTypes.CITEXT,
        allowNull: false,
        unique:    true,
      },

      passwordHash: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        field:     'password_hash',
      },

      displayName: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'display_name',
      },

      tokenVersion: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
        field:        'token_version',
      },

      failedLoginAttempts: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 0,
        field:        'failed_login_attempts',
      },

      lockedUntil: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'locked_until',
      },

      lastLoginAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'last_login_at',
      },

      lastLoginIp: {
        type:      DataTypes.STRING(64),
        allowNull: true,
        field:     'last_login_ip',
      },

      passwordChangedAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'password_changed_at',
      },

      isActive: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
        field:        'is_active',
      },
    },
    {
      tableName:   'admins',
      underscored: true,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  return Admin;
};
