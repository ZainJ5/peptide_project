'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add the slug column (nullable first so we can populate it)
    await queryInterface.addColumn('peptides', 'slug', {
      type: Sequelize.STRING(300),
      allowNull: true,
      unique: false,
    });

    // 2. Populate slugs from name + mg_amount
    //    Handle duplicates by appending '-blend' for blend types
    await queryInterface.sequelize.query(`
      UPDATE peptides
      SET slug = sub.final_slug
      FROM (
        SELECT
          id,
          CASE
            WHEN dup_count > 1 AND type = 'blend'
              THEN base_slug || '-blend'
            ELSE base_slug
          END AS final_slug
        FROM (
          SELECT
            id,
            type,
            regexp_replace(
              regexp_replace(
                lower(
                  name || COALESCE('-' || mg_amount, '')
                ),
                '[^a-z0-9]+', '-', 'g'
              ),
              '(^-|-$)', '', 'g'
            ) AS base_slug,
            COUNT(*) OVER (
              PARTITION BY regexp_replace(
                regexp_replace(
                  lower(
                    name || COALESCE('-' || mg_amount, '')
                  ),
                  '[^a-z0-9]+', '-', 'g'
                ),
                '(^-|-$)', '', 'g'
              )
            ) AS dup_count
          FROM peptides
        ) inner_q
      ) sub
      WHERE peptides.id = sub.id;
    `);

    // 3. Make slug NOT NULL and UNIQUE now that all rows have values
    await queryInterface.changeColumn('peptides', 'slug', {
      type: Sequelize.STRING(300),
      allowNull: false,
    });

    await queryInterface.addIndex('peptides', ['slug'], {
      unique: true,
      name: 'peptides_slug_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('peptides', 'peptides_slug_unique');
    await queryInterface.removeColumn('peptides', 'slug');
  },
};
