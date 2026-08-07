'use strict';

/**
 * Migration pour FonctionnalitéMoyenne#1782
 * Ajouter support annulation et suivi des commandes
 * 
 * Modifications:
 * 1. Ajouter 'canceled' à l'enum status
 * 2. Ajouter les champs de dates: canceledAt, confirmedAt, shippedAt, deliveredAt
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Migration FonctionnalitéMoyenne#1782: Ajout support annulation et suivi');

      // 1. Ajouter les nouveaux champs de dates de suivi
      await queryInterface.addColumn('orders', 'canceled_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date d\'annulation de la commande'
      }, { transaction });

      await queryInterface.addColumn('orders', 'confirmed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de confirmation de la commande'
      }, { transaction });

      await queryInterface.addColumn('orders', 'shipped_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date d\'expédition de la commande'
      }, { transaction });

      await queryInterface.addColumn('orders', 'delivered_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de livraison de la commande'
      }, { transaction });

      // 2. Gérer l'ENUM PostgreSQL existant et ajouter 'canceled'
      console.log('🔄 Gestion de l\'ENUM PostgreSQL pour ajouter "canceled"');
      
      // Supprimer temporairement la valeur par défaut
      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status DROP DEFAULT`,
        { transaction }
      );

      // Créer un nouveau type ENUM avec 'canceled' inclus
      await queryInterface.sequelize.query(
        `CREATE TYPE "OrderStatus_new" AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'canceled')`,
        { transaction }
      );

      // Mettre à jour la colonne pour utiliser le nouveau type
      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status TYPE "OrderStatus_new" USING status::text::"OrderStatus_new"`,
        { transaction }
      );

      // Restaurer la valeur par défaut
      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'`,
        { transaction }
      );

      // Supprimer l'ancien type ENUM
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_orders_status"`,
        { transaction }
      );

      // Renommer le nouveau type pour remplacer l'ancien
      await queryInterface.sequelize.query(
        `ALTER TYPE "OrderStatus_new" RENAME TO "enum_orders_status"`,
        { transaction }
      );

      console.log('✅ ENUM PostgreSQL mis à jour avec le statut "canceled"');

      // 3. Créer les index pour optimiser les requêtes de suivi
      await queryInterface.addIndex('orders', ['canceled_at'], {
        name: 'idx_orders_canceled_at',
        transaction
      });

      await queryInterface.addIndex('orders', ['confirmed_at'], {
        name: 'idx_orders_confirmed_at',
        transaction
      });

      await queryInterface.addIndex('orders', ['shipped_at'], {
        name: 'idx_orders_shipped_at',
        transaction
      });

      await queryInterface.addIndex('orders', ['delivered_at'], {
        name: 'idx_orders_delivered_at',
        transaction
      });

      console.log('✅ Migration FonctionnalitéMoyenne#1782 terminée avec succès');
      await transaction.commit();

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rollback migration FonctionnalitéMoyenne#1782');

      // Supprimer les index
      await queryInterface.removeIndex('orders', 'idx_orders_canceled_at', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_confirmed_at', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_shipped_at', { transaction });
      await queryInterface.removeIndex('orders', 'idx_orders_delivered_at', { transaction });

      // Supprimer les colonnes de dates
      await queryInterface.removeColumn('orders', 'canceled_at', { transaction });
      await queryInterface.removeColumn('orders', 'confirmed_at', { transaction });
      await queryInterface.removeColumn('orders', 'shipped_at', { transaction });
      await queryInterface.removeColumn('orders', 'delivered_at', { transaction });

      // Restaurer l'ancien ENUM PostgreSQL sans 'canceled'
      await queryInterface.sequelize.query(
        `CREATE TYPE "OrderStatus_old" AS ENUM ('pending', 'confirmed', 'shipped', 'delivered')`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE orders ALTER COLUMN status TYPE "OrderStatus_old" USING status::text::"OrderStatus_old"`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP TYPE "enum_orders_status"`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TYPE "OrderStatus_old" RENAME TO "enum_orders_status"`,
        { transaction }
      );

      console.log('✅ Rollback terminé avec succès');
      await transaction.commit();

    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error);
      await transaction.rollback();
      throw error;
    }
  }
};
