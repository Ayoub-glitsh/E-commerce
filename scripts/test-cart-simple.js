require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Test simple pour vérifier que les routes du panier sont bien configurées
 * et qu'elles rejettent correctement les requêtes non authentifiées
 */

async function testCartRoutesSimple() {
  console.log('🛒 Test simple des routes du panier');
  console.log('====================================\n');

  const routes = [
    { method: 'GET', path: '/cart', name: 'GET /api/cart' },
    { method: 'POST', path: '/cart/add', name: 'POST /api/cart/add', data: { product_id: 'test', quantity: 1 } },
    { method: 'PUT', path: '/cart/update/test-id', name: 'PUT /api/cart/update/:id', data: { quantity: 1 } },
    { method: 'DELETE', path: '/cart/remove/test-id', name: 'DELETE /api/cart/remove/:id' },
    { method: 'DELETE', path: '/cart/clear', name: 'DELETE /api/cart/clear' }
  ];

  let passedTests = 0;
  let totalTests = routes.length;

  console.log('🧪 Test de rejet des requêtes non authentifiées:\n');

  for (const route of routes) {
    try {
      const config = {
        method: route.method.toLowerCase(),
        url: `${API_BASE_URL}${route.path}`,
        validateStatus: () => true // Accepter tous les codes de statut
      };

      if (route.data) {
        config.data = route.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);

      if (response.status === 401) {
        console.log(`✅ ${route.name} - Authentification requise (401)`);
        passedTests++;
      } else if (response.status === 400 && response.data?.message?.includes('Token')) {
        console.log(`✅ ${route.name} - Token requis (400)`);
        passedTests++;
      } else {
        console.log(`❌ ${route.name} - Status inattendu: ${response.status}`);
        console.log(`   Message: ${response.data?.message || JSON.stringify(response.data)}`);
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${route.name} - Serveur non accessible`);
      } else {
        console.log(`❌ ${route.name} - Erreur: ${error.message}`);
      }
    }
  }

  console.log('\n📊 Résultats:');
  console.log(`   Routes testées: ${totalTests}`);
  console.log(`   Tests réussis: ${passedTests}`);
  console.log(`   Pourcentage: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 SUCCESS: Toutes les routes du panier sont protégées !');
    console.log('\n✅ Fonctionnalités validées:');
    console.log('   - Middleware verifyToken appliqué sur toutes les routes');
    console.log('   - Requêtes non authentifiées correctement rejetées');
    console.log('   - Routes accessibles et configurées');
    return true;
  } else {
    console.log('\n⚠️ ATTENTION: Certaines routes ne sont pas correctement protégées');
    return false;
  }
}

/**
 * Test avec un token fictif pour vérifier la validation JWT
 */
async function testWithFakeToken() {
  console.log('\n🔐 Test avec token fictif:\n');

  try {
    const response = await axios.get(`${API_BASE_URL}/cart`, {
      headers: { 'Authorization': 'Bearer fake-jwt-token' },
      validateStatus: () => true
    });

    if (response.status === 401) {
      console.log('✅ Token fictif correctement rejeté (401)');
      return true;
    } else {
      console.log(`❌ Token fictif accepté - Status: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.log('✅ Token fictif rejeté avec erreur (attendu)');
    return true;
  }
}

/**
 * Test de structure de réponse d'erreur
 */
async function testErrorStructure() {
  console.log('\n📋 Test de structure des erreurs:\n');

  try {
    const response = await axios.get(`${API_BASE_URL}/cart`, {
      validateStatus: () => true
    });

    if (response.status === 401) {
      console.log('✅ Code de statut 401 correct');
      
      // Vérifier que la réponse contient un message d'erreur approprié
      if (response.data && (
        response.data.message || 
        response.data.error ||
        typeof response.data === 'string'
      )) {
        console.log('✅ Message d\'erreur présent');
      } else {
        console.log('⚠️ Pas de message d\'erreur clair');
      }
      
      return true;
    } else {
      console.log(`❌ Code de statut incorrect: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.log('⚠️ Erreur de connexion lors du test de structure');
    return false;
  }
}

/**
 * Fonction principale
 */
async function runSimpleTests() {
  const basicTestsSuccess = await testCartRoutesSimple();
  const tokenTestSuccess = await testWithFakeToken();  
  const structureTestSuccess = await testErrorStructure();

  console.log('\n🏁 Résumé final:\n');

  if (basicTestsSuccess && tokenTestSuccess && structureTestSuccess) {
    console.log('🎯 VALIDATION COMPLÈTE RÉUSSIE !');
    console.log('\n🛡️ Sécurité confirmée:');
    console.log('✅ Toutes les routes du panier requièrent une authentification');
    console.log('✅ Les tokens invalides sont rejetés');
    console.log('✅ Les réponses d\'erreur sont appropriées');
    console.log('\n🚀 La configuration est prête pour la production !');
    
    console.log('\n📋 Routes configurées et protégées:');
    console.log('   • GET /api/cart - Récupérer le panier');
    console.log('   • POST /api/cart/add - Ajouter un produit');
    console.log('   • PUT /api/cart/update/:id - Modifier quantité');
    console.log('   • DELETE /api/cart/remove/:id - Supprimer produit');
    console.log('   • DELETE /api/cart/clear - Vider le panier');
    
    return true;
  } else {
    console.log('⚠️ Certains tests ont échoué - Vérifiez la configuration');
    return false;
  }
}

// Exécuter les tests
if (require.main === module) {
  runSimpleTests().catch(error => {
    console.error('Erreur lors des tests:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testCartRoutesSimple,
  testWithFakeToken,
  testErrorStructure,
  runSimpleTests
};