#!/usr/bin/env node

const { User, RefreshToken, sequelize } = require('../models');

async function addSampleRefreshTokens() {
  console.log('🔄 AJOUT D\'ENREGISTREMENTS DE TEST - REFRESH TOKENS');
  console.log('==================================================\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion Sequelize établie');

    // Récupérer tous les utilisateurs existants
    const users = await User.findAll({
      limit: 3
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé pour créer des refresh tokens');
      return;
    }

    console.log(`📋 Utilisateurs trouvés : ${users.length}`);

    const refreshTokensData = [];

    // Créer des refresh tokens pour chaque utilisateur
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Token actif
      const activeToken = await RefreshToken.create({
        userId: user.id,
        token: `refresh_token_${user.email.split('@')[0]}_active_${Date.now()}_${i}`,
        expiresAt: RefreshToken.generateExpiryDate(30), // 30 jours
        isActive: true
      });

      // Token expiré (pour tester la logique d'expiration)
      const expiredToken = await RefreshToken.create({
        userId: user.id,
        token: `refresh_token_${user.email.split('@')[0]}_expired_${Date.now()}_${i}`,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier (expiré)
        isActive: false
      });

      refreshTokensData.push(activeToken, expiredToken);
      
      console.log(`✅ Tokens créés pour ${user.email}:`);
      console.log(`   Token actif: ${activeToken.id.substring(0, 8)}... (expire: ${activeToken.expiresAt.toISOString().split('T')[0]})`);
      console.log(`   Token expiré: ${expiredToken.id.substring(0, 8)}... (expiré: ${expiredToken.expiresAt.toISOString().split('T')[0]})`);
    }

    // Créer un token de longue durée pour l'admin
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      const longTermToken = await RefreshToken.create({
        userId: adminUser.id,
        token: `admin_long_term_token_${Date.now()}`,
        expiresAt: RefreshToken.generateExpiryDate(90), // 90 jours
        isActive: true
      });
      
      refreshTokensData.push(longTermToken);
      console.log(`🔐 Token longue durée admin créé: ${longTermToken.id.substring(0, 8)}... (90 jours)`);
    }

    // Statistiques finales
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`✅ Total refresh tokens créés: ${refreshTokensData.length}`);
    
    const totalCount = await RefreshToken.count();
    const activeCount = await RefreshToken.count({ where: { isActive: true } });
    const expiredCount = await RefreshToken.count({ 
      where: { 
        expiresAt: { [sequelize.Op.lt]: new Date() } 
      } 
    });

    console.log(`📈 État de la table refresh_tokens:`);
    console.log(`   Total enregistrements: ${totalCount}`);
    console.log(`   Tokens actifs: ${activeCount}`);
    console.log(`   Tokens expirés: ${expiredCount}`);

    // Test des méthodes
    console.log(`\n🧪 Test des méthodes:`);
    const testToken = refreshTokensData[0];
    console.log(`   isExpired(): ${testToken.isExpired()}`);
    console.log(`   isValid(): ${testToken.isValid()}`);

    console.log('\n🎉 ENREGISTREMENTS DE TEST AJOUTÉS AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des refresh tokens:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
  } finally {
    await sequelize.close();
  }
}

addSampleRefreshTokens();