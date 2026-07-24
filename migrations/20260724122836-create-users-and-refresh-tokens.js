'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer seulement la table refresh_tokens (users existe déjà)
    await queryInterface.createTable('refresh_tokens', {
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
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Ajouter les index pour la table refresh_tokens
    await queryInterface.addIndex('refresh_tokens', ['token'], {
      unique: true,
      name: 'unique_refresh_token'
    });
    
    await queryInterface.addIndex('refresh_tokens', ['user_id'], {
      name: 'idx_refresh_tokens_user_id'
    });
    
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], {
      name: 'idx_refresh_tokens_expires_at'
    });
    
    await queryInterface.addIndex('refresh_tokens', ['is_active'], {
      name: 'idx_refresh_tokens_is_active'
    });

    console.log('✅ Table refresh_tokens créée avec succès');
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les index
    await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_is_active');
    await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_expires_at');
    await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_user_id');
    await queryInterface.removeIndex('refresh_tokens', 'unique_refresh_token');

    // Supprimer seulement la table refresh_tokens
    await queryInterface.dropTable('refresh_tokens');

    console.log('✅ Table refresh_tokens supprimée');
  }
};
