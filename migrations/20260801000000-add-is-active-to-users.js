'use strict';

/**
 * Migration FonctionnalitéMoyenne#428
 * Ajouter une colonne `is_active` à la table `users` pour permettre
 * la désactivation/réactivation d'un compte côté admin.
 *
 * Modifications :
 * 1. Ajouter la colonne `is_active` (BOOLEAN, non-null, défaut true)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔄 Migration FonctionnalitéMoyenne#428: Ajout de la colonne is_active à users');

    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Indique si le compte utilisateur est actif (false = désactivé par un admin)'
    });

    console.log('✅ Colonne is_active ajoutée avec succès');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rollback migration FonctionnalitéMoyenne#428');

    await queryInterface.removeColumn('users', 'is_active');

    console.log('✅ Colonne is_active supprimée avec succès');
  }
};

