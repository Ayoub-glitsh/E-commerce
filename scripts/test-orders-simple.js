/**
 * Test simple du système de commandes
 * FonctionnalitéHaute#1777
 * 
 * Test de base pour vérifier les fonctionnalités principales :
 * - Création de commande depuis le panier
 * - Consultation des commandes
 * - Mise à jour de statut basique
 */

require('dotenv').config();
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

class SimpleOrderTester {
  constructor() {
    this.accessToken = null;
    this.testOrderId = null;
  }

  /**
   * Authentifier un utilisateur
   */
  async authenticate() {
    try {
      console.log('🔧 Création utilisateur de test...');
      
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
   * Préparer le panier avec des produits
   */
  async setupCart() {
    try {
      console.log('\n🛒 Préparation du panier...');
      
      // Ajouter quelques produits au panier
      const products = [
        {
          productId: '0cc8991c-ebbf-4a1a-8cce-306d07371592',
          quantity: 2,
          price: 25.99,
          name: 'iPhone 15 Pro Max'
        },
        {
          productId: '7c2857e1-5f96-4665-b605-246cabce15c1',
          quantity: 1,
          price: 599.99,
          name: 'MacBook Pro 16"'
        }
      ];

      for (const product of products) {
        await axios.post(`${API_BASE}/cart/add`, product, {
          headers: this.getAuthHeaders()
        });
      }

      console.log(`✅ ${products.length} produits ajoutés au panier`);
      return true;
      
    } catch (error) {
      console.error('❌ Erreur préparation panier:', error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test 1: Créer une commande
   */
  async testCreateOrder() {
    try {
      console.log('\n1️⃣ Test création de commande...');
      
      const orderData = {
        shippingAddress: {
          street: '123 Rue de Test',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        },
        billingAddress: {
          street: '123 Rue de Test',
          city: 'Paris', 
          zipCode: '75001',
          country: 'France'
        },
        paymentMethod: 'credit_card',
        notes: 'Commande de test simple'
      };

      const response = await axios.post(`${API_BASE}/orders`, orderData, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 201 && response.data.success && response.data.data.orderId) {
        this.testOrderId = response.data.data.orderId;
        console.log(`✅ Commande créée: ${this.testOrderId}`);
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Total: ${response.data.data.totalAmount}€`);
        console.log(`   Items: ${response.data.data.itemsCount}`);
        return true;
      } else {
        console.log(`❌ Création commande échouée - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Création commande échouée: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test 2: Récupérer la liste des commandes
   */
  async testGetOrders() {
    try {
      console.log('\n2️⃣ Test récupération commandes...');
      
      const response = await axios.get(`${API_BASE}/orders`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 200 && response.data.success) {
        const ordersCount = response.data.data.orders.length;
        console.log(`✅ ${ordersCount} commande(s) récupérée(s)`);
        
        if (ordersCount > 0) {
          const order = response.data.data.orders[0];
          console.log(`   Dernière commande: ${order.orderId} (${order.status})`);
        }
        
        return true;
      } else {
        console.log(`❌ Récupération échouée - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Récupération échouée: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test 3: Récupérer une commande spécifique
   */
  async testGetOrderById() {
    try {
      console.log('\n3️⃣ Test récupération commande spécifique...');
      
      const response = await axios.get(`${API_BASE}/orders/${this.testOrderId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 200 && response.data.success) {
        const order = response.data.data;
        console.log(`✅ Commande ${order.orderId} récupérée`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ${order.totalAmount}€`);
        console.log(`   Items: ${order.items.length}`);
        console.log(`   Transitions possibles: [${order.availableTransitions.join(', ')}]`);
        return true;
      } else {
        console.log(`❌ Récupération échouée - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Récupération échouée: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test 4: Mettre à jour le statut (transition valide)
   */
  async testUpdateStatus() {
    try {
      console.log('\n4️⃣ Test mise à jour statut...');
      
      const response = await axios.put(`${API_BASE}/orders/${this.testOrderId}/status`, {
        newStatus: 'confirmed'
      }, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 200 && response.data.success) {
        console.log(`✅ Statut mis à jour: ${response.data.data.previousStatus} -> ${response.data.data.currentStatus}`);
        console.log(`   Nouvelles transitions: [${response.data.data.availableTransitions.join(', ')}]`);
        return true;
      } else {
        console.log(`❌ Mise à jour échouée - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Mise à jour échouée: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test 5: Consulter les statuts disponibles
   */
  async testGetStatuses() {
    try {
      console.log('\n5️⃣ Test consultation statuts disponibles...');
      
      const response = await axios.get(`${API_BASE}/orders/statuses`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 200 && response.data.success) {
        const statuses = response.data.data.statuses;
        console.log(`✅ Statuts disponibles: [${statuses.join(', ')}]`);
        console.log(`   Descriptions disponibles: ${Object.keys(response.data.data.statusDescriptions).length}`);
        return true;
      } else {
        console.log(`❌ Consultation échouée - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Consultation échouée: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runTests() {
    console.log('🧪 TEST SIMPLE DU SYSTÈME DE COMMANDES');
    console.log('======================================');
    console.log('Validation des fonctionnalités de base - FonctionnalitéHaute#1777\n');
    
    // Configuration
    const authOk = await this.authenticate();
    if (!authOk) return;
    
    const cartOk = await this.setupCart();
    if (!cartOk) return;
    
    // Tests des fonctionnalités principales
    const results = [];
    results.push(await this.testCreateOrder());
    results.push(await this.testGetOrders());
    results.push(await this.testGetOrderById());
    results.push(await this.testUpdateStatus());
    results.push(await this.testGetStatuses());
    
    // Résultats
    console.log('\n📊 RÉSULTATS');
    console.log('============');
    
    const passedCount = results.filter(r => r).length;
    const totalCount = results.length;
    
    console.log(`✅ Tests réussis: ${passedCount}/${totalCount}`);
    console.log(`📈 Taux de réussite: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS !');
      console.log('✅ Les fonctionnalités de base des commandes fonctionnent');
      console.log('✅ FonctionnalitéHaute#1777 - Fonctionnalités de base validées');
    } else {
      console.log('\n⚠️  Certains tests ont échoué');
      console.log('❌ Vérifiez les logs ci-dessus pour identifier les problèmes');
    }
    
    console.log('\n🎯 PROCHAINES ÉTAPES');
    console.log('==================');
    console.log('• Exécutez test-order-state-machine.js pour tester les transitions');
    console.log('• Vérifiez que les transitions invalides sont bien rejetées');
    console.log('• Testez tous les statuts de la machine à états');
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new SimpleOrderTester();
  tester.runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = SimpleOrderTester;