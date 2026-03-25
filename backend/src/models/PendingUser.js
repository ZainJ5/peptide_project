'use strict';

const { DataTypes } = require('sequelize');

/**
 * PendingUser Model
 *
 * Stores users who have requested an account but have not yet verified their email.
 */
module.exports = (sequelize) => {
  const PendingUser = sequelize.define(
    'PendingUser',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },
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
      verificationToken: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        field:     'verification_token',
      },
      verificationTokenExpires: {
        type:      DataTypes.DATE,
        allowNull: false,
        field:     'verification_token_expires',
      },
    },
    {
      tableName:   'pending_users',
      underscored: true,
      indexes: [
        { fields: ['email'], unique: true },
      ],
    }
  );

  return PendingUser;
};
