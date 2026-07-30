/**
 * Tests d'authentification de la wishlist (favoris)
 * FonctionnalitéHaute#1776
 * 
 * Vérifie que toutes les routes de la wishlist rejettent correctement
 * les requêtes non authentifiées avec HTTP 401
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

class WishlistAuthTester {
  constructor() {
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
   * TEST 1: GET /api/wishlist sans token
   */
  async testGetWishlistNoAuth() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist`);
      
      // Si on arrive ici, le test a échoué (pas d'erreur 401)
      this.recordTest(
        'GET /api/wishlist (sans token)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'GET /api/wishlist (sans token)',
        success,
        success ? 'Accès correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 2: POST /api/wishlist sans token
   */
  async testPostWishlistNoAuth() {
    try {
      const response = await axios.post(`${API_BASE}/wishlist`, {
        productId: 'b8d12345-1234-1234-1234-123456789abc'
      });
      
      this.recordTest(
        'POST /api/wishlist (sans token)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'POST /api/wishlist (sans token)',
        success,
        success ? 'Accès correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 3: DELETE /api/wishlist/:productId sans token
   */
  async testDeleteWishlistItemNoAuth() {
    try {
      const response = await axios.delete(`${API_BASE}/wishlist/b8d12345-1234-1234-1234-123456789abc`);
      
      this.recordTest(
        'DELETE /api/wishlist/:productId (sans token)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'DELETE /api/wishlist/:productId (sans token)',
        success,
        success ? 'Accès correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 4: DELETE /api/wishlist sans token
   */
  async testClearWishlistNoAuth() {
    try {
      const response = await axios.delete(`${API_BASE}/wishlist`);
      
      this.recordTest(
        'DELETE /api/wishlist (sans token)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'DELETE /api/wishlist (sans token)',
        success,
        success ? 'Accès correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 5: GET /api/wishlist/check/:productId sans token
   */
  async testCheckWishlistNoAuth() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist/check/b8d12345-1234-1234-1234-123456789abc`);
      
      this.recordTest(
        'GET /api/wishlist/check/:productId (sans token)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'GET /api/wishlist/check/:productId (sans token)',
        success,
        success ? 'Accès correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 6: Token invalide/expiré
   */
  async testInvalidToken() {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    try {
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      
      this.recordTest(
        'GET /api/wishlist (token invalide)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401 || error.response?.status === 403;
      this.recordTest(
        'GET /api/wishlist (token invalide)',
        success,
        success ? 'Token invalide correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 7: Token mal formaté
   */
  async testMalformedToken() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: {
          'Authorization': 'Bearer token-mal-forme'
        }
      });
      
      this.recordTest(
        'GET /api/wishlist (token mal formaté)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401 || error.response?.status === 403;
      this.recordTest(
        'GET /api/wishlist (token mal formaté)',
        success,
        success ? 'Token mal formaté correctement rejeté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * TEST 8: Header Authorization manquant
   */
  async testMissingAuthHeader() {
    try {
      const response = await axios.get(`${API_BASE}/wishlist`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.recordTest(
        'GET /api/wishlist (header Authorization manquant)',
        false,
        `Attendu 401, reçu ${response.status}`
      );
      
    } catch (error) {
      const success = error.response?.status === 401;
      this.recordTest(
        'GET /api/wishlist (header Authorization manquant)',
        success,
        success ? 'Header manquant correctement détecté' : `Status: ${error.response?.status || 'Network Error'}`
      );
    }
  }

  /**
   * Exécuter tous les tests d'authentification
   */
  async runAllTests() {
    console.log('🔐 TESTS D\'AUTHENTIFICATION DE LA WISHLIST');
    console.log('==========================================');
    console.log('Vérification que toutes les routes de wishlist rejettent les requêtes non authentifiées\n');
    
    // Tests des routes principales
    await this.testGetWishlistNoAuth();
    await this.testPostWishlistNoAuth();
    await this.testDeleteWishlistItemNoAuth();
    await this.testClearWishlistNoAuth();
    await this.testCheckWishlistNoAuth();
    
    // Tests de tokens invalides
    await this.testInvalidToken();
    await this.testMalformedToken();
    await this.testMissingAuthHeader();
    
    // Affichage des résultats
    this.displayResults();
  }

  /**
   * Afficher les résultats des tests
   */
  displayResults() {
    console.log('\n📊 RÉSULTATS DES TESTS D\'AUTHENTIFICATION');
    console.log('=========================================');
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
    
    console.log('\n🎯 ANALYSE DE SÉCURITÉ');
    console.log('======================');
    
    if (this.results.passed === this.results.total) {
      console.log('✅ SÉCURITÉ EXCELLENTE');
      console.log('  • Toutes les routes wishlist rejettent correctement les accès non authentifiés');
      console.log('  • Le middleware verifyToken fonctionne parfaitement');
      console.log('  • Protection contre les tokens invalides/malformés');
      console.log('  • Conformité avec les exigences de la fonctionnalité #1776');
    } else {
      console.log('⚠️  PROBLÈMES DE SÉCURITÉ DÉTECTÉS');
      console.log('  • Certaines routes ne rejettent pas les accès non authentifiés');
      console.log('  • Le middleware verifyToken pourrait ne pas être appliqué correctement');
      console.log('  • CORRECTION URGENTE NÉCESSAIRE avant mise en production');
    }
    
    console.log('\n📝 CONFORMITÉ SPÉCIFICATION');
    console.log('===========================');
    
    const routeTests = this.results.details.filter(test => 
      test.test.includes('GET /api/wishlist') || 
      test.test.includes('POST /api/wishlist') ||
      test.test.includes('DELETE /api/wishlist')
    );
    
    const routePassedCount = routeTests.filter(test => test.status === 'PASSED').length;
    console.log(`Routes sécurisées: ${routePassedCount}/${routeTests.length}`);
    
    if (routePassedCount === routeTests.length) {
      console.log('✅ Spécification respectée: "Chaque route doit vérifier l\'authentification"');
    } else {
      console.log('❌ Spécification NON respectée: certaines routes ne vérifient pas l\'authentification');
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new WishlistAuthTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erreur lors des tests d\'authentification:', error);
    process.exit(1);
  });
}

module.exports = WishlistAuthTester;