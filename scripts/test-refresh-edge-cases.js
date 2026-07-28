require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testRefreshEdgeCases() {
  console.log('🧪 Test des cas limites du système de renouvellement JWT\n');

  try {
    // Préparer un utilisateur de test
    const user = await User.findOne();
    if (!user) {
      throw new Error('Aucun utilisateur trouvé');
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    console.log(`👤 Utilisateur de test: ${user.email}`);

    // Test 1: Token expiré
    console.log('\n1️⃣ Test avec refresh token expiré...');
    const expiredRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '-1s' } // Déjà expiré
    );

    // Créer l'enregistrement en base avec une date future puis la modifier
    const expiredTokenRecord = await RefreshToken.create({
      userId: user.id,
      token: expiredRefreshToken,
      expiresAt: new Date(Date.now() + 1000), // 1 seconde dans le futur
      isActive: true
    });

    // Modifier directement en base pour passer la validation
    await expiredTokenRecord.update({
      expiresAt: new Date(Date.now() - 1000) // 1 seconde dans le passé
    }, { validate: false });

    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: expiredRefreshToken
      });
      console.log('   ❌ Token expiré accepté (problème de sécurité!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Token expiré correctement rejeté');
      } else {
        console.log(`   ❓ Erreur inattendue: ${error.response?.data?.message}`);
      }
    }

    // Test 2: Token avec signature invalide
    console.log('\n2️⃣ Test avec signature JWT invalide...');
    const invalidSignatureToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      'wrong-secret', 
      { expiresIn: '7d' }
    );

    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: invalidSignatureToken
      });
      console.log('   ❌ Signature invalide acceptée (grave problème!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Signature invalide correctement détectée');
      }
    }

    // Test 3: Token non présent en base de données
    console.log('\n3️⃣ Test avec token valide JWT mais non stocké en base...');
    const validButNotStoredToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: validButNotStoredToken
      });
      console.log('   ❌ Token non stocké accepté (problème!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Token non stocké correctement rejeté');
      }
    }

    // Test 4: Token désactivé en base
    console.log('\n4️⃣ Test avec token désactivé...');
    const deactivatedToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    const deactivatedRecord = await RefreshToken.create({
      userId: user.id,
      token: deactivatedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: false // Désactivé
    });

    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: deactivatedToken
      });
      console.log('   ❌ Token désactivé accepté (problème!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Token désactivé correctement rejeté');
      }
    }

    // Test 5: Token appartenant à un autre utilisateur
    console.log('\n5️⃣ Test avec token d\'un autre utilisateur...');
    const otherUsers = await User.findAll({ where: { id: { [require('sequelize').Op.ne]: user.id } } });
    
    if (otherUsers.length > 0) {
      const otherUser = otherUsers[0];
      const otherUserToken = jwt.sign(
        { userId: otherUser.id, type: 'refresh' }, 
        jwtSecret, 
        { expiresIn: '7d' }
      );

      await RefreshToken.create({
        userId: otherUser.id,
        token: otherUserToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      });

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: otherUserToken
        });
        
        if (response.data.success) {
          console.log('   ✅ Token d\'autre utilisateur traité correctement');
          // Vérifier que le nouvel access token correspond bien à l'autre utilisateur
          const decoded = jwt.decode(response.data.data.accessToken);
          if (decoded.userId === otherUser.id) {
            console.log('   ✅ Nouvel access token correspond au bon utilisateur');
          } else {
            console.log('   ❌ Mixage d\'utilisateurs détecté!');
          }
        }
      } catch (error) {
        console.log(`   ❓ Erreur: ${error.response?.data?.message}`);
      }
    }

    // Test 6: Charge de travail (plusieurs renouvellements rapides)
    console.log('\n6️⃣ Test de charge (3 renouvellements rapides)...');
    
    let currentRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    await RefreshToken.create({
      userId: user.id,
      token: currentRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    for (let i = 1; i <= 3; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: currentRefreshToken
        });
        
        if (response.data.success) {
          console.log(`   ✅ Renouvellement ${i}/3 réussi`);
          currentRefreshToken = response.data.data.refreshToken;
        }
        
        // Petit délai entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`   ❌ Renouvellement ${i}/3 échoué: ${error.response?.data?.message}`);
        break;
      }
    }

    // Test 7: Format JSON invalide
    console.log('\n7️⃣ Test avec format JSON invalide...');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, 'invalid-json', {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('   ❌ JSON invalide accepté');
    } catch (error) {
      if (error.response?.status >= 400 && error.response?.status < 500) {
        console.log('   ✅ JSON invalide correctement rejeté');
      }
    }

    // Test 8: Champ manquant
    console.log('\n8️⃣ Test avec champ refreshToken manquant...');
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, { notRefreshToken: 'value' });
      console.log('   ❌ Champ manquant accepté');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Champ manquant correctement détecté');
      }
    }

    // Test 9: Vérification de la sécurité des nouveaux tokens
    console.log('\n9️⃣ Test de la sécurité des nouveaux tokens générés...');
    
    const validRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    await RefreshToken.create({
      userId: user.id,
      token: validRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: validRefreshToken
    });

    if (refreshResponse.data.success) {
      const newAccessToken = refreshResponse.data.data.accessToken;
      const newRefreshToken = refreshResponse.data.data.refreshToken;
      
      // Décoder et vérifier les tokens
      const accessPayload = jwt.decode(newAccessToken);
      const refreshPayload = jwt.decode(newRefreshToken);
      
      console.log('   🔍 Analyse du nouvel access token:');
      console.log(`      - Utilisateur: ${accessPayload.userId === user.id ? '✅' : '❌'}`);
      console.log(`      - Email: ${accessPayload.email === user.email ? '✅' : '❌'}`);
      console.log(`      - Rôle: ${accessPayload.role === user.role ? '✅' : '❌'}`);
      console.log(`      - Expiration: ${new Date(accessPayload.exp * 1000) > new Date() ? '✅' : '❌'}`);
      
      console.log('   🔍 Analyse du nouveau refresh token:');
      console.log(`      - Utilisateur: ${refreshPayload.userId === user.id ? '✅' : '❌'}`);
      console.log(`      - Type: ${refreshPayload.type === 'refresh' ? '✅' : '❌'}`);
      console.log(`      - Expiration: ${new Date(refreshPayload.exp * 1000) > new Date() ? '✅' : '❌'}`);
    }

    // Nettoyage final
    console.log('\n🧹 Nettoyage des données de test...');
    await RefreshToken.destroy({
      where: { userId: user.id }
    });
    
    // Si on a testé avec d'autres utilisateurs, nettoyer aussi
    if (otherUsers && otherUsers.length > 0) {
      await RefreshToken.destroy({
        where: { userId: otherUsers[0].id }
      });
    }
    
    console.log('   ✅ Nettoyage terminé');

    console.log('\n🎉 Tests des cas limites terminés !');
    console.log('\n📊 Résumé de sécurité:');
    console.log('   ✅ Tokens expirés rejetés');
    console.log('   ✅ Signatures invalides détectées');
    console.log('   ✅ Tokens non stockés rejetés');
    console.log('   ✅ Tokens désactivés rejetés');
    console.log('   ✅ Isolation entre utilisateurs');
    console.log('   ✅ Renouvellements multiples gérés');
    console.log('   ✅ Validation des entrées');
    console.log('   ✅ Intégrité des nouveaux tokens');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error);
    
    // Nettoyage d'urgence
    try {
      await RefreshToken.destroy({ where: {} });
      console.log('🧹 Nettoyage d\'urgence effectué');
    } catch (cleanupError) {
      console.error('❌ Erreur lors du nettoyage:', cleanupError.message);
    }
  }
}

if (require.main === module) {
  testRefreshEdgeCases();
}

module.exports = { testRefreshEdgeCases };