'use strict';

const { DataTypes } = require('sequelize');

/**
 * User Model
 *
 * Stores registered app users.
 * Passwords are stored as bcrypt hashes — never plain text.
 * Email verification and password reset flows use time-limited tokens.
 *
 * Default scope excludes all sensitive fields.
 * Use named scopes (withPassword, withTokens) explicitly where needed:
 *   User.scope('withPassword').findOne({ where: { email } })
 */
module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // CITEXT: case-insensitive — "User@Example.com" === "user@example.com"
      email: {
        type:      DataTypes.CITEXT,
        allowNull: false,
        unique:    true,
        validate:  { isEmail: true },
      },

      passwordHash: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        field:     'password_hash',
      },

      firstName: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        field:     'first_name',
      },

      lastName: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'last_name',
      },

      avatarUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'avatar_url',
      },

      isVerified: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        field:        'is_verified',
      },

      verificationToken: {
        type:      DataTypes.STRING(255),
        allowNull: true,
        field:     'verification_token',
      },

      verificationTokenExpires: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'verification_token_expires',
      },

      resetToken: {
        type:      DataTypes.STRING(255),
        allowNull: true,
        field:     'reset_token',
      },

      resetTokenExpires: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'reset_token_expires',
      },

      role: {
        type:         DataTypes.ENUM('user', 'admin'),
        allowNull:    false,
        defaultValue: 'user',
      },

      isActive: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
        field:        'is_active',
      },
    },
    {
      tableName:   'users',
      underscored: true,
      defaultScope: {
        // Never return sensitive fields by default
        attributes: {
          exclude: ['passwordHash', 'verificationToken', 'verificationTokenExpires', 'resetToken', 'resetTokenExpires'],
        },
      },
      scopes: {
        withPassword: { attributes: {} }, // all fields including passwordHash
        withTokens:   { attributes: {} }, // all fields including token columns
      },
      indexes: [
        { fields: ['email'],     unique: true },
        { fields: ['is_active'] },
      ],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.UserSchedule, {
      foreignKey: 'user_id',
      as:         'schedules',
      onDelete:   'CASCADE',
    });

    User.hasMany(models.CommunityPost, {
      foreignKey: 'user_id',
      as:         'posts',
      onDelete:   'SET NULL',
    });
  };

  return User;
};
