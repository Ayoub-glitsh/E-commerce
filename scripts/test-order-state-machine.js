/**
 * Test de la machine à états des commandes
 * FonctionnalitéHaute#1777
 * 
 * Ce script teste spécifiquement la validation des transitions de statut :
 * - Transitions valides : pending -> confirmed -> shipped -> delivered
 * - Transitions invalides : toute transition en arrière (ex: shipped -> pending)
 */

require('dotenv').config();
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

class OrderStateMachineTester {
  constructor() {
    this.accessToken = null;
    this.testOrderId = null;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  /**
   * Enregistrer un résultat de test
   */
  recordTest(testName, success, details = '') {
    this.results.total++;
    if (success) {
      this.results.passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName} - ${details}`);
    }
    
    this.results.details.push({
      test: testName,
      status: success ? 'PASSED' : 'FAILED',
      details: details
    });
  }

  /**
   * Créer un utilisateur et s'authentifier
   */
  async authenticate() {
    try {
      console.log('🔧 Configuration utilisateur de test...');
      
      // Créer un utilisateur
      const userData = {
        email: faker.internet.email().toLowerCase(),
        password: 'TestPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      };

      await axios.post(`${API_BASE}/auth/register`, userData);
      
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      this.accessToken = loginResponse.data.data.accessToken;
      console.log('✅ Authentification réussie');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur authentification:', error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Headers avec authentification
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Créer une commande de test
   */
  async createTestOrder() {
    try {
      console.log('\n🛒 Création d\'une commande de test...');
      
      // Créer la commande directement avec des items
      const testItems = [
        {
          productId: '0cc8991c-ebbf-4a1a-8cce-306d07371592',
          name: 'iPhone 15 Pro Max',
          price: 1299.99,
          quantity: 1
        },
        {
          productId: '7c2857e1-5f96-4665-b605-246cabce15c1',
          name: 'MacBook Pro 16"',
          price: 2499.99,
          quantity: 1
        }
      ];

      const orderResponse = await axios.post(`${API_BASE}/orders`, {
        items: testItems, // Fournir les items directement
        shippingAddress: {
          street: '123 Rue Test',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        },
        paymentMethod: 'credit_card',
        notes: 'Commande de test pour machine à états'
      }, {
        headers: this.getAuthHeaders()
      });

      this.testOrderId = orderResponse.data.data.orderId;
      console.log(`✅ Commande créée: ${this.testOrderId}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur création commande:', error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 1: Vérifier le statut initial
   */
  async testInitialStatus() {
    try {
      const response = await axios.get(`${API_BASE}/orders/${this.testOrderId}`, {
        headers: this.getAuthHeaders()
      });

      const success = response.data.data.status === 'pending';
      
      this.recordTest(
        'Statut initial = pending',
        success,
        success ? 'Commande initialisée correctement' : `Statut: ${response.data.data.status}`
      );

      return success;

    } catch (error) {
      this.recordTest('Statut initial = pending', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 2: Transition valide pending -> confirmed
   */
  async testValidTransitionPendingToConfirmed() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'confirmed'
      }, {
        headers: this.getAuthHeaders()
      });

      const success = response.status === 200 && response.data.data.currentStatus === 'confirmed';
      
      this.recordTest(
        'Transition valide: pending -> confirmed',
        success,
        success ? 'Transition autorisée et effectuée' : `Erreur: ${response.data.message}`
      );

      return success;

    } catch (error) {
      this.recordTest('Transition valide: pending -> confirmed', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 3: Transition valide confirmed -> shipped
   */
  async testValidTransitionConfirmedToShipped() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'shipped'
      }, {
        headers: this.getAuthHeaders()
      });

      const success = response.status === 200 && 
                     response.data.data.currentStatus === 'shipped' &&
                     response.data.data.trackingNumber; // Doit avoir généré un tracking number

      this.recordTest(
        'Transition valide: confirmed -> shipped',
        success,
        success ? `Transition effectuée avec tracking: ${response.data.data.trackingNumber}` : 'Transition échouée'
      );

      return success;

    } catch (error) {
      this.recordTest('Transition valide: confirmed -> shipped', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 4: Transition INVALIDE shipped -> pending (TEST PRINCIPAL)
   */
  async testInvalidTransitionShippedToPending() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'pending'
      }, {
        headers: this.getAuthHeaders()
      });

      // Si on arrive ici, le test a échoué car la transition a été autorisée
      this.recordTest(
        'Transition invalide: shipped -> pending (DOIT ÉCHOUER)',
        false,
        'La transition invalide a été autorisée à tort'
      );

      return false;

    } catch (error) {
      // On s'attend à une erreur 400
      const success = error.response?.status === 400;
      
      this.recordTest(
        'Transition invalide: shipped -> pending (DOIT ÉCHOUER)',
        success,
        success ? 'Transition correctement rejetée avec 400' : `Code erreur: ${error.response?.status}`
      );

      return success;
    }
  }

  /**
   * Test 5: Transition INVALIDE shipped -> confirmed (retour en arrière)
   */
  async testInvalidTransitionShippedToConfirmed() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'confirmed'
      }, {
        headers: this.getAuthHeaders()
      });

      this.recordTest(
        'Transition invalide: shipped -> confirmed (DOIT ÉCHOUER)',
        false,
        'La transition invalide a été autorisée à tort'
      );

      return false;

    } catch (error) {
      const success = error.response?.status === 400;
      
      this.recordTest(
        'Transition invalide: shipped -> confirmed (DOIT ÉCHOUER)', 
        success,
        success ? 'Transition correctement rejetée' : `Code erreur: ${error.response?.status}`
      );

      return success;
    }
  }

  /**
   * Test 6: Transition valide shipped -> delivered
   */
  async testValidTransitionShippedToDelivered() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'delivered'
      }, {
        headers: this.getAuthHeaders()
      });

      const success = response.status === 200 && response.data.data.currentStatus === 'delivered';
      
      this.recordTest(
        'Transition valide: shipped -> delivered',
        success,
        success ? 'Transition finale effectuée' : 'Transition échouée'
      );

      return success;

    } catch (error) {
      this.recordTest('Transition valide: shipped -> delivered', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 7: Vérifier qu'aucune transition n'est possible depuis delivered
   */
  async testNoTransitionsFromDelivered() {
    try {
      const response = await axios.get(`${API_BASE}/orders/${this.testOrderId}/transitions`, {
        headers: this.getAuthHeaders()
      });

      const success = response.data.data.availableTransitions.length === 0;
      
      this.recordTest(
        'État final: aucune transition depuis delivered',
        success,
        success ? 'État final correctement détecté' : `Transitions: ${response.data.data.availableTransitions.join(', ')}`
      );

      return success;

    } catch (error) {
      this.recordTest('État final: aucune transition depuis delivered', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 8: Tentative de transition depuis delivered (doit échouer)
   */
  async testInvalidTransitionFromDelivered() {
    try {
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'shipped'
      }, {
        headers: this.getAuthHeaders()
      });

      this.recordTest(
        'Transition invalide: delivered -> shipped (DOIT ÉCHOUER)',
        false,
        'Transition depuis état final autorisée à tort'
      );

      return false;

    } catch (error) {
      const success = error.response?.status === 400;
      
      this.recordTest(
        'Transition invalide: delivered -> shipped (DOIT ÉCHOUER)',
        success,
        success ? 'État final correctement protégé' : `Code erreur: ${error.response?.status}`
      );

      return success;
    }
  }

  /**
   * Test des statuts disponibles
   */
  async testAvailableStatuses() {
    try {
      const response = await axios.get(`${API_BASE}/orders/statuses`, {
        headers: this.getAuthHeaders()
      });

      const expectedStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
      const actualStatuses = response.data.data.statuses;
      
      const success = expectedStatuses.every(status => actualStatuses.includes(status));
      
      this.recordTest(
        'API statuses disponibles',
        success,
        success ? `Statuses: ${actualStatuses.join(', ')}` : 'Statuses manquants'
      );

      return success;

    } catch (error) {
      this.recordTest('API statuses disponibles', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🔄 TESTS MACHINE À ÉTATS DES COMMANDES');
    console.log('=====================================');
    console.log('Test de validation des transitions selon FonctionnalitéHaute#1777\n');
    
    // Configuration
    const authOk = await this.authenticate();
    if (!authOk) return;
    
    const orderOk = await this.createTestOrder();
    if (!orderOk) return;
    
    console.log('\n🧪 Exécution des tests de machine à états...\n');
    
    // Tests séquentiels (chaque test dépend du précédent)
    await this.testInitialStatus();
    await this.testValidTransitionPendingToConfirmed();
    await this.testValidTransitionConfirmedToShipped();
    
    // Tests des transitions invalides (partie cruciale)
    await this.testInvalidTransitionShippedToPending(); // TEST PRINCIPAL
    await this.testInvalidTransitionShippedToConfirmed();
    
    // Finaliser la commande
    await this.testValidTransitionShippedToDelivered();
    
    // Tests de l'état final
    await this.testNoTransitionsFromDelivered();
    await this.testInvalidTransitionFromDelivered();
    
    // Test API générique
    await this.testAvailableStatuses();
    
    // Affichage des résultats
    this.displayResults();
  }

  /**
   * Afficher les résultats
   */
  displayResults() {
    console.log('\n📊 RÉSULTATS TESTS MACHINE À ÉTATS');
    console.log('==================================');
    console.log(`Total: ${this.results.total}`);
    console.log(`✅ Réussis: ${this.results.passed}`);
    console.log(`❌ Échoués: ${this.results.failed}`);
    console.log(`📈 Taux de réussite: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Tests échoués:');
      this.results.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => console.log(`  - ${test.test}: ${test.details}`));
    }
    
    console.log('\n🎯 CONFORMITÉ SPÉCIFICATION');
    console.log('===========================');
    
    // Test spécifique mentionné dans la spécification
    const mainTest = this.results.details.find(test => 
      test.test.includes('shipped -> pending')
    );
    
    if (mainTest && mainTest.status === 'PASSED') {
      console.log('✅ TEST REQUIS: Transition shipped -> pending correctement rejetée');
      console.log('✅ Machine à états fonctionnelle : aucun retour en arrière autorisé');
    } else {
      console.log('❌ TEST REQUIS: La machine à états ne fonctionne pas correctement');
    }
    
    const validTransitions = this.results.details.filter(test => 
      test.test.includes('Transition valide') && test.status === 'PASSED'
    ).length;
    
    const invalidTransitions = this.results.details.filter(test => 
      test.test.includes('DOIT ÉCHOUER') && test.status === 'PASSED'
    ).length;
    
    console.log(`✅ Transitions valides: ${validTransitions}/4`);
    console.log(`🚫 Transitions invalides rejetées: ${invalidTransitions}/3`);
    
    if (this.results.passed === this.results.total) {
      console.log('\n🎉 MACHINE À ÉTATS PARFAITEMENT IMPLÉMENTÉE !');
      console.log('✅ Toutes les transitions valides fonctionnent');
      console.log('✅ Toutes les transitions invalides sont rejetées');
      console.log('✅ FonctionnalitéHaute#1777 complètement validée');
    } else {
      console.log('\n⚠️  Des corrections sont nécessaires dans la machine à états');
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new OrderStateMachineTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = OrderStateMachineTester;