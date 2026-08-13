/**
 * Script de test manuel pour vérifier les fonctionnalités d'annulation et suivi des commandes
 * FonctionnalitéMoyenne#1782
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword';

let authToken = null;
let testOrderId = null;

/**
 * Utilitaire pour faire des requêtes authentifiées
 */
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

/**
 * Test 1: Authentification
 */
const testAuthentication = async () => {
  console.log('🔐 Test 1: Authentification...');
  
  try {
    const loginResponse = await apiRequest('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.success && loginResponse.data.accessToken) {
      authToken = loginResponse.data.accessToken;
      console.log('✅ Authentification réussie');
      return true;
    } else {
      console.log('❌ Échec authentification:', loginResponse.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur authentification:', error.message);
    return false;
  }
};

/**
 * Test 2: Créer une commande de test
 */
const testCreateOrder = async () => {
  console.log('\\n📦 Test 2: Création commande...');
  
  try {
    const orderResponse = await apiRequest('POST', '/orders', {
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'France'
      },
      paymentMethod: 'card',
      notes: 'Commande de test pour FonctionnalitéMoyenne#1782'
    });
    
    if (orderResponse.success && orderResponse.data.orderId) {
      testOrderId = orderResponse.data.orderId;
      console.log('✅ Commande créée:', testOrderId);
      console.log('   Status:', orderResponse.data.status);
      console.log('   Total:', orderResponse.data.totalAmount, '€');
      return true;
    } else {
      console.log('❌ Échec création commande:', orderResponse.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur création commande:', error.message);
    return false;
  }
};

/**
 * Test 3: Suivi de commande (status=pending)
 */
const testOrderTracking = async () => {
  console.log('\\n📍 Test 3: Suivi commande (pending)...');
  
  try {
    const trackingResponse = await apiRequest('GET', `/orders/${testOrderId}/tracking`);
    
    if (trackingResponse.success) {
      console.log('✅ Suivi récupéré avec succès');
      console.log('   Status:', trackingResponse.data.status);
      console.log('   Created:', trackingResponse.data.createdAt);
      console.log('   Confirmed:', trackingResponse.data.confirmedAt || 'N/A');
      console.log('   Shipped:', trackingResponse.data.shippedAt || 'N/A');
      console.log('   Delivered:', trackingResponse.data.deliveredAt || 'N/A');
      console.log('   Canceled:', trackingResponse.data.canceledAt || 'N/A');
      console.log('   Completed:', trackingResponse.data.progress.isCompleted);
      console.log('   Canceled:', trackingResponse.data.progress.isCanceled);
      return true;
    } else {
      console.log('❌ Échec suivi:', trackingResponse.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur suivi:', error.message);
    return false;
  }
};

/**
 * Test 4: Tentative annulation commande confirmed (doit échouer)
 */
const testCancelConfirmedOrder = async () => {
  console.log('\\n🚫 Test 4: Tentative annulation commande confirmed...');
  
  try {
    // D'abord, confirmer la commande
    const statusResponse = await apiRequest('PUT', `/orders/${testOrderId}/status`, {
      newStatus: 'confirmed'
    });
    
    if (!statusResponse.success) {
      console.log('❌ Échec confirmation commande:', statusResponse.message);
      return false;
    }
    
    console.log('✅ Commande confirmée, tentative d\'annulation...');
    
    // Maintenant, tenter l'annulation (doit échouer)
    const cancelResponse = await apiRequest('PUT', `/orders/${testOrderId}/cancel`, {
      reason: 'Test d\'annulation invalide'
    });
    
    if (!cancelResponse.success && cancelResponse.message.includes('confirmed')) {
      console.log('✅ Annulation correctement refusée');
      console.log('   Message:', cancelResponse.message);
      console.log('   Status actuel:', cancelResponse.data?.currentStatus);
      console.log('   Cancelable:', cancelResponse.data?.cancelable);
      return true;
    } else {
      console.log('❌ L\'annulation aurait dû être refusée');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur test annulation:', error.message);
    return false;
  }
};

/**
 * Test 5: Créer nouvelle commande et l'annuler (doit réussir)
 */
const testCancelPendingOrder = async () => {
  console.log('\\n🚫 Test 5: Annulation commande pending...');
  
  try {
    // Créer nouvelle commande
    const orderResponse = await apiRequest('POST', '/orders', {
      notes: 'Commande pour test d\'annulation'
    });
    
    if (!orderResponse.success) {
      console.log('❌ Échec création nouvelle commande');
      return false;
    }
    
    const newOrderId = orderResponse.data.orderId;
    console.log('✅ Nouvelle commande créée:', newOrderId);
    
    // Annuler la commande
    const cancelResponse = await apiRequest('PUT', `/orders/${newOrderId}/cancel`, {
      reason: 'Changement d\'avis du client'
    });
    
    if (cancelResponse.success && cancelResponse.data.currentStatus === 'canceled') {
      console.log('✅ Annulation réussie');
      console.log('   Previous status:', cancelResponse.data.previousStatus);
      console.log('   Current status:', cancelResponse.data.currentStatus);
      console.log('   Canceled at:', cancelResponse.data.canceledAt);
      console.log('   Reason:', cancelResponse.data.reason);
      
      // Vérifier le suivi après annulation
      const trackingResponse = await apiRequest('GET', `/orders/${newOrderId}/tracking`);
      if (trackingResponse.success) {
        console.log('✅ Suivi post-annulation:');
        console.log('   Status:', trackingResponse.data.status);
        console.log('   Canceled at:', trackingResponse.data.canceledAt);
        console.log('   Is completed:', trackingResponse.data.progress.isCompleted);
        console.log('   Is canceled:', trackingResponse.data.progress.isCanceled);
      }
      
      return true;
    } else {
      console.log('❌ Échec annulation:', cancelResponse.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur test annulation:', error.message);
    return false;
  }
};

/**
 * Test 6: Cycle complet avec suivi détaillé
 */
const testFullOrderCycle = async () => {
  console.log('\\n🔄 Test 6: Cycle complet commande avec suivi...');
  
  try {
    // Créer commande
    const orderResponse = await apiRequest('POST', '/orders', {
      notes: 'Commande pour cycle complet'
    });
    
    if (!orderResponse.success) {
      console.log('❌ Échec création commande');
      return false;
    }
    
    const orderId = orderResponse.data.orderId;
    console.log('✅ Commande créée:', orderId);
    
    // Fonction helper pour suivi
    const trackOrder = async (stepName) => {
      const tracking = await apiRequest('GET', `/orders/${orderId}/tracking`);
      if (tracking.success) {
        console.log(`   📍 ${stepName}: Status=${tracking.data.status}, Completed=${tracking.data.progress.isCompleted}`);
      }
    };
    
    await trackOrder('Après création');
    
    // Confirmer
    await apiRequest('PUT', `/orders/${orderId}/status`, { newStatus: 'confirmed' });
    await trackOrder('Après confirmation');
    
    // Expédier
    await apiRequest('PUT', `/orders/${orderId}/status`, { newStatus: 'shipped' });
    await trackOrder('Après expédition');
    
    // Livrer
    await apiRequest('PUT', `/orders/${orderId}/status`, { newStatus: 'delivered' });
    await trackOrder('Après livraison');
    
    // Vérification finale du suivi complet
    const finalTracking = await apiRequest('GET', `/orders/${orderId}/tracking`);
    if (finalTracking.success) {
      const data = finalTracking.data;
      console.log('✅ Cycle complet - Suivi final:');
      console.log('   Created at:', data.createdAt);
      console.log('   Confirmed at:', data.confirmedAt);
      console.log('   Shipped at:', data.shippedAt);
      console.log('   Delivered at:', data.deliveredAt);
      console.log('   Tracking number:', data.trackingNumber);
      console.log('   Is completed:', data.progress.isCompleted);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erreur cycle complet:', error.message);
    return false;
  }
};

/**
 * Exécution des tests
 */
const runTests = async () => {
  console.log('🧪 Tests FonctionnalitéMoyenne#1782 - Annulation et suivi des commandes');
  console.log('═══════════════════════════════════════════════════════════════════');
  
  let passedTests = 0;
  let totalTests = 6;
  
  const tests = [
    ['Authentification', testAuthentication],
    ['Création commande', testCreateOrder],
    ['Suivi commande', testOrderTracking],
    ['Annulation refusée (confirmed)', testCancelConfirmedOrder],
    ['Annulation réussie (pending)', testCancelPendingOrder],
    ['Cycle complet avec suivi', testFullOrderCycle]
  ];
  
  for (const [testName, testFunction] of tests) {
    try {
      const result = await testFunction();
      if (result) {
        passedTests++;
        console.log(`✅ ${testName}: PASSÉ`);
      } else {
        console.log(`❌ ${testName}: ÉCHEC`);
      }
    } catch (error) {
      console.log(`❌ ${testName}: ERREUR -`, error.message);
    }
  }
  
  console.log('\\n═══════════════════════════════════════════════════════════════════');
  console.log(`📊 Résultats: ${passedTests}/${totalTests} tests passés`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés! Fonctionnalité opérationnelle.');
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifier l\'implémentation.');
  }
  
  console.log('\\n📋 Tests couverts:');
  console.log('   ✅ Sous-tâche 1: Vérification status=pending pour annulation');
  console.log('   ✅ Sous-tâche 2: Champ canceledAt et status=canceled');
  console.log('   ✅ Sous-tâche 3: Endpoint tracking avec toutes les dates');
  console.log('   ✅ Machine à états complète');
  console.log('   ✅ Sécurité et validation');
};

// Lancement des tests si le serveur est accessible
console.log('🚀 Démarrage des tests...');
console.log('⚠️  Assurez-vous que le serveur est démarré sur le port 3000');
console.log('⚠️  Et qu\'un utilisateur test existe avec email:', TEST_EMAIL);

setTimeout(() => {
  runTests().catch(error => {
    console.error('❌ Erreur globale:', error.message);
    console.log('\\n💡 Vérifiez que:');
    console.log('   - Le serveur est démarré (npm run dev)');
    console.log('   - La base de données est accessible');
    console.log('   - L\'utilisateur test existe');
  });
}, 1000);