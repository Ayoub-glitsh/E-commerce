'use strict';
module.exports = {
async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('user_events', 'product_id', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
        model: 'products',
        key: 'id'
    }
    });

    // Liste des produits concernés par l'événement (utilisé pour "purchase")
    await queryInterface.addColumn('user_events', 'product_ids', {
    type: Sequelize.ARRAY(Sequelize.UUID),
    allowNull: true,
    defaultValue: null
    });

    // Montant total de l'achat (utilisé pour "purchase")
    await queryInterface.addColumn('user_events', 'total_amount', {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
    });

    await queryInterface.addColumn('user_events', 'session_id', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null
    });

    // Index pour les requêtes de recommandations par utilisateur + type d'événement
    await queryInterface.addIndex('user_events', ['event_type']);
    await queryInterface.addIndex('user_events', ['session_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('user_events', ['session_id']);
    await queryInterface.removeIndex('user_events', ['event_type']);
    await queryInterface.removeColumn('user_events', 'session_id');
    await queryInterface.removeColumn('user_events', 'total_amount');
    await queryInterface.removeColumn('user_events', 'product_ids');
    await queryInterface.changeColumn('user_events', 'product_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    });
  }
};