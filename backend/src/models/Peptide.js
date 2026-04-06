'use strict';

const { DataTypes } = require('sequelize');

/**
 * Peptide Model
 *
 * Represents a single peptide or peptide blend sourced from the master
 * Excel workbook ("Single Peptides" and "Peptide Blends" sheets).
 *
 * Fields map to spreadsheet columns with structured representations
 * (JSONB arrays, floats) where applicable.
 */
module.exports = (sequelize) => {
  const Peptide = sequelize.define(
    'Peptide',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },

      // e.g. "BPC-157", "Ipamorelin", "CJC-1295 NO DAC"
      name: {
        type:      DataTypes.STRING(200),
        allowNull: false,
      },

      // Vial size, e.g. "10MG", "5MG", "2MG"
      mgAmount: {
        type:      DataTypes.STRING(20),
        allowNull: true,
        field:     'mg_amount',
      },

      // Full protocol title, e.g. "BPC-157 (10 mg Vial) Dosage Protocol"
      protocolTitle: {
        type:      DataTypes.STRING(300),
        allowNull: false,
        unique:    true,
        field:     'protocol_title',
      },

      // "single" | "blend"
      type: {
        type:         DataTypes.ENUM('single', 'blend'),
        allowNull:    false,
        defaultValue: 'single',
      },

      // mL of BAC water to add during reconstitution, e.g. 3.0
      reconstitutionMl: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        field:     'reconstitution_ml',
      },

      reconstitutionRaw: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'reconstitution_raw',
      },

      // 100–200 word description of how the peptide works
      howItWorks: {
        type:      DataTypes.TEXT,
        allowNull: true,
        field:     'how_it_works',
      },

      // Array of side effect strings, e.g. ["Mild headache", "Injection-site reactions"]
      sideEffects: {
        type:         DataTypes.JSONB,
        allowNull:    false,
        defaultValue: [],
        field:        'side_effects',
      },

      // Array of benefit strings
      benefits: {
        type:         DataTypes.JSONB,
        allowNull:    false,
        defaultValue: [],
        field:        'benefits',
      },

      // Raw injection frequency text, e.g. "Inject once daily"
      injectionFrequencyRaw: {
        type:      DataTypes.STRING(300),
        allowNull: true,
        field:     'injection_frequency_raw',
      },

      // Raw cycle/protocol duration text, e.g. "8–12 weeks; optional extension to 16 weeks"
      cycleDurationRaw: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'cycle_duration_raw',
      },

      preparationNotes: {
        type:      DataTypes.TEXT,
        allowNull: true,
        field:     'preparation_notes',
      },

      // Health categories, e.g. ["weight loss", "recovery", "sleep"]
      healthCategories: {
        type:         DataTypes.JSONB,
        allowNull:    false,
        defaultValue: [],
        field:        'health_categories',
      },

      sourceUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'source_url',
      },

      // Relative path to the dosage protocol image, e.g. "/images/singles/BPC-157_5_mg_Vial_Dosage_Protocol.webp"
      imageUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'image_url',
      },

      // Relative path to the reconstitution guide image, e.g. "/reconstitution-images/bpc-157-10mg.webp"
      reconstitutionImageUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'reconstitution_image_url',
      },

      isActive: {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: true,
        field:        'is_active',
      },
    },
    {
      tableName:   'peptides',
      underscored: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['type'] },
        { fields: ['is_active'] },
        // GIN indexes for JSONB array containment queries
        { fields: ['health_categories'], using: 'gin' },
        { fields: ['side_effects'],      using: 'gin' },
        { fields: ['benefits'],          using: 'gin' },
      ],
    }
  );

  Peptide.associate = (models) => {
    Peptide.hasMany(models.DosingStep, {
      foreignKey: 'peptide_id',
      as:         'dosingSteps',
      onDelete:   'CASCADE',
    });

    Peptide.hasMany(models.ScheduleItem, {
      foreignKey: 'peptide_id',
      as:         'scheduleItems',
    });

    Peptide.hasMany(models.CommunityPost, {
      foreignKey: 'peptide_id',
      as:         'communityPosts',
    });
  };

  return Peptide;
};
