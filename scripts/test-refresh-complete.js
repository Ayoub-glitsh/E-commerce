require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testRefreshComplete() {
  console.log('🧪 Test complet du système de renouvellement de tokens JWT\n');

  try {
    // 1. Utiliser un utilisateur existant
    console.log('1. Récupération d\'un utilisateur existant...');
    const user = await User.findOne();
    
    if (!user) {
      throw new Error('Aucun utilisateur trouvé en base');
    }

    console.log(`   ✅ Utilisateur trouvé: ${user.email} (${user.role})`);

    // 2. Créer manuellement des tokens JWT
    console.log('\n2. Génération manuelle des tokens...');
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Access token (15 minutes)
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    
    // Refresh token (7 jours)
    const refreshTokenValue = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    console.log(`   ✅ Access Token généré: ${accessToken.substring(0, 50)}...`);
    console.log(`   ✅ Refresh Token généré: ${refreshTokenValue.substring(0, 50)}...`);

    // 3. Stocker le refresh token en base
    console.log('\n3. Stockage du refresh token en base...');
    const refreshTokenRecord = await RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      isActive: true
    });

    console.log(`   ✅ Refresh token stocké avec ID: ${refreshTokenRecord.id}`);

    // 4. Tester l'access token sur une route protégée
    console.log('\n4. Test de l\'access token sur route protégée...');
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      
      if (meResponse.data.success) {
        console.log('   ✅ Access token fonctionne sur /auth/me');
        console.log(`   👤 Utilisateur confirmé: ${meResponse.data.data.user.email}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur avec access token: ${error.response?.data?.message || error.message}`);
    }

    // 5. Tester le renouvellement des tokens
    console.log('\n5. Test de renouvellement des tokens via API...');
    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: refreshTokenValue
      });

      if (refreshResponse.data.success) {
        console.log('   ✅ Renouvellement réussi !');
        
        const newTokens = refreshResponse.data.data;
        const newAccessToken = newTokens.accessToken;
        const newRefreshToken = newTokens.refreshToken;

        console.log(`   🆕 Nouveau Access Token: ${newAccessToken.substring(0, 50)}...`);
        console.log(`   🆕 Nouveau Refresh Token: ${newRefreshToken.substring(0, 50)}...`);

        // Vérifier que les tokens ont changé
        if (newAccessToken !== accessToken) {
          console.log('   ✅ L\'access token a bien changé');
        } else {
          console.log('   ⚠️  L\'access token n\'a pas changé (problème!)');
        }

        if (newRefreshToken !== refreshTokenValue) {
          console.log('   ✅ Le refresh token a bien changé');
        } else {
          console.log('   ⚠️  Le refresh token n\'a pas changé (problème!)');
        }

        // 6. Tester le nouveau access token
        console.log('\n6. Test du nouveau access token...');
        const newAuthHeaders = {
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json'
        };

        try {
          const newMeResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: newAuthHeaders });
          
          if (newMeResponse.data.success) {
            console.log('   ✅ Nouveau access token fonctionne parfaitement');
          }
        } catch (error) {
          console.log(`   ❌ Nouveau access token ne fonctionne pas: ${error.response?.data?.message || error.message}`);
        }

        // 7. Vérifier l'invalidation de l'ancien refresh token
        console.log('\n7. Test d\'invalidation de l\'ancien refresh token...');
        try {
          const oldRefreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshTokenValue
          });
          
          if (oldRefreshResponse.data.success) {
            console.log('   ⚠️  PROBLÈME: L\'ancien refresh token fonctionne encore !');
          }
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('   ✅ Ancien refresh token correctement invalidé');
          } else {
            console.log(`   ❓ Erreur inattendue: ${error.response?.data?.message || error.message}`);
          }
        }

        // 8. Tests de validation supplémentaires
        console.log('\n8. Tests de validation...');

        // Test sans refresh token
        try {
          await axios.post(`${API_BASE_URL}/auth/refresh`, {});
          console.log('   ⚠️  Requête sans token acceptée (problème!)');
        } catch (error) {
          if (error.response?.status === 400) {
            console.log('   ✅ Requête sans token correctement rejetée');
          }
        }

        // Test avec token invalide
        try {
          await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: 'invalid.token.value'
          });
          console.log('   ⚠️  Token invalide accepté (problème!)');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('   ✅ Token invalide correctement rejeté');
          }
        }

        // 9. Vérifier l'état en base de données
        console.log('\n9. Vérification de l\'état en base...');
        const activeTokens = await RefreshToken.findAll({
          where: { userId: user.id, isActive: true }
        });

        console.log(`   📊 Tokens actifs pour cet utilisateur: ${activeTokens.length}`);
        
        if (activeTokens.length === 1) {
          console.log('   ✅ Un seul token actif (correct)');
        } else {
          console.log('   ⚠️  Plusieurs tokens actifs (vérifier la logique)');
        }

      } else {
        console.log(`   ❌ Échec du renouvellement: ${refreshResponse.data.message}`);
      }

    } catch (error) {
      console.log(`   ❌ Erreur lors du renouvellement: ${error.response?.data?.message || error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }

    // 10. Nettoyage - supprimer les tokens de test créés
    console.log('\n10. Nettoyage des tokens de test...');
    await RefreshToken.destroy({
      where: { userId: user.id }
    });
    console.log('   ✅ Tokens de test supprimés');

    console.log('\n🎉 Test complet terminé !');

  } catch (error) {
    console.error('\n❌ Erreur générale:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Fonction utilitaire pour décoder un JWT
function decodeJWT(token) {
  try {
    const payload = jwt.decode(token);
    return payload;
  } catch (error) {
    return null;
  }
}

// Exécuter le test
if (require.main === module) {
  testRefreshComplete();
}

module.exports = { testRefreshComplete };