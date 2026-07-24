'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // D'abord, récupérer les IDs des utilisateurs existants
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé, impossible de créer des refresh tokens');
      return;
    }

    // Fonction pour générer un token JWT-like
    const generateRefreshToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let token = '';
      for (let i = 0; i < 128; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    // Fonction pour générer une date d'expiration
    const generateExpiryDate = (daysFromNow) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    };

    // Données de test pour refresh_tokens
    const refreshTokensData = [
      {
        id: uuidv4(),
        user_id: users[0].id,
        token: generateRefreshToken(),
        expires_at: generateExpiryDate(30), // 30 jours
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: users[0].id, // Même utilisateur peut avoir plusieurs tokens
        token: generateRefreshToken(),
        expires_at: generateExpiryDate(7), // 7 jours
        is_active: false, // Token désactivé
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
        updated_at: new Date()
      }
    ];

    // Ajouter un token pour le 2ème utilisateur si il existe
    if (users.length > 1) {
      refreshTokensData.push({
        id: uuidv4(),
        user_id: users[1].id,
        token: generateRefreshToken(),
        expires_at: generateExpiryDate(15), // 15 jours
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Ajouter un token expiré pour le 3ème utilisateur si il existe
    if (users.length > 2) {
      refreshTokensData.push({
        id: uuidv4(),
        user_id: users[2].id,
        token: generateRefreshToken(),
        expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expiré hier
        is_active: true,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        updated_at: new Date()
      });
    }

    // Insérer les refresh tokens
    await queryInterface.bulkInsert('refresh_tokens', refreshTokensData);

    console.log(`✅ ${refreshTokensData.length} refresh tokens ajoutés avec succès:`);
    refreshTokensData.forEach((token, index) => {
      console.log(`   ${index + 1}. User ID: ${token.user_id.substring(0, 8)}... | Actif: ${token.is_active} | Expire: ${token.expires_at.toISOString().split('T')[0]}`);
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprimer tous les refresh tokens de test
    await queryInterface.bulkDelete('refresh_tokens', null, {});
    console.log('✅ Tous les refresh tokens de test supprimés');
  }
};
