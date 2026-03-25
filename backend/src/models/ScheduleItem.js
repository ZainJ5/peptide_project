'use strict';

const { DataTypes } = require('sequelize');

/**
 * ScheduleItem Model
 *
 * One peptide slot within a UserSchedule (up to 10 per schedule).
 *
 * Override logic:
 *   isOverridden = false  → engine uses the peptide's default escalation
 *                           table, frequency, and rest period from the DB.
 *   isOverridden = true   → engine uses the override_* fields instead,
 *                           applying a flat dose and ignoring the escalation
 *                           table entirely.
 *
 * The user must explicitly confirm (overrideConfirmed: true in the API)
 * before isOverridden can be set to true.
 */
module.exports = (sequelize) => {
  const ScheduleItem = sequelize.define(
    'ScheduleItem',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      scheduleId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        field:      'schedule_id',
        references: { model: 'user_schedules', key: 'id' },
        onDelete:   'CASCADE',
      },

      peptideId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        field:      'peptide_id',
        references: { model: 'peptides', key: 'id' },
      },

      // Slot number 1–10
      position: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        validate:  { min: 1, max: 10 },
      },

      // Which named schedule variant to use for escalation.
      // Null → engine picks the first (default) variant.
      selectedScheduleName: {
        type:      DataTypes.STRING(300),
        allowNull: true,
        field:     'selected_schedule_name',
      },

      isOverridden: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        field:        'is_overridden',
      },

      // ─── Override fields (only used when isOverridden = true) ──────────

      // "AM" | "PM" | "BOTH"
      overrideTimeOfDay: {
        type:      DataTypes.ENUM('AM', 'PM', 'BOTH'),
        allowNull: true,
        field:     'override_time_of_day',
      },

      // e.g. ["MON", "THU"]
      overrideDaysOfWeek: {
        type:      DataTypes.JSONB,
        allowNull: true,
        field:     'override_days_of_week',
      },

      // Fixed dose in syringe units — escalation table is ignored when set
      overrideDoseUnits: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        field:     'override_dose_units',
      },

      // e.g. "DAILY", "2X_WEEK", "3X_WEEK"
      overrideFrequency: {
        type:      DataTypes.STRING(50),
        allowNull: true,
        field:     'override_frequency',
      },

      // Override the peptide's default rest period in weeks
      overrideRestWeeks: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'override_rest_weeks',
      },
    },
    {
      tableName:   'schedule_items',
      underscored: true,
      indexes: [
        { fields: ['schedule_id'] },
        { fields: ['peptide_id'] },
        // A peptide can only appear once per schedule
        { fields: ['schedule_id', 'peptide_id'], unique: true },
      ],
    }
  );

  ScheduleItem.associate = (models) => {
    ScheduleItem.belongsTo(models.UserSchedule, {
      foreignKey: 'schedule_id',
      as:         'schedule',
    });

    ScheduleItem.belongsTo(models.Peptide, {
      foreignKey: 'peptide_id',
      as:         'peptide',
    });
  };

  return ScheduleItem;
};
