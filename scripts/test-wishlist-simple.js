/**
 * Test simple de la wishlist (favoris)
 * FonctionnalitéHaute#1776
 * 
 * Test de base pour vérifier que les 3 endpoints principaux fonctionnent :
 * - GET /api/wishlist
 * - POST /api/wishlist  
 * - DELETE /api/wishlist/:productId
 */

require('dotenv').config();
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

class SimpleWishlistTester {
  constructor() {
    this.accessToken = null;
    this.testProduct = null;
  }

  /**
   * Créer un utilisateur de test et s'authentifier
   */
  async authenticate() {
    try {
      console.log('🔧 Création utilisateur de test...');
      
      // Créer et connecter un utilisateur
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
   * Récupérer un produit pour les tests
   */
  async getTestProduct() {
    try {
      console.log('📦 Récupération d\'un produit de test...');
      
      const response = await axios.get(`${API_BASE}/products?limit=1`);
      this.testProduct = response.data.data.products[0];
      
      if (this.testProduct) {
        console.log(`✅ Produit récupéré: ${this.testProduct.name}`);
        return true;
      } else {
        console.log('❌ Aucun produit disponible');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur récupération produit:', error.response?.data?.message || error.message);
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
   * Test GET /api/wishlist
   */
  async testGetWishlist() {
    try {
      console.log('\n1️⃣ Test GET /api/wishlist...');
      
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.status === 200 && response.data.success) {
        console.log(`✅ GET wishlist réussi - ${response.data.data.itemsCount} item(s)`);
        return true;
      } else {
        console.log(`❌ GET wishlist échoué - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ GET wishlist échoué: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test POST /api/wishlist
   */
  async testAddToWishlist() {
    try {
      console.log('\n2️⃣ Test POST /api/wishlist...');
      
      const response = await axios.post(`${API_BASE}/wishlist`, 
        { productId: this.testProduct.id },
        { headers: this.getAuthHeaders() }
      );
      
      if (response.status === 201 && response.data.success) {
        console.log(`✅ POST wishlist réussi - Produit ajouté: ${this.testProduct.name}`);
        return true;
      } else {
        console.log(`❌ POST wishlist échoué - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ POST wishlist échoué: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Test DELETE /api/wishlist/:productId
   */
  async testRemoveFromWishlist() {
    try {
      console.log('\n3️⃣ Test DELETE /api/wishlist/:productId...');
      
      const response = await axios.delete(`${API_BASE}/wishlist/${this.testProduct.id}`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.status === 200 && response.data.success) {
        console.log(`✅ DELETE wishlist réussi - Produit retiré: ${this.testProduct.name}`);
        return true;
      } else {
        console.log(`❌ DELETE wishlist échoué - Status: ${response.status}`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ DELETE wishlist échoué: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  /**
   * Exécuter tous les tests simples
   */
  async runTests() {
    console.log('🧪 TEST SIMPLE DE LA WISHLIST (FAVORIS)');
    console.log('=======================================');
    
    // Configuration
    const authOk = await this.authenticate();
    if (!authOk) return;
    
    const productOk = await this.getTestProduct();
    if (!productOk) return;
    
    // Tests des 3 endpoints principaux
    const results = [];
    results.push(await this.testGetWishlist());
    results.push(await this.testAddToWishlist());
    results.push(await this.testRemoveFromWishlist());
    
    // Résultats
    console.log('\n📊 RÉSULTATS');
    console.log('============');
    
    const passedCount = results.filter(r => r).length;
    const totalCount = results.length;
    
    console.log(`✅ Tests réussis: ${passedCount}/${totalCount}`);
    console.log(`📈 Taux de réussite: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS !');
      console.log('✅ Les 3 endpoints principaux de la wishlist fonctionnent correctement');
      console.log('✅ FonctionnalitéHaute#1776 - Endpoints de base validés');
    } else {
      console.log('\n⚠️  Certains tests ont échoué');
      console.log('❌ Vérifiez les logs ci-dessus pour identifier les problèmes');
    }
    
    console.log('\n🎯 PROCHAINES ÉTAPES');
    console.log('==================');
    console.log('• Exécutez test-wishlist-complete.js pour des tests plus approfondis');
    console.log('• Exécutez test-wishlist-auth.js pour tester l\'authentification');
    console.log('• Vérifiez que les doublons sont bien évités');
    console.log('• Testez la validation des UUID produit');
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new SimpleWishlistTester();
  tester.runTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = SimpleWishlistTester;