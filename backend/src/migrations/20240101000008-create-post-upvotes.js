'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('post_upvotes', {
      user_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      post_id: {
        type:       Sequelize.UUID,
        allowNull:  false,
        primaryKey: true,
        references: { model: 'community_posts', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // The composite PK already enforces uniqueness; this index supports
    // "which posts did this user upvote?" queries efficiently.
    await queryInterface.addIndex('post_upvotes', ['post_id'], { name: 'post_upvotes_post_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('post_upvotes');
  },
};
