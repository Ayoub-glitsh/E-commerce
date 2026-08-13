require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testRefreshWithExistingUser() {
  console.log('🧪 Test du renouvellement de tokens avec utilisateur existant\n');

  try {
    // 1. Tenter de se connecter avec l'utilisateur admin
    console.log('1. Test de connexion avec différents utilisateurs...');
    
    // Test avec des mots de passe possibles pour l'admin
    const adminAttempts = [
      { email: 'admin@3lm-solutions.com', password: 'Admin123!' },
      { email: 'admin@3lm-solutions.com', password: 'admin123' },
      { email: 'admin@3lm-solutions.com', password: 'password123' }
    ];

    let loginSuccess = false;
    let tokens = null;
    
    for (const attempt of adminAttempts) {
      try {
        console.log(`   Tentative: ${attempt.email} / ${attempt.password}`);
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, attempt);
        
        if (loginResponse.data.success) {
          console.log('   ✅ Connexion réussie !');
          tokens = loginResponse.data.data;
          loginSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`   ❌ Échec: ${error.response?.data?.message || error.message}`);
      }
    }

    if (!loginSuccess) {
      // Créer un utilisateur simple pour le test
      console.log('\n2. Création d\'un utilisateur simple pour le test...');
      try {
        const simpleUser = {
          email: 'simple@test.com',
          password: 'Simple123!',
          name: 'Simple User'
        };

        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, simpleUser);
        
        if (registerResponse.data.success) {
          console.log('   ✅ Utilisateur simple créé');
          
          // Se connecter avec ce nouvel utilisateur
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: simpleUser.email,
            password: simpleUser.password
          });
          
          tokens = loginResponse.data.data;
          loginSuccess = true;
        }
      } catch (error) {
        console.error('   ❌ Impossible de créer un utilisateur simple');
        console.error('   Erreur:', error.response?.data?.message || error.message);
      }
    }

    if (!loginSuccess || !tokens) {
      throw new Error('Impossible de se connecter ou créer un utilisateur');
    }

    // 2. Extraire les tokens
    console.log('\n3. Analyse des tokens reçus...');
    const accessToken = tokens.accessToken || tokens.access_token;
    const refreshToken = tokens.refreshToken || tokens.refresh_token;

    if (!accessToken || !refreshToken) {
      console.error('   ❌ Tokens manquants dans la réponse');
      console.error('   Réponse:', tokens);
      return;
    }

    console.log(`   ✅ Access Token reçu (${accessToken.length} chars): ${accessToken.substring(0, 30)}...`);
    console.log(`   ✅ Refresh Token reçu (${refreshToken.length} chars): ${refreshToken.substring(0, 30)}...`);

    // 3. Tester le token d'accès sur une route protégée
    console.log('\n4. Test du token d\'accès sur route protégée...');
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      
      if (meResponse.data.success) {
        console.log('   ✅ Token d\'accès valide');
        console.log(`   👤 Utilisateur: ${meResponse.data.data.user.email}`);
      }
    } catch (error) {
      console.log(`   ❌ Token d\'accès invalide: ${error.response?.data?.message || error.message}`);
    }

    // 4. Tester le renouvellement
    console.log('\n5. Test de renouvellement des tokens...');
    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken
      });

      if (refreshResponse.data.success) {
        console.log('   ✅ Renouvellement réussi !');
        
        const newTokens = refreshResponse.data.data;
        const newAccessToken = newTokens.accessToken;
        const newRefreshToken = newTokens.refreshToken;

        console.log(`   🆕 Nouveau Access Token: ${newAccessToken.substring(0, 30)}...`);
        console.log(`   🆕 Nouveau Refresh Token: ${newRefreshToken.substring(0, 30)}...`);

        // Vérifier que les tokens ont changé
        if (newAccessToken !== accessToken) {
          console.log('   ✅ L\'access token a bien changé');
        } else {
          console.log('   ⚠️  L\'access token n\'a pas changé');
        }

        if (newRefreshToken !== refreshToken) {
          console.log('   ✅ Le refresh token a bien changé');
        } else {
          console.log('   ⚠️  Le refresh token n\'a pas changé');
        }

        // 5. Tester le nouveau token d'accès
        console.log('\n6. Test du nouveau token d\'accès...');
        const newAuthHeaders = {
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json'
        };

        const newMeResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: newAuthHeaders });
        
        if (newMeResponse.data.success) {
          console.log('   ✅ Nouveau token d\'accès fonctionne');
        }

        // 6. Tester l'invalidation de l'ancien refresh token
        console.log('\n7. Test d\'invalidation de l\'ancien refresh token...');
        try {
          await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });
          console.log('   ⚠️  Ancien refresh token encore valide (attention sécurité)');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('   ✅ Ancien refresh token correctement invalidé');
          } else {
            console.log(`   ❓ Erreur: ${error.response?.data?.message || error.message}`);
          }
        }

        console.log('\n🎉 Test de renouvellement terminé avec succès !');

      } else {
        console.log(`   ❌ Échec du renouvellement: ${refreshResponse.data.message}`);
      }

    } catch (error) {
      console.log(`   ❌ Erreur lors du renouvellement: ${error.response?.data?.message || error.message}`);
      console.log(`   Status: ${error.response?.status}`);
    }

    // 7. Tests supplémentaires de validation
    console.log('\n8. Tests de validation supplémentaires...');
    
    // Test sans refresh token
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {});
      console.log('   ⚠️  Requête sans refresh token acceptée');
    } catch (error) {
      console.log('   ✅ Requête sans refresh token rejetée');
    }

    // Test avec refresh token invalide
    try {
      await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: 'invalid.token.here'
      });
      console.log('   ⚠️  Token invalide accepté');
    } catch (error) {
      console.log('   ✅ Token invalide rejeté');
    }

  } catch (error) {
    console.error('\n❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testRefreshWithExistingUser();
}

module.exports = { testRefreshWithExistingUser };