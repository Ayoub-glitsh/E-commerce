#!/usr/bin/env node

const { User, RefreshToken, sequelize } = require('../models');

async function showRefreshTokens() {
  console.log('🔐 TOKENS DE RAFRAÎCHISSEMENT');
  console.log('============================\n');

  try {
    // Récupérer tous les refresh tokens avec leurs utilisateurs
    const tokens = await RefreshToken.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'role', 'name']
      }],
      order: [['created_at', 'DESC']]
    });

    if (tokens.length === 0) {
      console.log('⚠️  Aucun refresh token trouvé');
      return;
    }

    console.log(`📊 ${tokens.length} tokens trouvés:\n`);

    tokens.forEach((token, index) => {
      const isExpired = token.isExpired();
      const isValid = token.isValid();
      const statusIcon = isValid ? '✅' : (isExpired ? '⏰' : '❌');
      
      console.log(`${statusIcon} Token ${index + 1}:`);
      console.log(`   ID: ${token.id}`);
      console.log(`   Utilisateur: ${token.user?.email || 'Inconnu'} (${token.user?.role || 'N/A'})`);
      console.log(`   Token: ${token.token.substring(0, 40)}...`);
      console.log(`   Créé: ${token.created_at}`);
      console.log(`   Expire: ${token.expiresAt}`);
      console.log(`   Actif: ${token.isActive}`);
      console.log(`   Expiré: ${isExpired}`);
      console.log(`   Valide: ${isValid}`);
      console.log('');
    });

    // Statistiques
    const activeTokens = tokens.filter(t => t.isActive).length;
    const validTokens = tokens.filter(t => t.isValid()).length;
    const expiredTokens = tokens.filter(t => t.isExpired()).length;
    
    console.log('📈 STATISTIQUES:');
    console.log(`   Total: ${tokens.length}`);
    console.log(`   Actifs: ${activeTokens}`);
    console.log(`   Valides: ${validTokens}`);
    console.log(`   Expirés: ${expiredTokens}`);

    // Test de nettoyage des tokens expirés
    console.log('\n🧹 TEST NETTOYAGE:');
    const cleanedCount = await RefreshToken.cleanupExpired();
    console.log(`   ${cleanedCount} tokens expirés supprimés`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

showRefreshTokens();