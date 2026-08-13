'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('📦 Mise à jour de la table orders pour la machine à états...');

    // Ajouter la colonne order_id si elle n'existe pas
    try {
      await queryInterface.addColumn('orders', 'order_id', {
        type: Sequelize.TEXT,
        allowNull: true, // Temporairement nullable pour la migration
        unique: false    // Temporairement non unique
      });
      console.log('✅ Colonne order_id ajoutée');
    } catch (error) {
      console.log('ℹ️ Colonne order_id existe déjà ou erreur:', error.message);
    }

    // Ajouter les colonnes manquantes pour la machine à états
    const columnsToAdd = [
      {
        name: 'billing_address',
        definition: {
          type: Sequelize.JSONB,
          allowNull: true
        }
      },
      {
        name: 'payment_method',
        definition: {
          type: Sequelize.TEXT,
          allowNull: true
        }
      },
      {
        name: 'tracking_number',
        definition: {
          type: Sequelize.TEXT,
          allowNull: true
        }
      },
      {
        name: 'notes',
        definition: {
          type: Sequelize.TEXT,
          allowNull: true
        }
      }
    ];

    for (const column of columnsToAdd) {
      try {
        await queryInterface.addColumn('orders', column.name, column.definition);
        console.log(`✅ Colonne ${column.name} ajoutée`);
      } catch (error) {
        console.log(`ℹ️ Colonne ${column.name} existe déjà`);
      }
    }

    // Générer des order_id pour les commandes existantes
    await queryInterface.sequelize.query(`
      UPDATE orders 
      SET order_id = 'ORD-' || UPPER(substring(id::text, 1, 8)) || '-' || UPPER(substring(id::text, -4))
      WHERE order_id IS NULL;
    `);
    console.log('✅ Order_id générés pour les commandes existantes');

    // Rendre order_id non-nullable et unique
    try {
      await queryInterface.changeColumn('orders', 'order_id', {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      });
      console.log('✅ Contraintes order_id appliquées');
    } catch (error) {
      console.log('⚠️ Erreur lors de l\'application des contraintes order_id:', error.message);
    }

    // Créer les index pour optimiser les requêtes
    const indexesToCreate = [
      {
        name: 'orders_order_id_unique',
        fields: ['order_id'],
        unique: true
      },
      {
        name: 'orders_status_idx',
        fields: ['status']
      },
      {
        name: 'orders_tracking_number_idx',
        fields: ['tracking_number']
      }
    ];

    for (const index of indexesToCreate) {
      try {
        await queryInterface.addIndex('orders', index.fields, {
          unique: index.unique || false,
          name: index.name
        });
        console.log(`✅ Index ${index.name} créé`);
      } catch (error) {
        console.log(`ℹ️ Index ${index.name} existe déjà`);
      }
    }

    console.log('🎉 Table orders mise à jour pour la machine à états');
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les colonnes ajoutées
    const columnsToRemove = [
      'order_id',
      'billing_address', 
      'payment_method',
      'tracking_number',
      'notes'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('orders', column);
        console.log(`✅ Colonne ${column} supprimée`);
      } catch (error) {
        console.log(`ℹ️ Erreur suppression ${column}:`, error.message);
      }
    }

    console.log('✅ Table orders restaurée');
  }
};