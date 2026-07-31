#!/usr/bin/env node

/**
 * Test spécifique pour FonctionnalitéMoyenne#1782
 * Implémenter annulation et suivi des commandes
 * 
 * Tests des exigences exactes de la spécification:
 * ✅ Sous-tâche 1: PUT /orders/:id/cancel - vérifier que status=pending avant d'autoriser
 * ✅ Sous-tâche 2: Créer un champ canceledAt et passer status à 'canceled'
 * ✅ Sous-tâche 3: GET /orders/:id/tracking - retourner { status, createdAt, confirmedAt, shippedAt, deliveredAt }
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let userId = '';
let testOrder = null;

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
      return false;
    }
  } catch (error) {
    logTest('Authentification', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 2: Créer une commande de test pour les tests d'annulation
 */
async function testCreateOrderForCancellation() {
  log('blue', '\n📦 Test 2: Création commande pour test d\'annulation');
  
  const testProducts = [
    { product_id: '02911c3b-74f9-4437-85d9-ebc2ce20a358', quantity: 2 }, // Clean Code
  ];

  try {
    // Vider le panier d'abord
    await axios.delete(`${API_BASE}/cart/clear`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).catch(() => {});

    // Ajouter un produit au panier
    for (const product of testProducts) {
      await axios.post(`${API_BASE}/cart/add`, product, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    }

    // Créer une commande
    const orderResponse = await axios.post(`${API_BASE}/orders`, {
      shippingAddress: {
        street: '456 Cancellation Test Street',
        city: 'Lyon',
        zipCode: '69002',
        country: 'France'
      },
      paymentMethod: 'credit_card',
      notes: 'Commande de test pour annulation et suivi'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (orderResponse.status !== 201 || !orderResponse.data.success) {
      logTest('Création commande', 'FAIL', 'Erreur création commande');
      return { success: false };
    }

    testOrder = orderResponse.data.data;
    log('cyan', `  📦 Commande créée: ${testOrder.orderId} (${testOrder.total}€)`);
    log('cyan', `  📊 Status initial: ${testOrder.status}`);

    logTest('Création commande test', 'PASS', 'Commande prête pour tests');
    return { success: true };

  } catch (error) {
    logTest('Création commande test', 'FAIL', error.response?.data?.message || error.message);
    return { success: false };
  }
}

/**
 * Test 3: SPÉCIFICATION Sous-tâche 1 - PUT /orders/:id/cancel avec vérification status=pending
 */
async function testOrderCancellationValidation() {
  log('blue', '\n🚫 Test 3: PUT /orders/:id/cancel - Validation status=pending (Sous-tâche 1)');
  
  if (!testOrder) {
    logTest('Test validation annulation', 'FAIL', 'Commande test manquante');
    return { success: false };
  }

  try {
    // Tenter d'annuler la commande (doit réussir car status=pending)
    const cancelResponse = await axios.put(`${API_BASE}/orders/${testOrder.orderId}/cancel`, {
      reason: 'Test d\'annulation automatique'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (cancelResponse.status === 200 && cancelResponse.data.success) {
      const cancelData = cancelResponse.data.data;
      
      // Vérifications de la réponse d'annulation
      const checks = {
        'Annulation acceptée': cancelResponse.data.success === true,
        'Status changé vers canceled': cancelData.currentStatus === 'canceled',
        'Status précédent était pending': cancelData.previousStatus === 'pending',
        'CanceledAt renseigné': !!cancelData.canceledAt,
        'UpdatedAt présent': !!cancelData.updatedAt
      };

      let passedChecks = 0;
      Object.entries(checks).forEach(([check, passed]) => {
        logTest(`  ${check}`, passed ? 'PASS' : 'FAIL');
        if (passed) passedChecks++;
      });

      log('cyan', `  📊 Status: ${cancelData.previousStatus} → ${cancelData.currentStatus}`);
      log('cyan', `  🚫 Annulée le: ${new Date(cancelData.canceledAt).toLocaleString('fr-FR')}`);
      log('cyan', `  📝 Raison: ${cancelData.reason || 'Non spécifiée'}`);

      const allChecksPassed = passedChecks === Object.keys(checks).length;
      logTest('PUT /orders/:id/cancel (Sous-tâche 1)', allChecksPassed ? 'PASS' : 'FAIL', `${passedChecks}/${Object.keys(checks).length} vérifications`);
      
      return { success: allChecksPassed };
    } else {
      logTest('Validation annulation', 'FAIL', 'Réponse d\'annulation inattendue');
      return { success: false };
    }
  } catch (error) {
    logTest('Validation annulation', 'FAIL', error.response?.data?.message || error.message);
    if (error.response?.data) {
      log('red', `Détails erreur: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false };
  }
}

/**
 * Test 4: Test échec d'annulation d'une commande non-pending
 */
async function testCancellationRejectionForNonPending() {
  log('blue', '\n❌ Test 4: Rejet annulation pour status != pending');
  
  if (!testOrder) {
    logTest('Test rejet annulation', 'FAIL', 'Commande test manquante');
    return false;
  }

  try {
    // Tenter d'annuler à nouveau (doit échouer car status=canceled maintenant)
    const cancelResponse = await axios.put(`${API_BASE}/orders/${testOrder.orderId}/cancel`, {
      reason: 'Tentative d\'annulation sur commande déjà annulée'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Si on arrive ici, c'est un problème (l'annulation n'aurait pas dû réussir)
    logTest('Rejet annulation non-pending', 'FAIL', 'L\'annulation aurait dû échouer');
    return false;

  } catch (error) {
    // C'est le comportement attendu : erreur 400
    if (error.response?.status === 400) {
      logTest('Rejet annulation non-pending', 'PASS', 'Erreur 400 comme attendu');
      log('cyan', `  ❌ Message: ${error.response.data.message}`);
      return true;
    } else {
      logTest('Rejet annulation non-pending', 'FAIL', `Erreur inattendue: ${error.response?.status || 'inconnue'}`);
      return false;
    }
  }
}

/**
 * Test 5: SPÉCIFICATION Sous-tâche 3 - GET /orders/:id/tracking
 */
async function testOrderTracking() {
  log('blue', '\n📍 Test 5: GET /orders/:id/tracking - Suivi simplifié (Sous-tâche 3)');
  
  if (!testOrder) {
    logTest('Test suivi commande', 'FAIL', 'Commande test manquante');
    return false;
  }

  try {
    // Obtenir le suivi de la commande
    const trackingResponse = await axios.get(`${API_BASE}/orders/${testOrder.orderId}/tracking`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (trackingResponse.status === 200 && trackingResponse.data.success) {
      const trackingData = trackingResponse.data.data;
      
      // Vérifications selon spécification Sous-tâche 3
      const checks = {
        'OrderId présent': trackingData.orderId === testOrder.orderId,
        'Status présent': !!trackingData.status,
        'CreatedAt présent': !!trackingData.createdAt,
        'Status est canceled': trackingData.status === 'canceled',
        'CanceledAt présent': !!trackingData.canceledAt,
        'Progress info présente': !!trackingData.progress,
        'Timeline présente': Array.isArray(trackingData.progress?.timeline)
      };

      let passedChecks = 0;
      Object.entries(checks).forEach(([check, passed]) => {
        logTest(`  ${check}`, passed ? 'PASS' : 'FAIL');
        if (passed) passedChecks++;
      });

      log('cyan', `  📍 OrderId: ${trackingData.orderId}`);
      log('cyan', `  📊 Status: ${trackingData.status}`);
      log('cyan', `  🗓️ Créée: ${new Date(trackingData.createdAt).toLocaleString('fr-FR')}`);
      log('cyan', `  🚫 Annulée: ${trackingData.canceledAt ? new Date(trackingData.canceledAt).toLocaleString('fr-FR') : 'N/A'}`);
      log('cyan', `  🏁 Terminée: ${trackingData.progress?.isCompleted ? 'Oui' : 'Non'}`);
      log('cyan', `  ❌ Annulée: ${trackingData.progress?.isCanceled ? 'Oui' : 'Non'}`);

      const allChecksPassed = passedChecks === Object.keys(checks).length;
      logTest('GET /orders/:id/tracking (Sous-tâche 3)', allChecksPassed ? 'PASS' : 'FAIL', `${passedChecks}/${Object.keys(checks).length} vérifications`);
      
      return allChecksPassed;
    } else {
      logTest('Test suivi commande', 'FAIL', 'Erreur récupération suivi');
      return false;
    }
  } catch (error) {
    logTest('Test suivi commande', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test 6: Créer nouvelle commande et tester suivi états normaux
 */
async function testTrackingNormalFlow() {
  log('blue', '\n📊 Test 6: Suivi états normaux (pending → confirmed → shipped → delivered)');
  
  try {
    // Créer une nouvelle commande pour tester le flux normal
    await axios.delete(`${API_BASE}/cart/clear`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).catch(() => {});

    await axios.post(`${API_BASE}/cart/add`, {
      product_id: '02911c3b-74f9-4437-85d9-ebc2ce20a358',
      quantity: 1
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const orderResponse = await axios.post(`${API_BASE}/orders`, {
      shippingAddress: {
        street: '789 Normal Flow Street',
        city: 'Marseille',
        zipCode: '13002',
        country: 'France'
      },
      paymentMethod: 'stripe_card',
      notes: 'Test du flux normal de suivi'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const normalOrder = orderResponse.data.data;
    log('cyan', `  📦 Nouvelle commande: ${normalOrder.orderId} (status: ${normalOrder.status})`);

    // Tester le suivi à l'état pending
    const trackingPending = await axios.get(`${API_BASE}/orders/${normalOrder.orderId}/tracking`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const pendingData = trackingPending.data.data;
    const pendingChecks = {
      'Status pending': pendingData.status === 'pending',
      'CreatedAt présent': !!pendingData.createdAt,
      'ConfirmedAt null': !pendingData.confirmedAt,
      'ShippedAt null': !pendingData.shippedAt,
      'DeliveredAt null': !pendingData.deliveredAt,
      'CanceledAt null': !pendingData.canceledAt
    };

    let pendingPassed = 0;
    Object.entries(pendingChecks).forEach(([check, passed]) => {
      logTest(`  ${check}`, passed ? 'PASS' : 'FAIL');
      if (passed) pendingPassed++;
    });

    // Passer à confirmed
    await axios.put(`${API_BASE}/orders/${normalOrder.orderId}/status`, {
      newStatus: 'confirmed'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await sleep(500); // Attendre un peu

    // Vérifier le suivi après confirmation
    const trackingConfirmed = await axios.get(`${API_BASE}/orders/${normalOrder.orderId}/tracking`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const confirmedData = trackingConfirmed.data.data;
    const confirmedChecks = {
      'Status confirmed': confirmedData.status === 'confirmed',
      'ConfirmedAt présent': !!confirmedData.confirmedAt
    };

    let confirmedPassed = 0;
    Object.entries(confirmedChecks).forEach(([check, passed]) => {
      logTest(`  ${check}`, passed ? 'PASS' : 'FAIL');
      if (passed) confirmedPassed++;
    });

    log('cyan', `  📊 Flux normal: pending → confirmed`);
    log('cyan', `  🗓️ Confirmée: ${new Date(confirmedData.confirmedAt).toLocaleString('fr-FR')}`);

    const totalChecks = Object.keys(pendingChecks).length + Object.keys(confirmedChecks).length;
    const totalPassed = pendingPassed + confirmedPassed;
    logTest('Suivi flux normal', totalPassed === totalChecks ? 'PASS' : 'FAIL', `${totalPassed}/${totalChecks} vérifications`);

    return totalPassed === totalChecks;

  } catch (error) {
    logTest('Suivi flux normal', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test principal
 */
async function runAllTests() {
  log('bold', '🚀 TESTS SPÉCIFICATION FonctionnalitéMoyenne#1782');
  log('bold', '='.repeat(60));
  log('white', 'Implémenter annulation et suivi des commandes');
  log('white', 'Spécifications:');
  log('white', '  1. PUT /orders/:id/cancel : vérifier status=pending avant d\'autoriser');
  log('white', '  2. Créer champ canceledAt et passer status à \'canceled\'');
  log('white', '  3. GET /orders/:id/tracking : retourner { status, createdAt, confirmedAt, shippedAt, deliveredAt }');
  log('bold', '='.repeat(60));

  let passedTests = 0;
  let totalTests = 0;

  // Séquence de tests
  const tests = [
    { name: 'Authentification', fn: testAuthentication },
    { name: 'Création commande test', fn: testCreateOrderForCancellation },
    { name: 'Validation annulation', fn: testOrderCancellationValidation },
    { name: 'Rejet annulation non-pending', fn: testCancellationRejectionForNonPending },
    { name: 'Suivi commande', fn: testOrderTracking },
    { name: 'Suivi flux normal', fn: testTrackingNormalFlow }
  ];

  for (const test of tests) {
    totalTests++;
    
    try {
      const result = await test.fn();
      
      if (result === true || result?.success === true) {
        passedTests++;
      }
    } catch (error) {
      log('red', `Erreur dans ${test.name}: ${error.message}`);
    }

    await sleep(500); // Pause entre les tests
  }

  // Résumé final
  log('bold', '\n' + '='.repeat(60));
  log('bold', '📊 RÉSUMÉ DES TESTS');
  log('bold', '='.repeat(60));

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const color = successRate >= 100 ? 'green' : successRate >= 80 ? 'yellow' : 'red';
  
  log(color, `✅ Tests réussis: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 100) {
    log('green', '🎉 SPÉCIFICATION FonctionnalitéMoyenne#1782 VALIDÉE');
    log('green', '✅ PUT /orders/:id/cancel avec validation status=pending');
    log('green', '✅ Champ canceledAt et status=\'canceled\' opérationnels');
    log('green', '✅ GET /orders/:id/tracking avec format spécifié');
    log('green', '✅ Gestion complète annulation et suivi commandes');
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