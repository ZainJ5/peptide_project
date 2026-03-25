'use strict';

const { DataTypes } = require('sequelize');

/**
 * UserSchedule Model
 *
 * A named dosing schedule created by a user.
 * Contains up to 10 ScheduleItems (peptide slots).
 * The schedule engine uses startDate + durationWeeks to generate
 * the full calendar of injection events.
 *
 * isGenerated is a dirty flag — it is set to false whenever the schedule
 * or any of its items are modified, signalling that the calendar must be
 * regenerated before the next download or calendar view.
 */
module.exports = (sequelize) => {
  const UserSchedule = sequelize.define(
    'UserSchedule',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      userId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        field:      'user_id',
        references: { model: 'users', key: 'id' },
        onDelete:   'CASCADE',
      },

      name: {
        type:         DataTypes.STRING(200),
        allowNull:    false,
        defaultValue: 'My Peptide Schedule',
      },

      // Stored as DATE (no time component)
      startDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        field:     'start_date',
      },

      // Total weeks the schedule runs before the first rest period (1–52)
      durationWeeks: {
        type:         DataTypes.INTEGER,
        allowNull:    false,
        defaultValue: 8,
        field:        'duration_weeks',
        validate:     { min: 1, max: 52 },
      },

      // True once the engine has generated all CalendarEvents
      isGenerated: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        field:        'is_generated',
      },

      notes: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName:   'user_schedules',
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['user_id', 'created_at'] }, // supports ORDER BY created_at DESC per user
      ],
    }
  );

  UserSchedule.associate = (models) => {
    UserSchedule.belongsTo(models.User, {
      foreignKey: 'user_id',
      as:         'user',
    });

    UserSchedule.hasMany(models.ScheduleItem, {
      foreignKey: 'schedule_id',
      as:         'items',
      onDelete:   'CASCADE',
    });

    UserSchedule.hasMany(models.CalendarEvent, {
      foreignKey: 'schedule_id',
      as:         'events',
      onDelete:   'CASCADE',
    });
  };

  return UserSchedule;
};
