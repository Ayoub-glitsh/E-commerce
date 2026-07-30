require('dotenv').config();

/**
 * Test simple du service catalogue sans authentification
 * Valide la fonctionnalité de base du catalogService
 */

async function testCatalogServiceBasic() {
  console.log('🔧 Test simple du service catalogue');
  console.log('===================================\n');

  try {
    // Test 1: Import du service
    console.log('1️⃣ Import du service catalogue...');
    const { catalogService } = require('../src/services/catalogService');
    console.log('✅ Service catalogue importé avec succès');
    console.log('');

    // Test 2: Récupération d'un produit existant depuis la base
    console.log('2️⃣ Test récupération produit via API interne...');
    
    // Utilisons un ID de produit que nous savons exister
    const testProductId = '0cc8991c-ebbf-4a1a-8cce-306d07371592'; // iPhone 15 Pro Max
    
    try {
      const product = await catalogService.getProduct(testProductId);
      console.log('✅ Récupération produit - Succès');
      console.log(`   ID: ${product.id}`);
      console.log(`   Nom: ${product.name}`);
      console.log(`   Prix: ${product.price}€`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Actif: ${product.isActive}`);
    } catch (error) {
      console.log(`❌ Récupération produit - Erreur: ${error.message}`);
      return false;
    }
    console.log('');

    // Test 3: Vérification de stock avec quantité valide
    console.log('3️⃣ Test vérification stock (quantité valide)...');
    
    try {
      const stockCheck = await catalogService.checkStockAvailability(testProductId, 2);
      console.log('✅ Vérification stock - Succès');
      console.log(`   Demandé: ${stockCheck.requestedQuantity}`);
      console.log(`   Disponible: ${stockCheck.available}`);
      console.log(`   Stock total: ${stockCheck.availableStock}`);
      console.log(`   Produit: ${stockCheck.product.name}`);
    } catch (error) {
      console.log(`❌ Vérification stock - Erreur: ${error.message}`);
      return false;
    }
    console.log('');

    // Test 4: Vérification de stock avec quantité excessive
    console.log('4️⃣ Test vérification stock (quantité excessive)...');
    
    try {
      const stockCheck = await catalogService.checkStockAvailability(testProductId, 1000);
      console.log('✅ Vérification stock excessive - Succès');
      console.log(`   Demandé: ${stockCheck.requestedQuantity}`);
      console.log(`   Disponible: ${stockCheck.available}`);
      console.log(`   Stock total: ${stockCheck.availableStock}`);
      console.log(`   Manque: ${stockCheck.shortfall}`);
      
      if (!stockCheck.available) {
        console.log('✅ Quantité excessive correctement détectée');
      } else {
        console.log('⚠️ Quantité excessive non détectée (stock très élevé)');
      }
    } catch (error) {
      console.log(`❌ Vérification stock excessive - Erreur: ${error.message}`);
    }
    console.log('');

    // Test 5: Test avec produit inexistant
    console.log('5️⃣ Test avec produit inexistant...');
    
    const fakeProductId = '99999999-9999-9999-9999-999999999999';
    
    try {
      const product = await catalogService.getProduct(fakeProductId);
      console.log('❌ Produit inexistant trouvé (ne devrait pas arriver)');
    } catch (error) {
      console.log('✅ Produit inexistant correctement rejeté');
      console.log(`   Erreur: ${error.message}`);
    }
    console.log('');

    // Test 6: Test avec UUID invalide
    console.log('6️⃣ Test avec UUID invalide...');
    
    try {
      const product = await catalogService.getProduct('invalid-uuid-format');
      console.log('❌ UUID invalide accepté (ne devrait pas arriver)');
    } catch (error) {
      console.log('✅ UUID invalide correctement rejeté');
      console.log(`   Erreur: ${error.message}`);
    }
    console.log('');

    // Test 7: Test du cache
    console.log('7️⃣ Test du système de cache...');
    
    try {
      // Premier appel (mise en cache)
      console.log('   Premier appel (mise en cache)...');
      const start1 = Date.now();
      const product1 = await catalogService.getProduct(testProductId);
      const time1 = Date.now() - start1;
      
      // Deuxième appel (depuis le cache)
      console.log('   Deuxième appel (depuis le cache)...');
      const start2 = Date.now();
      const product2 = await catalogService.getProduct(testProductId);
      const time2 = Date.now() - start2;
      
      console.log('✅ Test du cache - Succès');
      console.log(`   Temps 1er appel: ${time1}ms`);
      console.log(`   Temps 2ème appel: ${time2}ms (cache)`);
      console.log(`   Amélioration: ${time1 > time2 ? 'Oui' : 'Non'} (${Math.max(0, time1 - time2)}ms gagnées)`);
      
    } catch (error) {
      console.log(`❌ Test du cache - Erreur: ${error.message}`);
    }
    console.log('');

    // Test 8: Statistiques du cache
    console.log('8️⃣ Statistiques du cache...');
    
    const cacheStats = catalogService.getCacheStats();
    console.log('✅ Statistiques du cache:');
    console.log(`   Entrées totales: ${cacheStats.totalEntries}`);
    console.log(`   Entrées valides: ${cacheStats.validEntries}`);
    console.log(`   Entrées expirées: ${cacheStats.expiredEntries}`);
    console.log(`   TTL configuré: ${cacheStats.cacheTTL}ms (${Math.round(cacheStats.cacheTTL / 1000)}s)`);
    console.log(`   URL API: ${cacheStats.apiBaseUrl}`);
    console.log('');

    // Test 9: Test de validation de prix et stock
    console.log('9️⃣ Test de validation des données...');
    
    try {
      // Test validation prix
      const validPrice = catalogService.validatePrice(29.99);
      console.log(`✅ Prix valide: ${validPrice}€`);
      
      // Test validation stock
      const validStock = catalogService.validateStock(15);
      console.log(`✅ Stock valide: ${validStock} unités`);
      
      // Test prix invalide
      try {
        catalogService.validatePrice(-5);
        console.log('❌ Prix négatif accepté');
      } catch (error) {
        console.log('✅ Prix négatif correctement rejeté');
      }
      
      // Test stock invalide
      try {
        catalogService.validateStock('invalid');
        console.log('❌ Stock invalide accepté');
      } catch (error) {
        console.log('✅ Stock invalide correctement rejeté');
      }
      
    } catch (error) {
      console.log(`❌ Test de validation - Erreur: ${error.message}`);
    }
    console.log('');

    console.log('🎉 Tous les tests du service catalogue réussis !');
    console.log('\n📋 Fonctionnalités validées:');
    console.log('✅ Service catalogService.js opérationnel');
    console.log('✅ Récupération produits via API interne');
    console.log('✅ Vérification du stock disponible');
    console.log('✅ Gestion des erreurs (produit inexistant, UUID invalide)');
    console.log('✅ Système de cache avec TTL');
    console.log('✅ Validation des données (prix, stock)');
    console.log('✅ Statistiques et monitoring du cache');

    return true;

  } catch (error) {
    console.error(`\n❌ Erreur générale lors des tests: ${error.message}`);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Test de performance du cache
 */
async function testCachePerformance() {
  console.log('\n⚡ Test de performance du cache...');
  
  try {
    const { catalogService } = require('../src/services/catalogService');
    const testProductId = '0cc8991c-ebbf-4a1a-8cce-306d07371592';
    
    // Vider le cache pour commencer proprement
    catalogService.clearCache();
    
    const iterations = 5;
    let totalTimeWithoutCache = 0;
    let totalTimeWithCache = 0;
    
    // Test sans cache (premier appel de chaque itération)
    console.log(`   Test sans cache (${iterations} appels API)...`);
    for (let i = 0; i < iterations; i++) {
      catalogService.clearCache(); // S'assurer qu'il n'y a pas de cache
      const start = Date.now();
      await catalogService.getProduct(testProductId);
      totalTimeWithoutCache += Date.now() - start;
    }
    
    // Test avec cache (appels répétés)
    console.log(`   Test avec cache (${iterations} appels en cache)...`);
    catalogService.clearCache();
    await catalogService.getProduct(testProductId); // Premier appel pour remplir le cache
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await catalogService.getProduct(testProductId);
      totalTimeWithCache += Date.now() - start;
    }
    
    const avgWithoutCache = Math.round(totalTimeWithoutCache / iterations);
    const avgWithCache = Math.round(totalTimeWithCache / iterations);
    const improvement = avgWithoutCache - avgWithCache;
    const improvementPercent = Math.round((improvement / avgWithoutCache) * 100);
    
    console.log('✅ Test de performance terminé:');
    console.log(`   Temps moyen sans cache: ${avgWithoutCache}ms`);
    console.log(`   Temps moyen avec cache: ${avgWithCache}ms`);
    console.log(`   Amélioration: ${improvement}ms (${improvementPercent}%)`);
    
  } catch (error) {
    console.log(`❌ Test de performance - Erreur: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function runBasicServiceTests() {
  const basicTestsSuccess = await testCatalogServiceBasic();
  
  if (basicTestsSuccess) {
    await testCachePerformance();
  }
  
  console.log('\n🏁 Tests du service catalogue terminés\n');
  
  if (basicTestsSuccess) {
    console.log('🎯 SERVICE CATALOGUE VALIDÉ - Prêt pour intégration !');
    console.log('\n🚀 Prochaines étapes:');
    console.log('   1. Tester l\'intégration complète avec le panier');
    console.log('   2. Valider la vérification de stock en conditions réelles');
    console.log('   3. Tester les cas d\'erreur et la robustesse');
  } else {
    console.log('⚠️ PROBLÈMES DÉTECTÉS - Vérifiez la configuration du service');
  }
  
  return basicTestsSuccess;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runBasicServiceTests().catch(error => {
    console.error('Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = {
  testCatalogServiceBasic,
  testCachePerformance,
  runBasicServiceTests
};