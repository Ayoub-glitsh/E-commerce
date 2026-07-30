'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wishlist_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      wishlist_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wishlists',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Index unique pour éviter les doublons produit/wishlist
    await queryInterface.addIndex('wishlist_items', ['wishlist_id', 'product_id'], {
      unique: true,
      name: 'wishlist_items_wishlist_product_unique'
    });

    // Index pour les requêtes par wishlist
    await queryInterface.addIndex('wishlist_items', ['wishlist_id'], {
      name: 'wishlist_items_wishlist_id_idx'
    });

    // Index pour les requêtes par produit  
    await queryInterface.addIndex('wishlist_items', ['product_id'], {
      name: 'wishlist_items_product_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wishlist_items');
  }
};