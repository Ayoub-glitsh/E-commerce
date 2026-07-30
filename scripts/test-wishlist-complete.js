/**
 * Test complet du système de wishlist (favoris)
 * FonctionnalitéHaute#1776
 * 
 * Ce script teste toutes les fonctionnalités de la wishlist :
 * - GET /api/wishlist (lister les favoris)
 * - POST /api/wishlist (ajouter un produit)
 * - DELETE /api/wishlist/:productId (retirer un produit)
 * - DELETE /api/wishlist (vider la wishlist - bonus)
 * - GET /api/wishlist/check/:productId (vérifier présence - bonus)
 */

require('dotenv').config();
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

class WishlistTester {
  constructor() {
    this.testUser = null;
    this.accessToken = null;
    this.testProducts = [];
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
   * Créer un utilisateur de test et s'authentifier
   */
  async setupTestUser() {
    try {
      console.log('\n🔧 Configuration utilisateur de test...');
      
      // Créer un utilisateur
      const registerData = {
        email: faker.internet.email().toLowerCase(),
        password: 'TestPassword123!',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      };

      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
      
      if (registerResponse.status === 201) {
        console.log(`👤 Utilisateur créé: ${registerData.email}`);
        this.testUser = registerData;
        
        // Se connecter
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: registerData.email,
          password: registerData.password
        });
        
        this.accessToken = loginResponse.data.data.accessToken;
        console.log('🔑 Authentification réussie');
        
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création utilisateur:', error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Récupérer quelques produits pour les tests
   */
  async getTestProducts() {
    try {
      console.log('\n🛍️ Récupération des produits de test...');
      
      const response = await axios.get(`${API_BASE}/products?limit=5`);
      this.testProducts = response.data.data.products.slice(0, 3);
      
      if (this.testProducts.length >= 2) {
        console.log(`📦 ${this.testProducts.length} produits récupérés pour les tests`);
        this.testProducts.forEach(p => console.log(`  - ${p.name} (${p.id})`));
        return true;
      } else {
        console.log('❌ Pas assez de produits disponibles pour les tests');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error.response?.data?.message || error.message);
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
   * TEST 1: GET /api/wishlist - Récupérer wishlist vide
   */
  async testGetEmptyWishlist() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: this.getAuthHeaders()
      });
      
      const success = response.status === 200 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 0 &&
                     Array.isArray(response.data.data.items);
      
      this.recordTest(
        'GET /api/wishlist (wishlist vide)',
        success,
        success ? '' : `Status: ${response.status}, itemsCount: ${response.data.data?.itemsCount}`
      );
      
      return success;
      
    } catch (error) {
      this.recordTest('GET /api/wishlist (wishlist vide)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 2: POST /api/wishlist - Ajouter premier produit
   */
  async testAddFirstProduct() {
    try {
      const productId = this.testProducts[0].id;
      
      const response = await axios.post(`${API_BASE}/wishlist`, 
        { productId: productId },
        { headers: this.getAuthHeaders() }
      );
      
      const success = response.status === 201 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 1 &&
                     response.data.data.addedItem.productId === productId;
      
      this.recordTest(
        'POST /api/wishlist (ajouter premier produit)',
        success,
        success ? `Produit ${this.testProducts[0].name} ajouté` : `Status: ${response.status}`
      );
      
      return success;
      
    } catch (error) {
      this.recordTest('POST /api/wishlist (ajouter premier produit)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 3: POST /api/wishlist - Ajouter deuxième produit
   */
  async testAddSecondProduct() {
    try {
      const productId = this.testProducts[1].id;
      
      const response = await axios.post(`${API_BASE}/wishlist`, 
        { productId: productId },
        { headers: this.getAuthHeaders() }
      );
      
      const success = response.status === 201 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 2;
      
      this.recordTest(
        'POST /api/wishlist (ajouter deuxième produit)',
        success,
        success ? `Produit ${this.testProducts[1].name} ajouté` : `Status: ${response.status}`
      );
      
      return success;
      
    } catch (error) {
      this.recordTest('POST /api/wishlist (ajouter deuxième produit)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 4: POST /api/wishlist - Éviter les doublons (409)
   */
  async testPreventDuplicate() {
    try {
      const productId = this.testProducts[0].id; // Même produit qu'au test 2
      
      const response = await axios.post(`${API_BASE}/wishlist`, 
        { productId: productId },
        { headers: this.getAuthHeaders() }
      );
      
      // Ce test devrait échouer avec 409
      this.recordTest('POST /api/wishlist (éviter doublon)', false, 'Devrait retourner 409 mais a réussi');
      return false;
      
    } catch (error) {
      const success = error.response?.status === 409;
      
      this.recordTest(
        'POST /api/wishlist (éviter doublon)',
        success,
        success ? 'Doublon correctement rejeté avec 409' : `Status: ${error.response?.status}`
      );
      
      return success;
    }
  }

  /**
   * TEST 5: GET /api/wishlist - Wishlist avec 2 produits
   */
  async testGetWishlistWithItems() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: this.getAuthHeaders()
      });
      
      const success = response.status === 200 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 2 &&
                     Array.isArray(response.data.data.items) &&
                     response.data.data.items.length === 2;
      
      this.recordTest(
        'GET /api/wishlist (avec 2 produits)',
        success,
        success ? 'Wishlist contient 2 produits' : `itemsCount: ${response.data.data?.itemsCount}`
      );
      
      // Vérifier la structure des items
      if (success && response.data.data.items.length > 0) {
        const item = response.data.data.items[0];
        const hasCorrectStructure = item.id && item.productId && item.addedAt && item.product && item.product.name;
        
        this.recordTest(
          'GET /api/wishlist (structure item correcte)',
          hasCorrectStructure,
          hasCorrectStructure ? 'Structure item valide' : 'Structure item manquante'
        );
      }
      
      return success;
      
    } catch (error) {
      this.recordTest('GET /api/wishlist (avec 2 produits)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 6: GET /api/wishlist/check/:productId - Vérifier présence (bonus)
   */
  async testCheckProductInWishlist() {
    try {
      const productId = this.testProducts[0].id; // Produit dans la wishlist
      
      const response = await axios.get(`${API_BASE}/wishlist/check/${productId}`, {
        headers: this.getAuthHeaders()
      });
      
      const success = response.status === 200 && 
                     response.data.success === true &&
                     response.data.data.inWishlist === true &&
                     response.data.data.productId === productId;
      
      this.recordTest(
        'GET /api/wishlist/check/:productId (présent)',
        success,
        success ? 'Produit correctement détecté dans wishlist' : `inWishlist: ${response.data.data?.inWishlist}`
      );
      
      // Tester avec un produit NON présent
      if (this.testProducts[2]) {
        const notInWishlistResponse = await axios.get(`${API_BASE}/wishlist/check/${this.testProducts[2].id}`, {
          headers: this.getAuthHeaders()
        });
        
        const notInSuccess = notInWishlistResponse.status === 200 && 
                            notInWishlistResponse.data.data.inWishlist === false;
        
        this.recordTest(
          'GET /api/wishlist/check/:productId (absent)',
          notInSuccess,
          notInSuccess ? 'Produit correctement détecté comme absent' : `inWishlist: ${notInWishlistResponse.data.data?.inWishlist}`
        );
      }
      
      return success;
      
    } catch (error) {
      this.recordTest('GET /api/wishlist/check/:productId (présent)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 7: DELETE /api/wishlist/:productId - Retirer un produit
   */
  async testRemoveProduct() {
    try {
      const productId = this.testProducts[0].id;
      
      const response = await axios.delete(`${API_BASE}/wishlist/${productId}`, {
        headers: this.getAuthHeaders()
      });
      
      const success = response.status === 200 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 1 &&
                     response.data.data.removedProductId === productId;
      
      this.recordTest(
        'DELETE /api/wishlist/:productId (retirer produit)',
        success,
        success ? 'Produit retiré avec succès' : `Status: ${response.status}, itemsCount: ${response.data.data?.itemsCount}`
      );
      
      return success;
      
    } catch (error) {
      this.recordTest('DELETE /api/wishlist/:productId (retirer produit)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 8: DELETE /api/wishlist/:productId - Produit non présent (404)
   */
  async testRemoveNonExistentProduct() {
    try {
      const productId = this.testProducts[0].id; // Produit déjà retiré
      
      const response = await axios.delete(`${API_BASE}/wishlist/${productId}`, {
        headers: this.getAuthHeaders()
      });
      
      // Ce test devrait échouer avec 404
      this.recordTest('DELETE /api/wishlist/:productId (produit absent)', false, 'Devrait retourner 404 mais a réussi');
      return false;
      
    } catch (error) {
      const success = error.response?.status === 404;
      
      this.recordTest(
        'DELETE /api/wishlist/:productId (produit absent)',
        success,
        success ? 'Erreur 404 correctement retournée' : `Status: ${error.response?.status}`
      );
      
      return success;
    }
  }

  /**
   * TEST 9: DELETE /api/wishlist - Vider la wishlist (bonus)
   */
  async testClearWishlist() {
    try {
      const response = await axios.delete(`${API_BASE}/wishlist`, {
        headers: this.getAuthHeaders()
      });
      
      const success = response.status === 200 && 
                     response.data.success === true &&
                     response.data.data.itemsCount === 0 &&
                     Array.isArray(response.data.data.items) &&
                     response.data.data.items.length === 0;
      
      this.recordTest(
        'DELETE /api/wishlist (vider wishlist)',
        success,
        success ? 'Wishlist vidée avec succès' : `itemsCount: ${response.data.data?.itemsCount}`
      );
      
      return success;
      
    } catch (error) {
      this.recordTest('DELETE /api/wishlist (vider wishlist)', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * TEST 10: Tests d'authentification - Sans token
   */
  async testAuthenticationRequired() {
    try {
      // Tester GET sans token
      await axios.get(`${API_BASE}/wishlist`);
      this.recordTest('GET /api/wishlist (sans authentification)', false, 'Devrait retourner 401');
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'GET /api/wishlist (sans authentification)',
        success,
        success ? 'Authentification correctement requise' : `Status: ${error.response?.status}`
      );
    }

    try {
      // Tester POST sans token
      await axios.post(`${API_BASE}/wishlist`, { productId: this.testProducts[0].id });
      this.recordTest('POST /api/wishlist (sans authentification)', false, 'Devrait retourner 401');
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'POST /api/wishlist (sans authentification)',
        success,
        success ? 'Authentification correctement requise' : `Status: ${error.response?.status}`
      );
    }
  }

  /**
   * TEST 11: Validation des données - ProductId invalide
   */
  async testInvalidProductId() {
    try {
      const response = await axios.post(`${API_BASE}/wishlist`, 
        { productId: 'invalid-uuid' },
        { headers: this.getAuthHeaders() }
      );
      
      this.recordTest('POST /api/wishlist (productId invalide)', false, 'Devrait retourner 400');
      
    } catch (error) {
      const success = error.response?.status === 400;
      this.recordTest(
        'POST /api/wishlist (productId invalide)',
        success,
        success ? 'Validation UUID correctement appliquée' : `Status: ${error.response?.status}`
      );
    }
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🧪 TESTS COMPLETS DE LA WISHLIST (FAVORIS)');
    console.log('===========================================');
    
    // Configuration
    const userSetup = await this.setupTestUser();
    if (!userSetup) {
      console.log('❌ Impossible de configurer l\'utilisateur de test');
      return;
    }
    
    const productsSetup = await this.getTestProducts();
    if (!productsSetup) {
      console.log('❌ Impossible de récupérer les produits de test');
      return;
    }
    
    console.log('\n🧪 Exécution des tests...\n');
    
    // Tests des fonctionnalités principales
    await this.testGetEmptyWishlist();
    await this.testAddFirstProduct();
    await this.testAddSecondProduct();
    await this.testPreventDuplicate();
    await this.testGetWishlistWithItems();
    
    // Tests des fonctionnalités bonus
    await this.testCheckProductInWishlist();
    
    // Tests de suppression
    await this.testRemoveProduct();
    await this.testRemoveNonExistentProduct();
    await this.testClearWishlist();
    
    // Tests de sécurité
    await this.testAuthenticationRequired();
    await this.testInvalidProductId();
    
    // Affichage des résultats
    this.displayResults();
  }

  /**
   * Afficher les résultats des tests
   */
  displayResults() {
    console.log('\n📊 RÉSULTATS DES TESTS');
    console.log('=====================');
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
    
    console.log('\n🎯 CONFORMITÉ FONCTIONNALITÉ #1776');
    console.log('==================================');
    
    const coreTests = this.results.details.filter(test => 
      test.test.includes('GET /api/wishlist') && !test.test.includes('check') ||
      test.test.includes('POST /api/wishlist') && !test.test.includes('invalide') ||
      test.test.includes('DELETE /api/wishlist/:productId') && !test.test.includes('absent')
    );
    
    const corePassedCount = coreTests.filter(test => test.status === 'PASSED').length;
    console.log(`Fonctionnalités principales: ${corePassedCount}/${coreTests.length} ✅`);
    
    // Recommandations
    if (this.results.passed === this.results.total) {
      console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS !');
      console.log('✅ La wishlist est prête pour la production');
      console.log('✅ Toutes les fonctionnalités de la spécification sont implémentées');
      console.log('✅ La sécurité et la validation sont correctes');
    } else {
      console.log('\n⚠️  Des améliorations sont nécessaires avant la mise en production');
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new WishlistTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = WishlistTester;