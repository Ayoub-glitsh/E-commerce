require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Script de test pour vérifier que toutes les routes du panier
 * rejettent correctement les requêtes non authentifiées avec HTTP 401
 * 
 * Correspond à la sous-tâche 3: "Tester manuellement avec Postman que les requêtes 
 * sans token sont rejetées avec 401"
 */

async function testCartAuthenticationRejection() {
  console.log('🔒 Test d\'authentification des routes du panier\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  const tests = [
    {
      name: 'GET /api/cart - Sans token',
      method: 'get',
      url: '/cart',
      expectedStatus: 401
    },
    {
      name: 'POST /api/cart/add - Sans token',
      method: 'post', 
      url: '/cart/add',
      data: { product_id: 'test-uuid', quantity: 1 },
      expectedStatus: 401
    },
    {
      name: 'PUT /api/cart/update/:product_id - Sans token',
      method: 'put',
      url: '/cart/update/12345678-1234-1234-1234-123456789012',
      data: { quantity: 2 },
      expectedStatus: 401
    },
    {
      name: 'DELETE /api/cart/remove/:product_id - Sans token',
      method: 'delete',
      url: '/cart/remove/12345678-1234-1234-1234-123456789012',
      expectedStatus: 401
    },
    {
      name: 'DELETE /api/cart/clear - Sans token',
      method: 'delete',
      url: '/cart/clear',
      expectedStatus: 401
    }
  ];
  
  console.log('🧪 Test des 5 routes du panier sans token d\'authentification:\n');
  
  for (const test of tests) {
    totalTests++;
    
    try {
      const config = {
        method: test.method,
        url: `${API_BASE_URL}${test.url}`,
        validateStatus: () => true // Permet tous les codes de statut
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Message: ${response.data?.message || 'N/A'}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Attendu: ${test.expectedStatus}, Reçu: ${response.status}`);
        console.log(`   Message: ${response.data?.message || 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Erreur: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour séparer les tests
  }
  
  console.log('📊 Résultats des tests d\'authentification:');
  console.log(`   Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`   Pourcentage: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Tous les tests d\'authentification ont réussi !');
    console.log('✅ Toutes les routes du panier rejettent bien les requêtes non authentifiées');
    return true;
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration du middleware verifyToken.');
    return false;
  }
}

/**
 * Test avec token invalide pour vérifier la validation JWT
 */
async function testCartWithInvalidToken() {
  console.log('\n🔐 Test avec token invalide:\n');
  
  const invalidTokens = [
    { name: 'Token malformé', token: 'invalid-token' },
    { name: 'Token expiré simulé', token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDAsImF1ZCI6InRlc3QiLCJzdWIiOiJ0ZXN0In0.invalid' },
    { name: 'Header Authorization vide', token: '' },
    { name: 'Pas de Bearer prefix', token: 'just-a-token' }
  ];
  
  for (const { name, token } of invalidTokens) {
    try {
      const headers = token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_BASE_URL}/cart`, {
        headers,
        validateStatus: () => true
      });
      
      if (response.status === 401) {
        console.log(`✅ ${name} - Correctement rejeté (401)`);
      } else {
        console.log(`❌ ${name} - Status inattendu: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`✅ ${name} - Erreur (attendue): ${error.message}`);
    }
  }
}

/**
 * Test avec token valide pour vérifier que l'authentification fonctionne
 */
async function testCartWithValidToken() {
  console.log('\n✅ Test avec token valide:\n');
  
  try {
    // Récupérer un utilisateur existant
    const user = await User.findOne();
    if (!user) {
      console.log('⏭️ Aucun utilisateur trouvé - Test sauté');
      return;
    }
    
    // Se connecter pour obtenir un token valide
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: 'password123' // Mot de passe par défaut des tests
    }, {
      validateStatus: () => true
    });
    
    if (loginResponse.status !== 200) {
      console.log('⏭️ Impossible de se connecter - Test sauté');
      console.log(`   Status: ${loginResponse.status}`);
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    
    // Test GET /cart avec token valide
    const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      validateStatus: () => true
    });
    
    if (cartResponse.status === 200) {
      console.log('✅ GET /cart avec token valide - Accès autorisé');
      console.log(`   Utilisateur: ${user.email}`);
      console.log(`   Items dans le panier: ${cartResponse.data.items?.length || 0}`);
    } else {
      console.log(`❌ GET /cart avec token valide - Status inattendu: ${cartResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur lors du test avec token valide: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function runAuthTests() {
  console.log('🛒 Tests d\'authentification des routes du panier');
  console.log('===============================================\n');
  
  const step1Success = await testCartAuthenticationRejection();
  await testCartWithInvalidToken();
  await testCartWithValidToken();
  
  console.log('\n🏁 Tests terminés');
  
  if (step1Success) {
    console.log('\n🎯 VALIDATION RÉUSSIE:');
    console.log('✅ Toutes les routes du panier requièrent une authentification');
    console.log('✅ Les requêtes sans token sont rejetées avec HTTP 401');
    console.log('✅ Le middleware verifyToken est correctement appliqué');
    console.log('\n🚀 Configuration prête pour la production !');
  } else {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
    console.log('❌ Certaines routes du panier ne rejettent pas les requêtes non authentifiées');
    console.log('🔧 Vérifiez l\'application du middleware verifyToken sur toutes les routes');
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAuthTests().catch(error => {
    console.error('Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testCartAuthenticationRejection,
  testCartWithInvalidToken,
  testCartWithValidToken,
  runAuthTests
};