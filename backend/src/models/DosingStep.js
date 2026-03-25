'use strict';

const { DataTypes } = require('sequelize');

/**
 * DosingStep Model
 *
 * One row in a peptide's escalation dosing table.
 * A peptide can have multiple named schedule variants (e.g. "Standard / Gradual"
 * vs "Advanced / High-Dose"), each with ordered steps.
 *
 * Example — BPC-157 Standard approach:
 *   Step 1 → Weeks 1–2 → 200 mcg → 6 units
 *   Step 2 → Weeks 3–4 → 400 mcg → 12 units
 *   Step 3 → Weeks 5–8 → 600 mcg → 18 units
 */
module.exports = (sequelize) => {
  const DosingStep = sequelize.define(
    'DosingStep',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      peptideId: {
        type:       DataTypes.UUID,
        allowNull:  false,
        field:      'peptide_id',
        references: { model: 'peptides', key: 'id' },
        onDelete:   'CASCADE',
      },

      // Schedule variant name, e.g. "Standard / Gradual Approach (3 mL = ~3.33 mg/mL)"
      scheduleName: {
        type:      DataTypes.STRING(300),
        allowNull: false,
        field:     'schedule_name',
      },

      // Position in the escalation sequence (1-based)
      stepOrder: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        field:     'step_order',
      },

      // Human-readable week range, e.g. "Weeks 1–2", "Weeks 5–8+"
      weekRangeLabel: {
        type:      DataTypes.STRING(50),
        allowNull: true,
        field:     'week_range_label',
      },

      // Parsed week start (1-based)
      weekStart: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'week_start',
      },

      // Parsed week end (inclusive; null = open-ended "8+")
      weekEnd: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        field:     'week_end',
      },

      // Human-readable dose label, e.g. "200 mcg (0.2 mg)"
      dailyDoseLabel: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'daily_dose_label',
      },

      // Dose in micrograms, e.g. 200
      dailyDoseMcg: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        field:     'daily_dose_mcg',
      },

      // Units on a 100-unit insulin syringe, e.g. 6
      unitsPerInjection: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        field:     'units_per_injection',
      },

      // Volume in mL, e.g. 0.06
      volumeMl: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        field:     'volume_ml',
      },

      // Raw JSON header row from spreadsheet table
      tableHeaders: {
        type:      DataTypes.JSONB,
        allowNull: true,
        field:     'table_headers',
      },

      // Raw JSON data row from spreadsheet table (fallback for live parsing)
      rowData: {
        type:      DataTypes.JSONB,
        allowNull: true,
        field:     'row_data',
      },
    },
    {
      tableName:   'dosing_steps',
      underscored: true,
      indexes: [
        { fields: ['peptide_id'] },
        { fields: ['peptide_id', 'schedule_name', 'step_order'], unique: true },
      ],
    }
  );

  DosingStep.associate = (models) => {
    DosingStep.belongsTo(models.Peptide, {
      foreignKey: 'peptide_id',
      as:         'peptide',
    });
  };

  return DosingStep;
};
