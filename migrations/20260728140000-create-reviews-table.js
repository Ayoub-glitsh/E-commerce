'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Ajouter les index
    await queryInterface.addIndex('reviews', ['user_id']);
    await queryInterface.addIndex('reviews', ['product_id']);
    await queryInterface.addIndex('reviews', ['rating']);
    await queryInterface.addIndex('reviews', ['created_at']);
    
    // Index unique pour empêcher qu'un utilisateur laisse plusieurs avis sur le même produit
    await queryInterface.addConstraint('reviews', {
      fields: ['user_id', 'product_id'],
      type: 'unique',
      name: 'unique_user_product_review'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  }
};