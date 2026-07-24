#!/usr/bin/env node

const { User, RefreshToken, sequelize } = require('../models');

async function addRefreshTokens() {
  console.log('🔐 AJOUT DE REFRESH TOKENS DE TEST');
  console.log('==================================\n');

  try {
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    // Récupérer tous les utilisateurs existants
    const users = await User.findAll({
      limit: 10
    });
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base');
      return;
    }
    
    console.log(`📋 ${users.length} utilisateurs trouvés`);

    // Génération de tokens réalistes
    const generateToken = () => {
      return 'refresh_' + Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15) + 
             '_' + Date.now();
    };

    const refreshTokensData = [];

    // Créer des refresh tokens pour chaque utilisateur
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Token actif (expire dans 30 jours)
      refreshTokensData.push({
        userId: user.id,
        token: generateToken(),
        expiresAt: RefreshToken.generateExpiryDate(30),
        isActive: true
      });

      // Pour certains utilisateurs, ajouter un token expiré (historique)
      if (i % 2 === 0) {
        refreshTokensData.push({
          userId: user.id,
          token: generateToken(),
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expiré hier
          isActive: false
        });
      }

      // Pour le premier utilisateur, ajouter un token qui expire bientôt
      if (i === 0) {
        refreshTokensData.push({
          userId: user.id,
          token: generateToken(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expire dans 1h
          isActive: true
        });
      }
    }

    console.log(`\n📝 Création de ${refreshTokensData.length} refresh tokens...\n`);

    // Insérer tous les refresh tokens
    const createdTokens = [];
    for (let tokenData of refreshTokensData) {
      try {
        const token = await RefreshToken.create(tokenData);
        createdTokens.push(token);
        
        const user = users.find(u => u.id === token.userId);
        const status = token.isActive ? '🟢 ACTIF' : '🔴 INACTIF';
        const expiry = token.isExpired() ? '⏰ EXPIRÉ' : '✅ VALIDE';
        
        console.log(`✅ Token créé pour ${user.email}`);
        console.log(`   ID: ${token.id.substring(0, 8)}...`);
        console.log(`   Token: ${token.token.substring(0, 25)}...`);
        console.log(`   Status: ${status} | ${expiry}`);
        console.log(`   Expire: ${token.expiresAt.toLocaleString('fr-FR')}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Erreur création token: ${error.message}`);
      }
    }

    // Statistiques finales
    console.log('\n📊 STATISTIQUES DES TOKENS CRÉÉS:');
    console.log('================================');
    
    const totalTokens = await RefreshToken.count();
    const activeTokens = await RefreshToken.count({ where: { isActive: true } });
    const expiredTokens = await RefreshToken.count({ 
      where: { 
        expiresAt: { 
          [sequelize.Op.lt]: new Date() 
        } 
      } 
    });

    console.log(`📋 Total tokens: ${totalTokens}`);
    console.log(`🟢 Tokens actifs: ${activeTokens}`);
    console.log(`🔴 Tokens inactifs: ${totalTokens - activeTokens}`);
    console.log(`⏰ Tokens expirés: ${expiredTokens}`);

    // Exemple de requête avec association
    console.log('\n🔗 EXEMPLE D\'ASSOCIATION TOKEN → USER:');
    console.log('=====================================');
    
    const tokenWithUser = await RefreshToken.findOne({
      where: { isActive: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'role', 'name']
      }]
    });

    if (tokenWithUser) {
      console.log(`✅ Token: ${tokenWithUser.token.substring(0, 20)}...`);
      console.log(`👤 User: ${tokenWithUser.user.email} (${tokenWithUser.user.role})`);
      console.log(`📅 Expire: ${tokenWithUser.expiresAt.toLocaleString('fr-FR')}`);
    }

    console.log('\n🎉 AJOUT DE REFRESH TOKENS TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
  } finally {
    await sequelize.close();
  }
}

// Exécution du script
addRefreshTokens();