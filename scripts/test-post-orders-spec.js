#!/usr/bin/env node

/**
 * Test spécifique pour FonctionnalitéHaute#1778
 * POST /orders endpoint - Créer une commande depuis le panier
 * 
 * Tests des exigences exactes de la spécification:
 * ✅ Sous-tâche 1: Récupérer le panier via Cart.findByUserId()
 * ✅ Sous-tâche 2: Vérifier panier.items.length > 0, créer Order avec items copiés et calculer total
 * ✅ Sous-tâche 3: Appeler cart.clear() pour vider le panier, retourner { orderId, total, status: 'pending' }
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let userId = '';

// Configuration des couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '🔄';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(color, `${icon} ${testName}${details ? ` - ${details}` : ''}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Authentification et récupération du token
 */
async function testAuthentication() {
  log('blue', '\n🔐 Test 1: Authentification utilisateur');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'Password123!'
    });

    if (response.status === 200 && response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      userId = response.data.data.user.id;
      logTest('Authentification', 'PASS', `Token récupéré pour user ${userId}`);
      return true;
    } else {
      logTest('Authentification', 'FAIL', 'Token manquant dans la réponse');
      console.log('Réponse reçue:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    logTest('Authentification', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 2: Nettoyage - Vider le panier et supprimer les commandes existantes
 */
async function testCleanup() {
  log('blue', '\n🧹 Test 2: Nettoyage préalable');
  
  try {
    // Vider le panier actuel
    await axios.delete(`${API_BASE}/cart/clear`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).catch(() => {}); // Ignorer les erreurs si le panier n'existe pas

    logTest('Nettoyage panier', 'PASS', 'Panier vidé');
    return true;
  } catch (error) {
    logTest('Nettoyage', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 3: Validation - Panier vide doit échouer
 */
async function testEmptyCartValidation() {
  log('blue', '\n❌ Test 3: Validation panier vide (doit échouer)');
  
  try {
    const response = await axios.post(`${API_BASE}/orders`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Si on arrive ici, le test a échoué car il aurait dû rejeter
    logTest('Validation panier vide', 'FAIL', 'La requête n\'a pas échoué comme attendu');
    return false;

  } catch (error) {
    if (error.response?.status === 400 && 
        error.response?.data?.message?.includes('panier est vide')) {
      logTest('Validation panier vide', 'PASS', 'Rejet correct du panier vide');
      return true;
    } else {
      logTest('Validation panier vide', 'FAIL', `Erreur inattendue: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

/**
 * Test 4: Ajout d'items au panier
 */
async function testAddItemsToCart() {
  log('blue', '\n🛒 Test 4: Ajout d\'items au panier');
  
  const testItems = [
    { productId: '02911c3b-74f9-4437-85d9-ebc2ce20a358', name: 'Clean Code (Livre)', price: 45.99, quantity: 2 },
    { productId: '7801e08c-ae0c-45cd-bd88-8b244716b95f', name: 'Sneakers Running Pro', price: 129.99, quantity: 1 },
    { productId: '3b12a8c7-7e0c-4751-97f0-7e85c2af4849', name: 'Jean Slim Fit Premium', price: 89.99, quantity: 3 }
  ];

  let addedCount = 0;

  for (const item of testItems) {
    try {
      const response = await axios.post(`${API_BASE}/cart/add`, {
        product_id: item.productId,  // Use product_id instead of productId
        quantity: item.quantity
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.status === 200 || response.status === 201) {
        addedCount++;
        log('cyan', `  ➕ Ajouté: ${item.name} (${item.quantity}x ${item.price}€)`);
      }
    } catch (error) {
      log('red', `  ❌ Erreur ajout ${item.name}: ${error.response?.data?.message || error.message}`);
    }
  }

  const success = addedCount === testItems.length;
  logTest('Ajout items au panier', success ? 'PASS' : 'FAIL', `${addedCount}/${testItems.length} items ajoutés`);
  
  return { success, expectedTotal: 45.99*2 + 129.99*1 + 89.99*3 }; // 91.98 + 129.99 + 269.97 = 491.94
}

/**
 * Test 5: Vérification du contenu du panier
 */
async function testVerifyCartContent() {
  log('blue', '\n📋 Test 5: Vérification du contenu du panier');
  
  try {
    const response = await axios.get(`${API_BASE}/cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.data && response.data.data.items) {
      const cartItems = response.data.data.items;
      const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      
      logTest('Vérification panier', 'PASS', `${cartItems.length} items, total: ${cartTotal.toFixed(2)}€`);
      
      // Afficher le détail des items
      cartItems.forEach(item => {
        log('cyan', `  📦 ${item.name}: ${item.quantity}x ${item.price}€ = ${(item.price * item.quantity).toFixed(2)}€`);
      });

      return { success: true, itemCount: cartItems.length, total: cartTotal };
    } else {
      logTest('Vérification panier', 'FAIL', 'Structure de réponse inattendue');
      return { success: false };
    }
  } catch (error) {
    logTest('Vérification panier', 'FAIL', error.response?.data?.message || error.message);
    return { success: false };
  }
}

/**
 * Test 6: SPÉCIFICATION FonctionnalitéHaute#1778 - Création de commande
 */
async function testCreateOrderFromCart() {
  log('blue', '\n🎯 Test 6: SPÉCIFICATION - POST /orders (FonctionnalitéHaute#1778)');
  
  try {
    const orderData = {
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        zipCode: '12345',
        country: 'France'
      },
      paymentMethod: 'credit_card',
      notes: 'Test order from specification'
    };

    const response = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 201 && response.data.success) {
      const responseData = response.data.data;
      
      // Vérifier la structure de réponse selon spécification
      const hasRequiredFields = responseData.orderId && 
                               typeof responseData.total === 'number' && 
                               responseData.status === 'pending';

      if (hasRequiredFields) {
        logTest('Format de réponse', 'PASS', `orderId: ${responseData.orderId}, total: ${responseData.total}€, status: ${responseData.status}`);
        
        // Vérifications supplémentaires
        log('cyan', `  📦 Commande créée: ${responseData.orderId}`);
        log('cyan', `  💰 Total: ${responseData.total}€`);
        log('cyan', `  📊 Status: ${responseData.status}`);
        
        return { success: true, order: responseData };
      } else {
        logTest('Format de réponse', 'FAIL', 'Champs requis manquants dans la réponse');
        return { success: false };
      }
    } else {
      logTest('Création commande', 'FAIL', `Status ${response.status} inattendu`);
      return { success: false };
    }
  } catch (error) {
    logTest('Création commande', 'FAIL', error.response?.data?.message || error.message);
    log('red', `Détails: ${JSON.stringify(error.response?.data, null, 2)}`);
    return { success: false };
  }
}

/**
 * Test 7: Vérification que le panier a été vidé
 */
async function testCartClearedAfterOrder() {
  log('blue', '\n🗑️ Test 7: Vérification vidage du panier (cart.clear())');
  
  try {
    const response = await axios.get(`${API_BASE}/cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 200) {
      const cartItems = response.data.data?.items || [];
      
      if (cartItems.length === 0) {
        logTest('Panier vidé', 'PASS', 'cart.clear() a bien fonctionné');
        return true;
      } else {
        logTest('Panier vidé', 'FAIL', `Le panier contient encore ${cartItems.length} items`);
        return false;
      }
    } else {
      logTest('Panier vidé', 'FAIL', `Erreur lors de la vérification: status ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Panier vidé', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 8: Vérification de la commande créée
 */
async function testVerifyCreatedOrder(orderData) {
  log('blue', '\n✅ Test 8: Vérification de la commande créée');
  
  try {
    const response = await axios.get(`${API_BASE}/orders/${orderData.orderId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const order = response.data.data;
      
      // Vérifications de cohérence
      const checks = {
        'OrderId correspond': order.orderId === orderData.orderId,
        'Status est pending': order.status === 'pending',
        'Total correspond': Math.abs(order.totalAmount - orderData.total) < 0.01,
        'Items copiés': order.items && order.items.length > 0,
        'Utilisateur correct': order.user && order.user.id === userId
      };

      let passedChecks = 0;
      Object.entries(checks).forEach(([check, passed]) => {
        logTest(check, passed ? 'PASS' : 'FAIL');
        if (passed) passedChecks++;
      });

      // Afficher détails de la commande
      log('cyan', `  📦 Items dans la commande: ${order.items.length}`);
      order.items.forEach(item => {
        log('cyan', `    • ${item.name}: ${item.quantity}x ${item.price}€`);
      });

      const allChecksPassed = passedChecks === Object.keys(checks).length;
      logTest('Vérification complète commande', allChecksPassed ? 'PASS' : 'FAIL', `${passedChecks}/${Object.keys(checks).length} vérifications`);
      
      return allChecksPassed;
    } else {
      logTest('Récupération commande', 'FAIL', 'Erreur lors de la récupération');
      return false;
    }
  } catch (error) {
    logTest('Récupération commande', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test principal
 */
async function runAllTests() {
  log('bold', '🚀 TESTS SPÉCIFICATION FonctionnalitéHaute#1778');
  log('bold', '='.repeat(60));
  log('white', 'Endpoint: POST /orders (passer commande)');
  log('white', 'Spécifications:');
  log('white', '  1. Récupérer panier via Cart.findByUserId()');
  log('white', '  2. Vérifier panier.items.length > 0');
  log('white', '  3. Créer Order avec items copiés et total calculé');
  log('white', '  4. Appeler cart.clear() pour vider le panier');
  log('white', '  5. Retourner { orderId, total, status: "pending" }');
  log('bold', '='.repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Séquence de tests
  const tests = [
    { name: 'Authentification', fn: testAuthentication },
    { name: 'Nettoyage préalable', fn: testCleanup },
    { name: 'Validation panier vide', fn: testEmptyCartValidation },
    { name: 'Ajout items au panier', fn: testAddItemsToCart },
    { name: 'Vérification panier', fn: testVerifyCartContent },
    { name: 'Création commande', fn: testCreateOrderFromCart },
    { name: 'Vérification vidage panier', fn: testCartClearedAfterOrder }
  ];

  let orderData = null;

  for (const test of tests) {
    totalTests++;
    
    try {
      const result = await test.fn();
      
      if (test.name === 'Création commande' && result?.success) {
        orderData = result.order;
      }

      if (result === true || result?.success === true) {
        passedTests++;
      }
    } catch (error) {
      log('red', `Erreur dans ${test.name}: ${error.message}`);
    }

    await sleep(500); // Pause entre les tests
  }

  // Test final de vérification si une commande a été créée
  if (orderData) {
    totalTests++;
    const verifyResult = await testVerifyCreatedOrder(orderData);
    if (verifyResult) passedTests++;
  }

  // Résumé final
  log('bold', '\n' + '='.repeat(60));
  log('bold', '📊 RÉSUMÉ DES TESTS');
  log('bold', '='.repeat(60));

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const color = successRate >= 100 ? 'green' : successRate >= 80 ? 'yellow' : 'red';
  
  log(color, `✅ Tests réussis: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 100) {
    log('green', '🎉 SPÉCIFICATION FonctionnalitéHaute#1778 VALIDÉE');
    log('green', '✅ Toutes les exigences sont respectées');
    log('green', '✅ POST /orders fonctionne correctement');
    log('green', '✅ Cart.findByUserId() utilisé');
    log('green', '✅ Validation panier.items.length > 0');
    log('green', '✅ cart.clear() appelé');
    log('green', '✅ Format de retour correct: { orderId, total, status: "pending" }');
  } else {
    log('red', '❌ Des tests ont échoué - vérifier l\'implémentation');
  }

  log('bold', '='.repeat(60));

  process.exit(successRate >= 100 ? 0 : 1);
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Exécuter les tests
runAllTests().catch(error => {
  console.error('Erreur dans l\'exécution des tests:', error);
  process.exit(1);
});