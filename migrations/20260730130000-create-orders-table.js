'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer le type ENUM pour les statuts de commande (si pas déjà existant)
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_orders_status" AS ENUM (
          'pending',
          'confirmed', 
          'shipped',
          'delivered'
        );
      `);
    } catch (error) {
      // Type ENUM existe déjà, continuer sans erreur
      console.log('ℹ️ Type ENUM "enum_orders_status" existe déjà');
    }

    // Créer la table orders
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      order_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
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
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '[]'
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: 'enum_orders_status',
        allowNull: false,
        defaultValue: 'pending'
      },
      shipping_address: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      billing_address: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      payment_method: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tracking_number: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Créer les index pour optimiser les requêtes
    await queryInterface.addIndex('orders', ['order_id'], {
      unique: true,
      name: 'orders_order_id_unique'
    });

    await queryInterface.addIndex('orders', ['user_id'], {
      name: 'orders_user_id_idx'
    });

    await queryInterface.addIndex('orders', ['status'], {
      name: 'orders_status_idx'
    });

    await queryInterface.addIndex('orders', ['created_at'], {
      name: 'orders_created_at_idx'
    });

    await queryInterface.addIndex('orders', ['tracking_number'], {
      name: 'orders_tracking_number_idx'
    });

    console.log('✅ Table orders créée avec machine à états des statuts');
  },

  async down(queryInterface, Sequelize) {
    // Supprimer la table
    await queryInterface.dropTable('orders');

    // Supprimer le type ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_orders_status";
    `);

    console.log('✅ Table orders et type ENUM supprimés');
  }
};