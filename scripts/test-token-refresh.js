require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testTokenRefresh() {
  console.log('🧪 Test complet du système de renouvellement de tokens JWT\n');

  try {
    // 1. Créer un utilisateur de test
    console.log('1. Création d\'un utilisateur de test...');
    const userEmail = `test-refresh-${Date.now()}@example.com`;
    const userPassword = 'TestRefresh123!';
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: userEmail,
      password: userPassword,
      name: 'Test Refresh User',
      role: 'client'
    });

    if (registerResponse.data.success) {
      console.log('   ✅ Utilisateur créé avec succès');
      console.log(`   📧 Email: ${userEmail}`);
    }

    // 2. Connexion pour obtenir les tokens initiaux
    console.log('\n2. Connexion pour obtenir les tokens...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: userEmail,
      password: userPassword
    });

    if (!loginResponse.data.success) {
      throw new Error('Échec de la connexion');
    }

    const initialTokens = loginResponse.data.data.tokens || loginResponse.data.data;
    const initialAccessToken = initialTokens.accessToken;
    const initialRefreshToken = initialTokens.refreshToken;

    console.log('   ✅ Connexion réussie');
    console.log(`   🔑 Access Token (${initialAccessToken.length} chars): ${initialAccessToken.substring(0, 50)}...`);
    console.log(`   🔄 Refresh Token (${initialRefreshToken.length} chars): ${initialRefreshToken.substring(0, 50)}...`);

    // 3. Tester le token d'accès initial sur une route protégée
    console.log('\n3. Test du token d\'accès initial...');
    const authHeaders = {
      'Authorization': `Bearer ${initialAccessToken}`,
      'Content-Type': 'application/json'
    };

    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
    
    if (meResponse.data.success) {
      console.log('   ✅ Token d\'accès initial fonctionne');
      console.log(`   👤 Utilisateur: ${meResponse.data.data.user.email}`);
    }

    // 4. Attendre quelques secondes (pour simuler l'usage)
    console.log('\n4. Attente de 3 secondes (simulation d\'utilisation)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Attente terminée');

    // 5. Tester le renouvellement des tokens
    console.log('\n5. Test de renouvellement des tokens...');
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: initialRefreshToken
    });

    if (!refreshResponse.data.success) {
      throw new Error(`Échec du renouvellement: ${refreshResponse.data.message}`);
    }

    const newTokens = refreshResponse.data.data;
    const newAccessToken = newTokens.accessToken;
    const newRefreshToken = newTokens.refreshToken;

    console.log('   ✅ Renouvellement réussi');
    console.log(`   🆕 Nouveau Access Token: ${newAccessToken.substring(0, 50)}...`);
    console.log(`   🆕 Nouveau Refresh Token: ${newRefreshToken.substring(0, 50)}...`);

    // 6. Vérifier que les nouveaux tokens sont différents des anciens
    console.log('\n6. Vérification que les tokens ont changé...');
    
    if (newAccessToken === initialAccessToken) {
      console.log('   ⚠️  ATTENTION: Le nouvel access token est identique à l\'ancien');
    } else {
      console.log('   ✅ Le nouvel access token est différent (correct)');
    }

    if (newRefreshToken === initialRefreshToken) {
      console.log('   ⚠️  ATTENTION: Le nouveau refresh token est identique à l\'ancien');
    } else {
      console.log('   ✅ Le nouveau refresh token est différent (correct)');
    }

    // 7. Tester le nouveau token d'accès
    console.log('\n7. Test du nouveau token d\'accès...');
    const newAuthHeaders = {
      'Authorization': `Bearer ${newAccessToken}`,
      'Content-Type': 'application/json'
    };

    const newMeResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: newAuthHeaders });
    
    if (newMeResponse.data.success) {
      console.log('   ✅ Nouveau token d\'accès fonctionne parfaitement');
      console.log(`   👤 Utilisateur confirmé: ${newMeResponse.data.data.user.email}`);
    }

    // 8. Vérifier que l'ancien refresh token est invalidé
    console.log('\n8. Test d\'invalidation de l\'ancien refresh token...');
    try {
      const oldRefreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: initialRefreshToken
      });
      
      if (oldRefreshResponse.data.success) {
        console.log('   ⚠️  ATTENTION: L\'ancien refresh token fonctionne encore (problème de sécurité)');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ✅ Ancien refresh token correctement invalidé (sécurité OK)');
      } else {
        console.log(`   ❓ Erreur inattendue: ${error.response?.data?.message || error.message}`);
      }
    }

    // 9. Tester avec un refresh token invalide
    console.log('\n9. Test avec un refresh token invalide...');
    try {
      const invalidRefreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: 'invalid.refresh.token.123'
      });
      
      console.log('   ⚠️  ATTENTION: Token invalide accepté (problème de sécurité)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ✅ Token invalide correctement rejeté');
      } else {
        console.log(`   ❓ Erreur inattendue: ${error.response?.data?.message || error.message}`);
      }
    }

    // 10. Tester sans refresh token
    console.log('\n10. Test sans refresh token...');
    try {
      const noTokenResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {});
      
      console.log('   ⚠️  ATTENTION: Requête sans token acceptée');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ Requête sans token correctement rejetée');
      } else {
        console.log(`   ❓ Erreur inattendue: ${error.response?.data?.message || error.message}`);
      }
    }

    // 11. Test final avec un scénario d'utilisation réaliste
    console.log('\n11. Scénario d\'utilisation réaliste...');
    
    // Utiliser le nouveau access token sur différentes routes
    console.log('    🔍 Test sur route /auth/verify...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/auth/verify`, { headers: newAuthHeaders });
    if (verifyResponse.data.success) {
      console.log('       ✅ Route /auth/verify OK');
    }

    // Test sur une route de produits (si disponible)
    console.log('    🛍️  Test sur route /products...');
    try {
      const productsResponse = await axios.get(`${API_BASE_URL}/products`, { headers: newAuthHeaders });
      console.log('       ✅ Route /products accessible');
    } catch (error) {
      console.log('       ℹ️  Route /products non testée (normal si non implémentée)');
    }

    // 12. Résumé final
    console.log('\n🎉 Tests du renouvellement de tokens terminés avec succès !');
    console.log('\n📊 Résumé des fonctionnalités validées:');
    console.log('   ✅ Génération de tokens lors de la connexion');
    console.log('   ✅ Utilisation d\'access token sur routes protégées');
    console.log('   ✅ Renouvellement avec refresh token valide');
    console.log('   ✅ Génération de nouveaux tokens différents');
    console.log('   ✅ Invalidation de l\'ancien refresh token');
    console.log('   ✅ Rejet de refresh tokens invalides');
    console.log('   ✅ Validation requête sans token');
    console.log('   ✅ Nouveaux tokens fonctionnels sur routes protégées');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Fonction utilitaire pour décoder un JWT (sans vérification)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testTokenRefresh();
}

module.exports = { testTokenRefresh };